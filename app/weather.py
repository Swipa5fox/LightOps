from __future__ import annotations

import json
import re
import threading
import time
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from . import __version__
from .settings import settings


_DISTRICTS: dict[str, list[tuple[str, float, float]]] = {
    # 为 UI 中展示的城市精选的区级数据。Open-Meteo 地理编码对中文地名
    # 只能解析到市级，因此当用户选择这些城市之一时，我们也会列出其下辖区。
    "北京": [
        ("东城区", 39.928, 116.418),
        ("西城区", 39.915, 116.366),
        ("朝阳区", 39.929, 116.443),
        ("海淀区", 39.959, 116.298),
        ("丰台区", 39.858, 116.287),
        ("石景山区", 39.906, 116.222),
        ("通州区", 39.909, 116.657),
        ("昌平区", 40.221, 116.235),
    ],
    "上海": [
        ("黄浦区", 31.230, 121.484),
        ("徐汇区", 31.184, 121.436),
        ("长宁区", 31.220, 121.424),
        ("静安区", 31.229, 121.448),
        ("普陀区", 31.250, 121.395),
        ("虹口区", 31.265, 121.505),
        ("杨浦区", 31.260, 121.526),
        ("浦东新区", 31.222, 121.544),
    ],
    "广州": [
        ("天河区", 23.135, 113.361),
        ("越秀区", 23.129, 113.266),
        ("海珠区", 23.090, 113.317),
        ("白云区", 23.158, 113.273),
        ("黄埔区", 23.181, 113.481),
        ("番禺区", 22.937, 113.384),
        ("花都区", 23.405, 113.221),
        ("南沙区", 22.802, 113.525),
    ],
    "深圳": [
        ("福田区", 22.521, 114.055),
        ("罗湖区", 22.548, 114.131),
        ("南山区", 22.533, 113.930),
        ("宝安区", 22.555, 113.884),
        ("龙岗区", 22.720, 114.246),
        ("龙华区", 22.685, 114.030),
    ],
    "成都": [
        ("锦江区", 30.657, 104.081),
        ("青羊区", 30.675, 104.062),
        ("金牛区", 30.691, 104.052),
        ("武侯区", 30.644, 104.067),
        ("成华区", 30.660, 104.101),
        ("双流区", 30.574, 103.923),
    ],
    "杭州": [
        ("上城区", 30.242, 120.170),
        ("拱墅区", 30.319, 120.142),
        ("西湖区", 30.274, 120.131),
        ("滨江区", 30.211, 120.211),
        ("萧山区", 30.160, 120.271),
        ("余杭区", 30.300, 120.001),
    ],
    "武汉": [
        ("江岸区", 30.594, 114.278),
        ("江汉区", 30.582, 114.270),
        ("硚口区", 30.581, 114.215),
        ("汉阳区", 30.557, 114.230),
        ("武昌区", 30.553, 114.307),
        ("洪山区", 30.504, 114.343),
    ],
    "西安": [
        ("新城区", 34.272, 108.961),
        ("碑林区", 34.230, 108.940),
        ("莲湖区", 34.273, 108.937),
        ("雁塔区", 34.220, 108.951),
        ("未央区", 34.298, 108.948),
        ("灞桥区", 34.265, 109.064),
    ],
    "南京": [
        ("玄武区", 32.044, 118.798),
        ("秦淮区", 32.033, 118.795),
        ("建邺区", 32.005, 118.766),
        ("鼓楼区", 32.066, 118.770),
        ("栖霞区", 32.122, 118.880),
        ("雨花台区", 31.996, 118.779),
    ],
    "重庆": [
        ("渝中区", 29.553, 106.575),
        ("江北区", 29.606, 106.557),
        ("南岸区", 29.523, 106.644),
        ("九龙坡区", 29.504, 106.512),
        ("沙坪坝区", 29.541, 106.459),
        ("渝北区", 29.718, 106.631),
        ("北碚区", 29.825, 106.437),
        ("巴南区", 29.405, 106.541),
    ],
}


_DISTRICT_INDEX: dict[str, str] = {
    district: city
    for city, items in _DISTRICTS.items()
    for district, _lat, _lon in items
}


_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
_CACHE_LOCK = threading.Lock()
_CACHE: dict[tuple[float, float], tuple[float, dict[str, Any]]] = {}


_WEATHER_TIPS: dict[int, str] = {
    0: "阳光正好，外出注意防晒 ☀️",
    1: "云淡风轻，适合出门走走 🌤️",
    2: "云层渐厚，体感比较舒服 ☁️",
    3: "天空阴沉，体感稍凉 ☁️",
    45: "雾气较重，开车请慢行 🌫️",
    48: "浓雾笼罩，能见度低 🌫️",
    51: "细雨绵绵，记得带伞 🌦️",
    53: "细雨绵绵，记得带伞 🌦️",
    55: "细雨较密，记得带伞 🌦️",
    56: "有冻雨，路面湿滑，注意保暖 🌧️",
    57: "有冻雨，路面湿滑，注意保暖 🌧️",
    61: "雨天路滑，小心感冒 🌧️",
    63: "雨天路滑，小心感冒 🌧️",
    65: "雨势较大，注意带伞 🌧️",
    66: "有冻雨，路面可能结冰 🌧️",
    67: "有冻雨，路面可能结冰 🌧️",
    71: "天寒地冻，注意保暖 ❄️",
    73: "天寒地冻，注意保暖 ❄️",
    75: "雪势较大，减少外出 ❄️",
    77: "小心路面打滑 ❄️",
    80: "阵雨说来就来，伞别忘了 ☔",
    81: "阵雨说来就来，伞别忘了 ☔",
    82: "阵雨较强，注意防雨 ☔",
    85: "可能下雪，注意保暖 ❄️",
    86: "可能下雪，注意保暖 ❄️",
    95: "雷暴天气，尽量待在室内 ⛈️",
    96: "有冰雹，关好门窗，注意安全 ⛈️",
    99: "有冰雹，关好门窗，注意安全 ⛈️",
}


def _weather_tip(code: Any) -> str:
    number = _safe_number(code)
    if number is None:
        return "保持好心情，关注天气变化 🍀"
    return _WEATHER_TIPS.get(int(number), "保持好心情，关注天气变化 🍀")


def _safe_number(value: Any) -> float | int | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return int(number) if number.is_integer() else round(number, 1)


def _first(values: Any) -> Any:
    return values[0] if isinstance(values, list) and values else None


def _get_json(url: str, params: dict[str, Any], limit: int, what: str) -> dict[str, Any]:
    request = Request(
        f"{url}?{urlencode(params)}",
        headers={"User-Agent": f"LightOps/{__version__} weather-widget"},
    )
    with urlopen(request, timeout=settings.weather_request_timeout_seconds) as response:
        if response.status != 200:
            raise RuntimeError(f"{what} returned HTTP {response.status}")
        return json.loads(response.read(limit).decode("utf-8"))


def _fetch_remote(latitude: float, longitude: float) -> dict[str, Any]:
    return _get_json(
        _FORECAST_URL,
        {
            "latitude": f"{latitude:.2f}",
            "longitude": f"{longitude:.2f}",
            "current": (
                "temperature_2m,apparent_temperature,relative_humidity_2m,"
                "weather_code,wind_speed_10m,is_day"
            ),
            "daily": (
                "weather_code,temperature_2m_max,temperature_2m_min,"
                "precipitation_probability_max,sunrise,sunset"
            ),
            "timezone": "auto",
            "forecast_days": "1",
        },
        256_000,
        "weather provider",
    )


def _normalize(payload: dict[str, Any]) -> dict[str, Any]:
    current = payload.get("current") or {}
    daily = payload.get("daily") or {}
    current_code = _safe_number(current.get("weather_code"))
    daily_code = _safe_number(_first(daily.get("weather_code")))
    return {
        "current": {
            "temperature": _safe_number(current.get("temperature_2m")),
            "apparent_temperature": _safe_number(current.get("apparent_temperature")),
            "humidity": _safe_number(current.get("relative_humidity_2m")),
            "weather_code": current_code,
            "wind_speed": _safe_number(current.get("wind_speed_10m")),
            "is_day": bool(current.get("is_day", 1)),
            "observed_at": current.get("time"),
        },
        "today": {
            "date": _first(daily.get("time")),
            "weather_code": daily_code if daily_code is not None else current_code,
            "temperature_max": _safe_number(_first(daily.get("temperature_2m_max"))),
            "temperature_min": _safe_number(_first(daily.get("temperature_2m_min"))),
            "precipitation_probability": _safe_number(
                _first(daily.get("precipitation_probability_max"))
            ),
            "sunrise": _first(daily.get("sunrise")),
            "sunset": _first(daily.get("sunset")),
        },
        "timezone": payload.get("timezone") or "auto",
        "timezone_abbreviation": payload.get("timezone_abbreviation") or "",
        "location_label": "当前位置",
        "location_precision_km": 1,
        "tip": _weather_tip(current_code if current_code is not None else daily_code),
        "source": "Open-Meteo",
    }


def current_weather(latitude: float, longitude: float) -> dict[str, Any]:
    # 在缓存或向上游发送前，将坐标四舍五入到约 1 公里。这对本地天气足够，
    # 同时避免存储或传输精确位置。
    latitude = round(latitude, 2)
    longitude = round(longitude, 2)
    key = (latitude, longitude)
    now = time.monotonic()

    with _CACHE_LOCK:
        cached = _CACHE.get(key)
        if cached and now - cached[0] < settings.weather_cache_seconds:
            return cached[1]

    result = _normalize(_fetch_remote(latitude, longitude))
    with _CACHE_LOCK:
        _CACHE[key] = (now, result)
        # 即使很多地点请求，也保持缓存小（面向轻量服务器）。
        if len(_CACHE) > 64:
            oldest = min(_CACHE, key=lambda item: _CACHE[item][0])
            _CACHE.pop(oldest, None)
    return result


def _format_label(item: dict[str, Any]) -> str:
    name = str(item.get("name") or "").strip()
    admin3 = str(item.get("admin3") or "").strip()
    admin2 = str(item.get("admin2") or "").strip()
    admin1 = str(item.get("admin1") or "").strip()
    # 区级：例如 "广州-天河区"；否则回退到行政区划链。
    # 跳过与城市同名的行政级别（例如在名称 "苏州" 旁的 "苏州市"），
    # 以避免 "苏州-苏州市" 这类冗余标签。
    if admin3 and admin3 != name and _strip_city_suffix(admin3) != name:
        return f"{name}-{admin3}"
    if admin2 and admin2 != name and _strip_city_suffix(admin2) != name:
        return f"{name}-{admin2}"
    if admin1 and admin1 != name and _strip_city_suffix(admin1) != name:
        return f"{name}-{admin1}"
    return name


def _strip_city_suffix(term: str) -> str:
    """规范化行政后缀，使 "广州市" 能匹配 "广州"。

    去除末尾的 市 / 地区 / 自治州 / 盟。以 区 / 县 结尾的区名保持不变，
    这样它们仍能与精选的区级表匹配。
    """
    return re.sub(r"(市|地区|自治州|盟)$", "", (term or "").strip())


def _make_district_candidate(city: str, district_item: tuple[str, float, float]) -> dict[str, Any]:
    district, lat, lon = district_item
    return {
        "label": f"{city}-{district}",
        "latitude": float(lat),
        "longitude": float(lon),
        "country": "中国",
        "admin1": "",
        "admin2": city,
        "admin3": district,
    }


def _city_district_candidates(city: str) -> list[dict[str, Any]]:
    return [_make_district_candidate(city, item) for item in _DISTRICTS[city]]


def _district_candidates(name: str) -> list[dict[str, Any]] | None:
    """根据精选的城市/区级表解析自由文本的地名查询。

    对于精选城市（例如 广州），支持以下所有形式：
      * 城市名称：            "广州"
      * 带后缀的城市名：      "广州市"
      * 区名：                "海珠区"
      * "城市-区"：           "广州-海珠区" / "广州市-海珠区"
      * "城市-区" 简写：      "广州-海珠"（部分区名匹配）
    当查询未命中任何精选条目时返回 None，以便调用方
    回退到 Open-Meteo 地理编码。
    """
    cleaned = (name or "").strip()
    if not cleaned:
        return None
    # 精确的城市名称或精确的区名。
    if cleaned in _DISTRICTS:
        return _city_district_candidates(cleaned)
    if cleaned in _DISTRICT_INDEX:
        return _city_district_candidates(_DISTRICT_INDEX[cleaned])
    # 带行政后缀的城市名，例如 "广州市" -> "广州"。
    stripped = _strip_city_suffix(cleaned)
    if stripped in _DISTRICTS:
        return _city_district_candidates(stripped)
    # "城市-区" 组合形式（城市部分可带可选的 市 后缀）。
    if "-" in cleaned:
        city_term, _, district_term = cleaned.partition("-")
        city_term = _strip_city_suffix(city_term)
        district_term = district_term.strip()
        if city_term in _DISTRICTS:
            if district_term:
                exact = next(
                    (d for d in _DISTRICTS[city_term] if d[0] == district_term),
                    None,
                )
                if exact:
                    return [_make_district_candidate(city_term, exact)]
                # 部分区名匹配，例如 "广州-海珠" -> 海珠区。
                partial = next(
                    (
                        d
                        for d in _DISTRICTS[city_term]
                        if district_term and district_term in d[0]
                    ),
                    None,
                )
                if partial:
                    return [_make_district_candidate(city_term, partial)]
                # 已知城市下未识别的区：全部列出，以便 UI 细化。
                return _city_district_candidates(city_term)
            return _city_district_candidates(city_term)
    return None


def _open_meteo_geocode(name: str, count: int) -> list[dict[str, Any]]:
    """对地名调用 Open-Meteo 地理编码，并规范化返回结果。"""
    payload = _get_json(
        _GEOCODING_URL,
        {
            "name": name,
            "count": str(max(1, min(count, 20))),
            "language": "zh",
            "format": "json",
        },
        64_000,
        "geocoding",
    )
    candidates: list[dict[str, Any]] = []
    for item in payload.get("results") or []:
        latitude = _safe_number(item.get("latitude"))
        longitude = _safe_number(item.get("longitude"))
        if latitude is None or longitude is None:
            continue
        candidates.append(
            {
                "label": _format_label(item),
                "latitude": float(latitude),
                "longitude": float(longitude),
                "country": str(item.get("country") or ""),
                "admin1": str(item.get("admin1") or ""),
                "admin2": str(item.get("admin2") or ""),
                "admin3": str(item.get("admin3") or ""),
            }
        )
    return candidates


def geocode_places(name: str, count: int = 10) -> list[dict[str, Any]]:
    """将自由文本的地名解析为一个或多个候选位置。

    每个候选包含 ``label``（例如 "广州-天河区"）、
    ``latitude`` 和 ``longitude``。无匹配时返回空列表。
    精选的城市/区来自本地表，因此 UI 可以细化到区级
    （Open-Meteo 对中文地名只能解析到市级）。
    """
    curated = _district_candidates(name)
    if curated is not None:
        return curated
    # Open-Meteo 期望裸城市名："苏州市" 会失败但 "苏州" 可以，因此去除
    # 行政后缀。若去除后无结果，则使用原始字符串重试。
    stripped = _strip_city_suffix(name)
    if stripped and stripped != name:
        candidates = _open_meteo_geocode(stripped, count)
        if candidates:
            return candidates
    return _open_meteo_geocode(name, count)


def current_weather_by_name(name: str) -> dict[str, Any]:
    """在无需浏览器定位的情况下，查找指定地名的当前天气。

    响应包含一个 ``candidates`` 列表：当地名解析到多个区时
    （例如 "广州" 的所有区），会返回每个区，以便 UI 让用户细化到区级。
    """
    candidates = geocode_places(name, count=10)
    if not candidates:
        raise RuntimeError(f"未找到地点：{name}")
    top = candidates[0]
    result = current_weather(top["latitude"], top["longitude"])
    result["location_label"] = top["label"]
    # 列出所有共享同一顶层名称的区（例如所有 "广州-天河区"）。
    top_name = top.get("admin3") or top.get("admin2") or top.get("admin1") or top["label"]
    same_city = [
        c
        for c in candidates
        if c is not top
        and (
            c.get("admin2") == top.get("admin2")
            or c.get("admin1") == top.get("admin1")
        )
        and (c.get("admin3") or c.get("admin2") or c.get("admin1"))
    ]
    if same_city:
        all_options = [top] + same_city
    else:
        all_options = [top]
    result["candidates"] = [
        {
            "label": c["label"],
            "latitude": round(c["latitude"], 2),
            "longitude": round(c["longitude"], 2),
        }
        for c in all_options
    ]
    result["location_precision_km"] = 1
    return result
