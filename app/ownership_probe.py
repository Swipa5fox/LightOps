"""Root-side probe: record which systemd unit actually uses which service.

Run from lightops-inspect.timer (root). Writes /var/lib/lightops/ownership.json
for the unprivileged app to read (edges carry a 10-minute TTL so short-lived
connections like periodic agent reports keep the label visible):

- a unit consumes a service when it holds an established TCP connection to a
  port that service listens on;
- a unit also consumes a service when it holds an established unix-socket
  pair with a process of that service (covers fastcgi/mysql socket clients).

Process-to-unit attribution reads /proc/<pid>/cgroup; socket-to-process
attribution needs root (ss -p), which is why this runs outside the sandboxed
app service.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

OUTPUT_FILE = Path(
    os.getenv("LIGHTOPS_OWNERSHIP_FILE", "/var/lib/lightops/ownership.json")
)
_SS = os.getenv("LIGHTOPS_SS_PATH", "/usr/sbin/ss")
_RUN_ENV = {"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C"}

_SERVICE_SUFFIX = ".service"
_PID_PATTERN = re.compile(r"pid=(\d+)")


def run_ss(args: list[str]) -> str:
    try:
        result = subprocess.run(
            [_SS, *args],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=10,
            check=False,
            env=_RUN_ENV,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        print(f"socket inspection unavailable: {exc}", file=sys.stderr)
        return ""
    if result.returncode != 0:
        print(
            f"socket inspection failed: {result.stderr.strip()[:200]}",
            file=sys.stderr,
        )
        return ""
    return result.stdout


def process_units() -> dict[int, str]:
    """Map every readable pid to its systemd unit name (suffix stripped)."""
    units: dict[int, str] = {}
    try:
        entries = list(Path("/proc").iterdir())
    except OSError:
        return units
    for entry in entries:
        if not entry.name.isdigit():
            continue
        try:
            text = (entry / "cgroup").read_text(
                encoding="utf-8", errors="replace"
            )
        except OSError:
            continue
        for line in text.splitlines():
            if "/system.slice/" not in line:
                continue
            name = line.rstrip().rsplit("/", 1)[-1]
            if name.endswith(_SERVICE_SUFFIX):
                units[int(entry.name)] = name[: -len(_SERVICE_SUFFIX)]
            break
    return units


def unit_pids(line: str, units: dict[int, str]) -> set[str]:
    pids = _PID_PATTERN.findall(line)
    return {units[int(pid)] for pid in pids if int(pid) in units}


def dependency_edges(providers: set[str]) -> dict[str, set[str]]:
    """systemd 声明式依赖：谁 Requires/Wants 我，谁就在用我。

    连接采样抓不到声明式依赖（例如 nginx.service 依赖 php-fpm），这条
    信号是静态且确定的，与运行时连接互为补充。
    """
    edges: dict[str, set[str]] = {}
    for provider in sorted(providers):
        try:
            result = subprocess.run(
                [
                    os.getenv("LIGHTOPS_SYSTEMCTL_PATH", "/usr/bin/systemctl"),
                    "list-dependencies",
                    "--reverse",
                    "--plain",
                    "--no-pager",
                    f"{provider}.service",
                ],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=10,
                check=False,
                env=_RUN_ENV,
            )
        except (OSError, subprocess.SubprocessError):
            continue
        if result.returncode != 0:
            continue
        for line in result.stdout.splitlines():
            name = line.strip().lstrip("●•* ").strip()
            if not name.endswith(_SERVICE_SUFFIX) or name.endswith(".target"):
                continue
            dependent = name[: -len(_SERVICE_SUFFIX)]
            if dependent != provider:
                edges.setdefault(provider, set()).add(dependent)
    return edges


def build_snapshot() -> tuple[
    dict[str, set[str]], dict[str, set[int]], dict[str, dict[str, int]]
]:
    units = process_units()
    edges: dict[str, set[str]] = {}
    service_ports: dict[str, set[int]] = {}
    inbound: dict[str, dict[str, int]] = {}
    local_addresses: set[str] = set()

    def count_inbound(provider: str, external: bool) -> None:
        counts = inbound.setdefault(provider, {"external": 0, "local": 0})
        counts["external" if external else "local"] += 1

    # TCP listeners: "LISTEN 0 511 0.0.0.0:1224 0.0.0.0:* users:(...)"
    listeners: dict[int, set[str]] = {}
    for line in run_ss(["-H", "-ltnp"]).splitlines():
        tokens = line.split()
        if len(tokens) < 5 or tokens[0] != "LISTEN":
            continue
        local = tokens[3]
        port_text = local.rsplit(":", 1)[-1]
        if not port_text.isdigit():
            continue
        local_addresses.add(local.rsplit(":", 1)[0])
        providers = unit_pids(line, units)
        if providers:
            port = int(port_text)
            listeners.setdefault(port, set()).update(providers)
            for provider in providers:
                service_ports.setdefault(provider, set()).add(port)

    # Established TCP: state filter drops the State column, so the layout is
    # "Recv-Q Send-Q Local:Port Peer:Port users:(...)". The client row carries
    # the listener port as its peer.
    for line in run_ss(["-H", "-tnp", "state", "established"]).splitlines():
        tokens = line.split()
        if len(tokens) < 4:
            continue
        local = tokens[2]
        peer = tokens[3]
        local_port = local.rsplit(":", 1)[-1]
        peer_port = peer.rsplit(":", 1)[-1]
        peer_address = peer.rsplit(":", 1)[0]
        consumers = unit_pids(line, units)
        if local_port.isdigit():
            # 本端是监听方：这条是别人的入站连接，按对端是否本机分类计数。
            for provider in listeners.get(int(local_port), set()):
                count_inbound(provider, peer_address not in local_addresses)
        if not consumers or not peer_port.isdigit():
            continue
        for provider in listeners.get(int(peer_port), set()):
            for consumer in consumers:
                if consumer != provider:
                    edges.setdefault(provider, set()).add(consumer)

    # Unix sockets: "u_str STATE RQ SQ Path LocalInode Peer PeerInode users".
    # An established pair whose remote end belongs to another unit means one
    # unit is talking to the other (fastcgi, mysql.sock, ...). Direction:
    # - a line whose Path is a known LISTEN path is a server-side accepted
    #   socket: that path's unit is the server, the peer inode's unit(s) the
    #   client (works even when both units also listen, e.g. zabbix-server
    #   holding its own rtc.sock while talking to mysqld over mysql.sock);
    # - otherwise only claim an edge when exactly one side owns a listening
    #   socket (that side is the server); both or neither -> skip the guess.
    unix_lines: list[tuple[str, list[str]]] = []
    inode_units: dict[int, set[str]] = {}
    listen_paths: dict[str, set[str]] = {}
    listener_units: set[str] = set()
    # -a is required: unlike TCP, `ss -xnp` without it omits unix LISTEN rows.
    for line in run_ss(["-H", "-axnp"]).splitlines():
        tokens = line.split()
        if len(tokens) < 8 or not tokens[0].startswith("u_"):
            continue
        unix_lines.append((line, tokens))
        if not tokens[5].isdigit():
            continue
        owners = unit_pids(line, units)
        if owners:
            inode_units.setdefault(int(tokens[5]), set()).update(owners)
            if tokens[1] == "LISTEN" and tokens[4].startswith("/"):
                listen_paths.setdefault(tokens[4], set()).update(owners)
                listener_units.update(owners)
    for line, tokens in unix_lines:
        if tokens[1] != "ESTAB" or not tokens[7].isdigit():
            continue
        holders = unit_pids(line, units)
        if not holders:
            continue
        peer_inode = int(tokens[7])
        path = tokens[4]
        if path in listen_paths:
            servers = listen_paths[path]
            clients = inode_units.get(peer_inode, set())
            for server in servers:
                # unix 套接字只在本机可达，一律算本机入站连接。
                count_inbound(server, False)
                for client in clients:
                    if client != server:
                        edges.setdefault(server, set()).add(client)
            continue
        servers = inode_units.get(peer_inode, set())
        for holder in holders:
            for server in servers:
                if holder == server:
                    continue
                if (holder in listener_units) == (server in listener_units):
                    continue
                if server in listener_units:
                    edges.setdefault(server, set()).add(holder)
                else:
                    edges.setdefault(holder, set()).add(server)

    # 声明式依赖兜底：连接采样看不到 Requires/Wants 关系（nginx → php-fpm）。
    providers = set(service_ports)
    for owners in listen_paths.values():
        providers.update(owners)
    for provider, dependents in dependency_edges(providers).items():
        edges.setdefault(provider, set()).update(dependents)

    return edges, service_ports, inbound


# 连接是瞬时的（agent2 周期上报、fastcgi 按请求建连），把观测到的边持久化
# 到状态文件并带 TTL 衰减，标签才不会在采样间隙消失。
_STATE_FILE = Path(
    os.getenv("LIGHTOPS_OWNERSHIP_STATE_FILE", "/var/lib/lightops/ownership_state.json")
)
_EDGE_TTL_SECONDS = 600


def _load_state() -> dict[str, dict[str, float]]:
    try:
        data = json.loads(_STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return data if isinstance(data, dict) else {}


def _save_state(state: dict[str, dict[str, float]]) -> None:
    temporary = _STATE_FILE.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(state), encoding="utf-8")
    os.chmod(temporary, 0o644)
    os.replace(temporary, _STATE_FILE)


def main() -> None:
    edges, ports, inbound = build_snapshot()
    now = time.time()
    state = _load_state()
    for provider, consumers in edges.items():
        seen = state.setdefault(provider, {})
        for consumer in consumers:
            seen[consumer] = now
    for provider in list(state):
        seen = state[provider]
        for consumer in list(seen):
            if now - seen[consumer] > _EDGE_TTL_SECONDS:
                del seen[consumer]
        if not seen:
            del state[provider]
    _save_state(state)
    payload = {
        "generated_at": now,
        "consumers": {
            provider: sorted(who) for provider, who in state.items()
        },
        "ports": {name: sorted(held) for name, held in ports.items()},
        "inbound": inbound,
    }
    temporary = OUTPUT_FILE.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(payload), encoding="utf-8")
    os.chmod(temporary, 0o644)
    os.replace(temporary, OUTPUT_FILE)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 - probe failure must be visible
        print(f"ownership probe failed: {exc}", file=sys.stderr)
        sys.exit(1)
