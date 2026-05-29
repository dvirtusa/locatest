"""Semantic mock data layer — Google Nest UI Localization QA.

LocaTest manages localization testing for Google Nest firmware UI builds:
Nest Hub, Nest Hub Max, Nest Mini, Nest Cam, Nest Doorbell, and Nest Thermostat.
18,000 test cases across 9 UI surfaces and 10 locales, 5-month automation roadmap.
"""
from __future__ import annotations

import random

# ─────────────────────────────────────────────────────────────────────────────
# SEMANTIC DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────
SEMANTIC_DEFINITIONS = {
    "automation_coverage": "% of test cases executed by automated scripts without human intervention.",
    "pass_rate": "% of executed test cases that returned PASS in the latest build run.",
    "health_score": "Composite score 0-100: 60% pass_rate + 25% automation_coverage + 15% trend.",
    "P0": "Blocker — UI text untranslated or broken on device. Blocks firmware release.",
    "P1": "Critical — significant localization regression visible to end users.",
    "P2": "Major — noticeable issue with workaround available.",
    "P3": "Minor — cosmetic or edge-case. Schedule for next sprint.",
    "HIL": "Human-in-the-Loop — QA engineer decision required before agent proceeds.",
    "RCA": "Root Cause Analysis — agent identifies why strings are untranslated and proposes a fix.",
    "locale": "Language+region combination (e.g. pt-BR = Portuguese Brazil) tested on Nest devices.",
    "test_suite": "Named group of test cases covering a specific Nest UI surface.",
    "firmware_build": "OTA firmware image under test (e.g. Nest Hub 4.1.0.12-rc3).",
    "string_key": "i18n resource key in strings.xml / strings.json Nest UI resource bundle.",
    "buganizer": "Google internal bug tracker. LocaTest files issues here after RCA approval.",
    "nest_hub": "Google Nest Hub — touchscreen smart display running Cast OS.",
    "nest_mini": "Google Nest Mini — voice-only smart speaker.",
    "nest_cam": "Google Nest Cam — indoor/outdoor security camera with app UI.",
    "nest_thermostat": "Google Nest Thermostat — smart thermostat with touch + app UI.",
}

# ─────────────────────────────────────────────────────────────────────────────
# FIRMWARE BUILDS UNDER TEST
# ─────────────────────────────────────────────────────────────────────────────
FIRMWARE_BUILDS: dict[str, dict] = {
    "nest_hub_4.1.0.12": {
        "device": "Nest Hub (2nd gen)", "version": "4.1.0.12-rc3",
        "platform": "Cast OS 1.56", "status": "QA",
        "sprint": "Sprint 43", "cut_date": "2026-05-19",
        "locales_tested": 10, "total_failures": 89,
        "release_blocker": True,
        "blocker_reason": "3 P0 PT-BR failures in Home Screen + Assistant UI surfaces.",
    },
    "nest_hub_max_3.8.2.4": {
        "device": "Nest Hub Max", "version": "3.8.2.4-rc1",
        "platform": "Cast OS 1.56", "status": "QA",
        "sprint": "Sprint 43", "cut_date": "2026-05-21",
        "locales_tested": 10, "total_failures": 12,
        "release_blocker": False,
    },
    "nest_mini_2.9.1.7": {
        "device": "Nest Mini (2nd gen)", "version": "2.9.1.7-rc2",
        "platform": "Cast OS Lite 1.12", "status": "staging",
        "sprint": "Sprint 43", "cut_date": "2026-05-23",
        "locales_tested": 10, "total_failures": 4,
        "release_blocker": False,
    },
    "nest_cam_1.6.3.9": {
        "device": "Nest Cam (wired, 2nd gen)", "version": "1.6.3.9",
        "platform": "Android 12L", "status": "released",
        "sprint": "Sprint 42", "cut_date": "2026-05-05",
        "locales_tested": 8, "total_failures": 0,
        "release_blocker": False,
    },
    "nest_thermostat_6.4.0.3": {
        "device": "Nest Thermostat (4th gen)", "version": "6.4.0.3-rc1",
        "platform": "Nest OS 6.4", "status": "QA",
        "sprint": "Sprint 43", "cut_date": "2026-05-20",
        "locales_tested": 10, "total_failures": 22,
        "release_blocker": True,
        "blocker_reason": "AR-SA RTL layout broken in Temperature Control UI.",
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# LOCALES
# ─────────────────────────────────────────────────────────────────────────────
LOCALES: dict[str, dict] = {
    "pt-BR": {
        "code": "pt-BR", "name": "Portuguese (Brazil)", "region": "LATAM",
        "total": 1800, "automated": 1080, "manual": 720,
        "passed": 1754, "failed": 26, "skipped": 20,
        "automation_pct": 60.0, "pass_rate": 97.4, "health_score": 88,
        "active_issues": 3, "critical_issues": 1,
        "last_run": "2026-05-28T10:23:45", "trend": "declining",
        "devices_affected": ["Nest Hub (2nd gen)", "Nest Thermostat (4th gen)"],
        "notes": "Sprint 43 firmware cut missed 3 PT-BR string keys in Home Screen surface.",
    },
    "es-MX": {
        "code": "es-MX", "name": "Spanish (Mexico)", "region": "LATAM",
        "total": 1800, "automated": 1134, "manual": 666,
        "passed": 1789, "failed": 6, "skipped": 5,
        "automation_pct": 63.0, "pass_rate": 99.3, "health_score": 95,
        "active_issues": 1, "critical_issues": 0,
        "last_run": "2026-05-28T09:45:00", "trend": "stable",
        "devices_affected": ["Nest Hub (2nd gen)"],
    },
    "ja-JP": {
        "code": "ja-JP", "name": "Japanese (Japan)", "region": "APAC",
        "total": 1800, "automated": 1188, "manual": 612,
        "passed": 1785, "failed": 8, "skipped": 7,
        "automation_pct": 66.0, "pass_rate": 99.1, "health_score": 96,
        "active_issues": 2, "critical_issues": 0,
        "last_run": "2026-05-28T08:00:00", "trend": "improving",
        "devices_affected": ["Nest Mini (2nd gen)"],
        "notes": "CJK glyph clipping on Nest Hub ambient display — narrow font metric issue.",
    },
    "zh-CN": {
        "code": "zh-CN", "name": "Chinese Simplified (China)", "region": "APAC",
        "total": 1800, "automated": 1080, "manual": 720,
        "passed": 1776, "failed": 14, "skipped": 10,
        "automation_pct": 60.0, "pass_rate": 98.7, "health_score": 91,
        "active_issues": 2, "critical_issues": 1,
        "last_run": "2026-05-27T22:00:00", "trend": "stable",
        "devices_affected": ["Nest Hub (2nd gen)", "Nest Hub Max"],
        "notes": "Temperature unit label truncated in zh-CN on Nest Thermostat display.",
    },
    "de-DE": {
        "code": "de-DE", "name": "German (Germany)", "region": "EMEA",
        "total": 1800, "automated": 1224, "manual": 576,
        "passed": 1793, "failed": 4, "skipped": 3,
        "automation_pct": 68.0, "pass_rate": 99.7, "health_score": 98,
        "active_issues": 0, "critical_issues": 0,
        "last_run": "2026-05-28T06:30:00", "trend": "improving",
        "devices_affected": [],
    },
    "fr-FR": {
        "code": "fr-FR", "name": "French (France)", "region": "EMEA",
        "total": 1800, "automated": 1152, "manual": 648,
        "passed": 1788, "failed": 7, "skipped": 5,
        "automation_pct": 64.0, "pass_rate": 99.4, "health_score": 95,
        "active_issues": 1, "critical_issues": 0,
        "last_run": "2026-05-28T07:00:00", "trend": "stable",
        "devices_affected": ["Nest Hub Max"],
    },
    "ko-KR": {
        "code": "ko-KR", "name": "Korean (Korea)", "region": "APAC",
        "total": 1800, "automated": 1044, "manual": 756,
        "passed": 1779, "failed": 12, "skipped": 9,
        "automation_pct": 58.0, "pass_rate": 98.8, "health_score": 90,
        "active_issues": 2, "critical_issues": 0,
        "last_run": "2026-05-28T08:30:00", "trend": "stable",
        "devices_affected": ["Nest Hub (2nd gen)"],
    },
    "ar-SA": {
        "code": "ar-SA", "name": "Arabic (Saudi Arabia)", "region": "EMEA",
        "total": 1800, "automated": 936, "manual": 864,
        "passed": 1763, "failed": 20, "skipped": 17,
        "automation_pct": 52.0, "pass_rate": 97.9, "health_score": 85,
        "active_issues": 4, "critical_issues": 1,
        "last_run": "2026-05-27T20:00:00", "trend": "declining",
        "devices_affected": ["Nest Thermostat (4th gen)", "Nest Hub (2nd gen)"],
        "notes": "RTL layout broken in Nest Thermostat Temperature Control after Sprint 43 nav refactor.",
    },
    "hi-IN": {
        "code": "hi-IN", "name": "Hindi (India)", "region": "APAC",
        "total": 1800, "automated": 900, "manual": 900,
        "passed": 1768, "failed": 18, "skipped": 14,
        "automation_pct": 50.0, "pass_rate": 98.2, "health_score": 86,
        "active_issues": 3, "critical_issues": 0,
        "last_run": "2026-05-28T04:00:00", "trend": "stable",
        "devices_affected": ["Nest Hub (2nd gen)", "Nest Mini (2nd gen)"],
        "notes": "Devanagari script font metrics causing overflow on Nest Hub ambient card titles.",
    },
    "en-US": {
        "code": "en-US", "name": "English (United States)", "region": "NA",
        "total": 1800, "automated": 1440, "manual": 360,
        "passed": 1798, "failed": 1, "skipped": 1,
        "automation_pct": 80.0, "pass_rate": 99.9, "health_score": 99,
        "active_issues": 0, "critical_issues": 0,
        "last_run": "2026-05-28T11:00:00", "trend": "stable",
        "devices_affected": [],
        "notes": "Baseline locale. All keys present and validated.",
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# TEST SUITES  (Nest UI surfaces)
# ─────────────────────────────────────────────────────────────────────────────
TEST_SUITES: dict[str, dict] = {
    "home_screen": {
        "id": "suite_home_screen", "name": "Home Screen & Ambient Display",
        "description": "Nest Hub/Hub Max home screen cards: time/date, weather, calendar events, news headlines, commute ETA. Ambient mode photo captions and assistant prompt text.",
        "device": "Nest Hub, Nest Hub Max",
        "total": 3200, "automated": 1920, "manual": 1280,
        "passed": 3114, "failed": 57, "skipped": 29,
        "automation_pct": 60.0, "pass_rate": 97.5, "health_score": 88,
        "priority": "P0", "owner": "nest-hub-ui@google.com",
        "sprints_with_failures": ["Sprint 41", "Sprint 43"],
        "critical_locales": ["pt-BR", "ar-SA"],
        "automation_target_pct": 75,
        "tags": ["home-screen", "ambient", "weather", "calendar", "headlines"],
        "key_prefix": "home.",
    },
    "assistant_ui": {
        "id": "suite_assistant_ui", "name": "Google Assistant UI",
        "description": "Assistant response cards, query interpretation labels, action confirmations, error states, and mic/mute button accessibility labels on all Nest devices.",
        "device": "Nest Hub, Nest Hub Max, Nest Mini",
        "total": 2800, "automated": 1904, "manual": 896,
        "passed": 2776, "failed": 16, "skipped": 8,
        "automation_pct": 68.0, "pass_rate": 99.3, "health_score": 96,
        "priority": "P0", "owner": "assistant-ui@google.com",
        "sprints_with_failures": ["Sprint 43"],
        "critical_locales": ["ar-SA", "hi-IN"],
        "automation_target_pct": 72,
        "tags": ["assistant", "voice", "response-cards", "confirmation", "error"],
        "key_prefix": "assistant.",
    },
    "settings_menu": {
        "id": "suite_settings_menu", "name": "Device Settings Menu",
        "description": "Network settings, display brightness, Do Not Disturb, language selection, accessibility options, and factory reset flows across all Nest devices.",
        "device": "Nest Hub, Nest Hub Max, Nest Mini, Nest Cam, Nest Thermostat",
        "total": 2100, "automated": 1323, "manual": 777,
        "passed": 2084, "failed": 10, "skipped": 6,
        "automation_pct": 63.0, "pass_rate": 99.5, "health_score": 95,
        "priority": "P1", "owner": "device-settings@google.com",
        "sprints_with_failures": ["Sprint 42"],
        "critical_locales": ["ja-JP", "zh-CN"],
        "automation_target_pct": 70,
        "tags": ["settings", "network", "dnd", "language", "accessibility"],
        "key_prefix": "settings.",
    },
    "temperature_control": {
        "id": "suite_temperature_control", "name": "Temperature Control UI",
        "description": "Nest Thermostat touch display: temperature labels (°C/°F), schedule labels, eco mode text, heating/cooling mode labels, and energy history cards.",
        "device": "Nest Thermostat",
        "total": 1950, "automated": 1209, "manual": 741,
        "passed": 1938, "failed": 8, "skipped": 4,
        "automation_pct": 62.0, "pass_rate": 99.6, "health_score": 96,
        "priority": "P0", "owner": "thermostat-ui@google.com",
        "sprints_with_failures": ["Sprint 43"],
        "critical_locales": ["ar-SA", "zh-CN"],
        "automation_target_pct": 70,
        "tags": ["thermostat", "temperature", "schedule", "eco-mode", "energy"],
        "key_prefix": "thermostat.",
    },
    "camera_ui": {
        "id": "suite_camera_ui", "name": "Nest Cam & Doorbell UI",
        "description": "Nest Cam/Doorbell app UI: live view labels, motion alert text, event timeline, person/package/animal detection labels, activity zone names.",
        "device": "Nest Cam, Nest Doorbell",
        "total": 1800, "automated": 1224, "manual": 576,
        "passed": 1793, "failed": 5, "skipped": 2,
        "automation_pct": 68.0, "pass_rate": 99.7, "health_score": 97,
        "priority": "P1", "owner": "nest-cam@google.com",
        "sprints_with_failures": [],
        "critical_locales": ["hi-IN"],
        "automation_target_pct": 72,
        "tags": ["camera", "doorbell", "motion", "detection", "timeline"],
        "key_prefix": "camera.",
    },
    "routines_automation": {
        "id": "suite_routines", "name": "Routines & Automation",
        "description": "Google Home routine builder: trigger labels, action descriptions, device group names, time-based schedule text, and routine confirmation dialogs.",
        "device": "Nest Hub, Nest Hub Max, Google Home app",
        "total": 1600, "automated": 960, "manual": 640,
        "passed": 1585, "failed": 9, "skipped": 6,
        "automation_pct": 60.0, "pass_rate": 99.3, "health_score": 93,
        "priority": "P1", "owner": "home-automation@google.com",
        "sprints_with_failures": ["Sprint 42"],
        "critical_locales": ["ko-KR"],
        "automation_target_pct": 65,
        "tags": ["routines", "automation", "schedule", "triggers", "google-home"],
        "key_prefix": "routines.",
    },
    "notifications_alerts": {
        "id": "suite_notifications", "name": "Notifications & Alerts",
        "description": "On-device notification banners, doorbell ring text, smoke/CO alarm alerts, package delivery notifications, and family sharing messages.",
        "device": "Nest Hub, Nest Hub Max, Nest Cam, Nest Doorbell",
        "total": 1550, "automated": 837, "manual": 713,
        "passed": 1534, "failed": 11, "skipped": 5,
        "automation_pct": 54.0, "pass_rate": 99.1, "health_score": 91,
        "priority": "P1", "owner": "notifications@google.com",
        "sprints_with_failures": ["Sprint 43"],
        "critical_locales": ["ar-SA", "ko-KR"],
        "automation_target_pct": 62,
        "tags": ["notifications", "alerts", "doorbell", "smoke-alarm", "family"],
        "key_prefix": "notification.",
    },
    "onboarding_setup": {
        "id": "suite_onboarding", "name": "Device Onboarding & Setup",
        "description": "First-time setup wizard: Wi-Fi selection, Google Account linking, room assignment, device naming, and privacy disclosure screens.",
        "device": "Nest Hub, Nest Hub Max, Nest Mini, Nest Cam, Nest Thermostat, Nest Doorbell",
        "total": 1800, "automated": 1080, "manual": 720,
        "passed": 1776, "failed": 14, "skipped": 10,
        "automation_pct": 60.0, "pass_rate": 98.7, "health_score": 90,
        "priority": "P0", "owner": "onboarding@google.com",
        "sprints_with_failures": ["Sprint 43"],
        "critical_locales": ["pt-BR", "zh-CN"],
        "automation_target_pct": 70,
        "tags": ["onboarding", "setup", "wifi", "account", "privacy"],
        "key_prefix": "setup.",
    },
    "media_playback": {
        "id": "suite_media", "name": "Media Playback & Cast",
        "description": "YouTube, Spotify, Google Photos cast labels; playback controls (play/pause/skip labels); volume UI; Now Playing cards; playlist and album titles.",
        "device": "Nest Hub, Nest Hub Max",
        "total": 1200, "automated": 660, "manual": 540,
        "passed": 1192, "failed": 5, "skipped": 3,
        "automation_pct": 55.0, "pass_rate": 99.6, "health_score": 94,
        "priority": "P2", "owner": "media-cast@google.com",
        "sprints_with_failures": [],
        "critical_locales": ["ja-JP"],
        "automation_target_pct": 60,
        "tags": ["media", "cast", "youtube", "spotify", "now-playing"],
        "key_prefix": "media.",
    },
}

TOTAL_TEST_CASES = sum(s["total"] for s in TEST_SUITES.values())   # 18,000
TOTAL_AUTOMATED  = sum(s["automated"] for s in TEST_SUITES.values())
TOTAL_MANUAL     = sum(s["manual"] for s in TEST_SUITES.values())
TOTAL_FAILED     = sum(s["failed"] for s in TEST_SUITES.values())

# ─────────────────────────────────────────────────────────────────────────────
# INDIVIDUAL TEST CASES
# ─────────────────────────────────────────────────────────────────────────────
TEST_CASES: list[dict] = [
    # ── Sprint 43 — Nest Hub Home Screen PT-BR failures ──────────────────────
    {
        "id": "LOC-NH-11198", "suite": "home_screen", "locale": "pt-BR",
        "device": "Nest Hub (2nd gen)", "firmware": "4.1.0.12-rc3",
        "name": "Home Screen weather card — 'Good Morning' greeting",
        "description": "Verify the morning greeting on the Nest Hub ambient display is shown in PT-BR.",
        "expected": "Bom Dia, Tayane", "actual": "Good Morning, Tayane",
        "status": "FAIL", "type": "automated", "priority": "P0",
        "error": "AssertionError: Expected 'Bom Dia, Tayane', got 'Good Morning, Tayane'. Key 'home.greeting.morning' missing from pt-BR strings bundle.",
        "sprint": "Sprint 43", "duration_ms": 1247,
        "last_run": "2026-05-28T10:23:45",
        "component": "NestHub/HomeScreen/Localization",
        "screenshot": "shot_LOC-NH-11198.png",
        "introduced_in": "Sprint 43",
        "tags": ["home-screen", "greeting", "pt-BR", "P0"],
    },
    {
        "id": "LOC-NH-11199", "suite": "home_screen", "locale": "pt-BR",
        "device": "Nest Hub (2nd gen)", "firmware": "4.1.0.12-rc3",
        "name": "Home Screen weather card — temperature unit label",
        "description": "Verify weather card shows temperature in PT-BR format.",
        "expected": "26°C — Ensolarado", "actual": "26°C — Sunny",
        "status": "FAIL", "type": "automated", "priority": "P0",
        "error": "AssertionError: Weather condition label falls back to en-US. Key 'home.weather.condition.sunny' missing from pt-BR bundle.",
        "sprint": "Sprint 43", "duration_ms": 892,
        "last_run": "2026-05-28T10:23:52",
        "component": "NestHub/HomeScreen/Weather",
        "screenshot": "shot_LOC-NH-11199.png",
        "introduced_in": "Sprint 43",
        "tags": ["home-screen", "weather", "pt-BR", "P0"],
    },
    {
        "id": "LOC-NH-11200", "suite": "home_screen", "locale": "pt-BR",
        "device": "Nest Hub (2nd gen)", "firmware": "4.1.0.12-rc3",
        "name": "Calendar event card — 'Today' label",
        "description": "Verify calendar event card shows 'Hoje' instead of 'Today'.",
        "expected": "Hoje", "actual": "Today",
        "status": "FAIL", "type": "automated", "priority": "P1",
        "error": "AssertionError: Expected 'Hoje', got 'Today'. Key 'home.calendar.today_label' missing from pt-BR bundle.",
        "sprint": "Sprint 43", "duration_ms": 2103,
        "last_run": "2026-05-28T10:24:01",
        "component": "NestHub/HomeScreen/Calendar",
        "screenshot": "shot_LOC-NH-11200.png",
        "introduced_in": "Sprint 43",
        "tags": ["home-screen", "calendar", "pt-BR"],
    },
    # ── Sprint 43 — Nest Thermostat AR-SA RTL failures ────────────────────────
    {
        "id": "LOC-NT-11201", "suite": "temperature_control", "locale": "ar-SA",
        "device": "Nest Thermostat (4th gen)", "firmware": "6.4.0.3-rc1",
        "name": "Temperature display — RTL digit order",
        "description": "Verify temperature digits and unit render in RTL order on Nest Thermostat display.",
        "expected": "°م 24 (RTL digits)", "actual": "24°C (LTR)",
        "status": "FAIL", "type": "automated", "priority": "P0",
        "error": "RTL layout not applied to temperature digit view after Sprint 43 display driver update.",
        "sprint": "Sprint 43", "duration_ms": 1567,
        "last_run": "2026-05-28T09:55:00",
        "component": "NestThermostat/TempDisplay/RTL",
        "screenshot": "shot_LOC-NT-11201.png",
        "introduced_in": "Sprint 43",
        "tags": ["thermostat", "temperature", "rtl", "ar-SA", "P0"],
    },
    {
        "id": "LOC-NT-11202", "suite": "temperature_control", "locale": "ar-SA",
        "device": "Nest Thermostat (4th gen)", "firmware": "6.4.0.3-rc1",
        "name": "Eco mode label — Arabic translation",
        "description": "Verify Eco mode label shows in Arabic on the thermostat display.",
        "expected": "وضع الاقتصاد", "actual": "Eco Mode",
        "status": "FAIL", "type": "automated", "priority": "P1",
        "error": "Key 'thermostat.mode.eco' missing from ar-SA bundle.",
        "sprint": "Sprint 43", "duration_ms": 1123,
        "last_run": "2026-05-28T09:56:00",
        "component": "NestThermostat/ModeDisplay",
        "screenshot": "shot_LOC-NT-11202.png",
        "introduced_in": "Sprint 43",
        "tags": ["thermostat", "eco-mode", "ar-SA"],
    },
    # ── Sprint 43 — Nest Hub Assistant UI failures ────────────────────────────
    {
        "id": "LOC-NH-11210", "suite": "assistant_ui", "locale": "hi-IN",
        "device": "Nest Hub (2nd gen)", "firmware": "4.1.0.12-rc3",
        "name": "Assistant error card — 'I didn't understand' message",
        "description": "Verify assistant error fallback message is shown in Hindi.",
        "expected": "मुझे समझ नहीं आया", "actual": "I didn't understand that",
        "status": "FAIL", "type": "automated", "priority": "P1",
        "error": "Key 'assistant.error.not_understood' missing from hi-IN bundle.",
        "sprint": "Sprint 43", "duration_ms": 987,
        "last_run": "2026-05-28T10:25:00",
        "component": "NestHub/AssistantUI/ErrorStates",
        "screenshot": "shot_LOC-NH-11210.png",
        "introduced_in": "Sprint 43",
        "tags": ["assistant", "error-state", "hi-IN"],
    },
    {
        "id": "LOC-NH-11211", "suite": "assistant_ui", "locale": "zh-CN",
        "device": "Nest Hub Max", "firmware": "3.8.2.4-rc1",
        "name": "Assistant confirmation — 'Done' action label",
        "description": "Verify assistant action confirmation label shows in Simplified Chinese.",
        "expected": "完成", "actual": "Done",
        "status": "FAIL", "type": "automated", "priority": "P1",
        "error": "Key 'assistant.action.done' missing from zh-CN bundle.",
        "sprint": "Sprint 43", "duration_ms": 765,
        "last_run": "2026-05-28T10:26:00",
        "component": "NestHubMax/AssistantUI/Confirmation",
        "screenshot": "shot_LOC-NH-11211.png",
        "introduced_in": "Sprint 43",
        "tags": ["assistant", "confirmation", "zh-CN"],
    },
    # ── Passing examples ──────────────────────────────────────────────────────
    {
        "id": "LOC-NH-10001", "suite": "home_screen", "locale": "es-MX",
        "device": "Nest Hub (2nd gen)", "firmware": "4.1.0.12-rc3",
        "name": "Home Screen greeting — ES-MX",
        "expected": "Buenos días, Carlos", "actual": "Buenos días, Carlos",
        "status": "PASS", "type": "automated", "priority": "P0",
        "sprint": "Sprint 43", "duration_ms": 1102,
        "last_run": "2026-05-28T10:20:00",
        "component": "NestHub/HomeScreen/Localization",
        "tags": ["home-screen", "greeting", "es-MX"],
    },
    {
        "id": "LOC-NH-10002", "suite": "home_screen", "locale": "de-DE",
        "device": "Nest Hub (2nd gen)", "firmware": "4.1.0.12-rc3",
        "name": "Home Screen greeting — DE-DE",
        "expected": "Guten Morgen, Lukas", "actual": "Guten Morgen, Lukas",
        "status": "PASS", "type": "automated", "priority": "P0",
        "sprint": "Sprint 43", "duration_ms": 1045,
        "last_run": "2026-05-28T10:20:30",
        "component": "NestHub/HomeScreen/Localization",
        "tags": ["home-screen", "greeting", "de-DE"],
    },
    {
        "id": "LOC-NT-10001", "suite": "temperature_control", "locale": "de-DE",
        "device": "Nest Thermostat (4th gen)", "firmware": "6.4.0.3-rc1",
        "name": "Temperature display — DE-DE °C label",
        "expected": "21°C — Heizen", "actual": "21°C — Heizen",
        "status": "PASS", "type": "automated", "priority": "P0",
        "sprint": "Sprint 43", "duration_ms": 890,
        "last_run": "2026-05-28T10:18:00",
        "component": "NestThermostat/TempDisplay",
        "tags": ["thermostat", "temperature", "de-DE"],
    },
    {
        "id": "LOC-NC-10001", "suite": "camera_ui", "locale": "fr-FR",
        "device": "Nest Cam (wired)", "firmware": "1.6.3.9",
        "name": "Motion alert — FR-FR notification text",
        "expected": "Mouvement détecté devant la porte", "actual": "Mouvement détecté devant la porte",
        "status": "PASS", "type": "automated", "priority": "P1",
        "sprint": "Sprint 43", "duration_ms": 743,
        "last_run": "2026-05-28T10:15:00",
        "component": "NestCam/Notifications",
        "tags": ["camera", "motion", "fr-FR"],
    },
    {
        "id": "LOC-NM-10001", "suite": "onboarding_setup", "locale": "ja-JP",
        "device": "Nest Mini (2nd gen)", "firmware": "2.9.1.7-rc2",
        "name": "Setup wizard — Wi-Fi selection screen JA-JP",
        "expected": "Wi-Fiネットワークを選択", "actual": "Wi-Fiネットワークを選択",
        "status": "PASS", "type": "automated", "priority": "P0",
        "sprint": "Sprint 43", "duration_ms": 1234,
        "last_run": "2026-05-28T10:12:00",
        "component": "NestMini/Onboarding/WiFi",
        "tags": ["onboarding", "wifi", "ja-JP"],
    },
    {
        "id": "LOC-MAN-5001", "suite": "home_screen", "locale": "hi-IN",
        "device": "Nest Hub (2nd gen)", "firmware": "4.1.0.12-rc3",
        "name": "Ambient display — Hindi Devanagari font rendering",
        "description": "Manual test: verify Devanagari characters render correctly without clipping on ambient display.",
        "expected": "All Devanagari characters visible, no clipping", "actual": "All visible",
        "status": "PASS", "type": "manual", "priority": "P1",
        "sprint": "Sprint 43", "duration_ms": None,
        "last_run": "2026-05-27T16:00:00",
        "tester": "qa-engineer-2@google.com",
        "component": "NestHub/AmbientDisplay",
        "tags": ["home-screen", "devanagari", "hi-IN", "manual", "font-rendering"],
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# SPRINT DATA
# ─────────────────────────────────────────────────────────────────────────────
SPRINTS: dict[str, dict] = {
    "Sprint 40": {
        "id": 40, "start": "2026-04-07", "end": "2026-04-18",
        "firmware_builds": ["nest_hub_4.0.8.9", "nest_mini_2.8.4.2"],
        "total_run": 10241, "passed": 10198, "failed": 43, "skipped": 0,
        "new_failures": 12, "fixed": 31, "flaky": 5,
        "automation_pct_at_end": 57.0,
        "locales_with_failures": ["ar-SA", "hi-IN", "ko-KR"],
        "highlights": "Completed Nest Mini onboarding suite automation. 57% coverage.",
        "status": "closed",
    },
    "Sprint 41": {
        "id": 41, "start": "2026-04-21", "end": "2026-05-02",
        "firmware_builds": ["nest_hub_4.0.9.3", "nest_thermostat_6.3.9.1"],
        "total_run": 10534, "passed": 10487, "failed": 47, "skipped": 0,
        "new_failures": 18, "fixed": 29, "flaky": 7,
        "automation_pct_at_end": 59.0,
        "locales_with_failures": ["pt-BR", "ar-SA", "zh-CN"],
        "highlights": "Home Screen suite expanded. PT-BR had 8 new failures in weather cards.",
        "status": "closed",
    },
    "Sprint 42": {
        "id": 42, "start": "2026-05-05", "end": "2026-05-16",
        "firmware_builds": ["nest_cam_1.6.3.9", "nest_hub_4.1.0.8"],
        "total_run": 10798, "passed": 10763, "failed": 35, "skipped": 0,
        "new_failures": 9, "fixed": 21, "flaky": 4,
        "automation_pct_at_end": 60.5,
        "locales_with_failures": ["zh-CN", "ko-KR", "hi-IN"],
        "highlights": "Nest Cam locale tests fully green. Best pass rate this quarter.",
        "status": "closed",
    },
    "Sprint 43": {
        "id": 43, "start": "2026-05-19", "end": "2026-05-30",
        "firmware_builds": ["nest_hub_4.1.0.12", "nest_thermostat_6.4.0.3", "nest_mini_2.9.1.7"],
        "total_run": 9823, "passed": 9696, "failed": 127, "skipped": 0,
        "new_failures": 89, "fixed": 38, "flaky": 6,
        "automation_pct_at_end": 60.7,
        "locales_with_failures": ["pt-BR", "ar-SA", "zh-CN", "hi-IN"],
        "highlights": "Home Screen greeting + weather keys missing from PT-BR bundle. Thermostat RTL broken for AR-SA.",
        "status": "active",
        "open_rca_count": 2,
        "pending_buganizer_count": 3,
        "release_blockers": ["nest_hub_4.1.0.12", "nest_thermostat_6.4.0.3"],
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# AUTOMATION ROADMAP
# ─────────────────────────────────────────────────────────────────────────────
ROADMAP: list[dict] = [
    {
        "month": 1, "label": "Jan 2026", "theme": "Onboarding + Camera Suite Automation",
        "start_pct": 42.0, "end_pct": 50.0, "target_pct": 50.0, "actual_pct": 49.3,
        "cases_automated": 1440, "cases_added": 0,
        "suites_focused": ["onboarding_setup", "camera_ui"],
        "milestones": ["Nest Cam locale harness", "Onboarding wizard automation"],
        "status": "completed", "variance": -0.7,
    },
    {
        "month": 2, "label": "Feb 2026", "theme": "Home Screen + Assistant UI",
        "start_pct": 49.3, "end_pct": 56.0, "target_pct": 56.0, "actual_pct": 56.4,
        "cases_automated": 1188, "cases_added": 0,
        "suites_focused": ["home_screen", "assistant_ui"],
        "milestones": ["Home Screen weather card auto", "Assistant response card tests"],
        "status": "completed", "variance": +0.4,
    },
    {
        "month": 3, "label": "Mar 2026", "theme": "Thermostat + Settings + RTL",
        "start_pct": 56.4, "end_pct": 62.0, "target_pct": 62.0, "actual_pct": 61.7,
        "cases_automated": 1008, "cases_added": 200,
        "suites_focused": ["temperature_control", "settings_menu"],
        "milestones": ["RTL automation for ar-SA thermostat", "Settings menu full sweep"],
        "status": "completed", "variance": -0.3,
    },
    {
        "month": 4, "label": "Apr 2026", "theme": "Notifications + Routines + Cross-locale",
        "start_pct": 61.7, "end_pct": 67.0, "target_pct": 67.0, "actual_pct": 60.7,
        "cases_automated": 900, "cases_added": 0,
        "suites_focused": ["notifications_alerts", "routines_automation"],
        "milestones": ["Notification banner automation", "Routine trigger tests"],
        "status": "in_progress", "variance": -6.3,
        "risk": "Sprint 43 regressions (89 new failures) consuming QA bandwidth.",
    },
    {
        "month": 5, "label": "May 2026", "theme": "Gap Closure — reach 70% target",
        "start_pct": 60.7, "end_pct": 70.0, "target_pct": 70.0, "actual_pct": None,
        "cases_automated": 1656, "cases_added": 0,
        "suites_focused": ["home_screen", "assistant_ui", "temperature_control"],
        "milestones": ["Fix Sprint 43 blockers", "All P0 suites ≥75% auto"],
        "status": "planned",
        "risk": "Must resolve 2 release blockers (Nest Hub + Nest Thermostat) first.",
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# RCA REPORTS
# ─────────────────────────────────────────────────────────────────────────────
RCA_REPORTS: list[dict] = [
    {
        "id": "RCA-2026-043-001",
        "title": "PT-BR Nest Hub Home Screen — Sprint 43 Missing String Keys",
        "sprint": "Sprint 43", "created": "2026-05-28T10:30:00",
        "status": "pending_approval", "confidence_pct": 97,
        "test_cases": ["LOC-NH-11198", "LOC-NH-11199", "LOC-NH-11200"],
        "locales_affected": ["pt-BR"],
        "devices_affected": ["Nest Hub (2nd gen)"],
        "firmware_affected": "nest_hub_4.1.0.12-rc3",
        "root_cause": (
            "Sprint 43 Home Screen feature update added 3 new UI string keys "
            "(home.greeting.morning, home.weather.condition.sunny, home.calendar.today_label) "
            "to the en-US Nest Hub strings bundle. These keys were NOT propagated to the PT-BR "
            "translation bundle before the firmware build was cut. Cast OS string lookup falls "
            "back to en-US when a key is missing, causing PT-BR locale Nest Hubs to display "
            "English text on the home screen."
        ),
        "fix_type": "Bundle update",
        "proposed_fix": {
            "file": "nest-hub/res/values-pt-rBR/strings.xml",
            "changes": [
                {"key": "home.greeting.morning", "value": "Bom Dia, {name}"},
                {"key": "home.weather.condition.sunny", "value": "Ensolarado"},
                {"key": "home.calendar.today_label", "value": "Hoje"},
            ],
        },
        "buganizer_draft": {
            "id": "b/337821049",
            "title": "[PT-BR] Nest Hub Home Screen — 3 missing string keys in Sprint 43 firmware",
            "severity": "P0", "component": "NestHub/HomeScreen/Localization",
            "assignee": "@jadawilson",
        },
        "estimated_fix_hours": 2,
        "other_locales_checked": True,
        "other_locales_affected": False,
    },
    {
        "id": "RCA-2026-043-002",
        "title": "AR-SA Nest Thermostat RTL Layout Regression — Sprint 43",
        "sprint": "Sprint 43", "created": "2026-05-28T11:15:00",
        "status": "in_analysis", "confidence_pct": 84,
        "test_cases": ["LOC-NT-11201", "LOC-NT-11202"],
        "locales_affected": ["ar-SA"],
        "devices_affected": ["Nest Thermostat (4th gen)"],
        "firmware_affected": "nest_thermostat_6.4.0.3-rc1",
        "root_cause": (
            "Sprint 43 Thermostat display driver update replaced the legacy TemperatureView "
            "with a new Material3 component. The new component does not inherit RTL layout "
            "direction from the Android locale setting — the layoutDirection attribute must "
            "be explicitly set to 'locale' for ar-SA and other RTL locales."
        ),
        "fix_type": "Code fix + bundle update",
        "proposed_fix": {
            "files": [
                {
                    "file": "nest-thermostat/res/layout/temperature_display.xml",
                    "change": "Add android:layoutDirection='locale' to TemperatureView root"
                },
                {
                    "file": "nest-thermostat/res/values-ar-rSA/strings.xml",
                    "change": "Add thermostat.mode.eco = 'وضع الاقتصاد'"
                },
            ]
        },
        "buganizer_draft": {
            "id": "b/337821050",
            "title": "[AR-SA] Nest Thermostat RTL regression — temperature display broken in Sprint 43",
            "severity": "P0", "component": "NestThermostat/TempDisplay/RTL",
            "assignee": "@alinajamali",
        },
        "estimated_fix_hours": 4,
        "other_locales_checked": False,
        "other_locales_affected": None,
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# BUGANIZER ISSUES
# ─────────────────────────────────────────────────────────────────────────────
BUGANIZER_ISSUES: list[dict] = [
    {
        "id": "b/337821049",
        "title": "[PT-BR] Nest Hub Home Screen — 3 missing string keys in Sprint 43 firmware",
        "severity": "P0", "status": "DRAFT",
        "component": "NestHub/HomeScreen/Localization",
        "assignee": "@jadawilson", "reporter": "locatest-agent@google.com",
        "sprint": "Sprint 43", "created": "2026-05-28T10:30:00",
        "firmware": "4.1.0.12-rc3",
        "rca_id": "RCA-2026-043-001",
        "test_cases": ["LOC-NH-11198", "LOC-NH-11199", "LOC-NH-11200"],
        "approved": False,
        "developer_comment": (
            "**Root Cause:** Sprint 43 Home Screen update added 3 string keys to the en-US "
            "Nest Hub bundle but did not propagate them to pt-BR before the firmware cut.\n\n"
            "**Affected Test Cases:** LOC-NH-11198 (P0), LOC-NH-11199 (P0), LOC-NH-11200 (P1)\n"
            "**Firmware:** Nest Hub 4.1.0.12-rc3 (Cast OS 1.56)\n\n"
            "**Proposed Fix** — nest-hub/res/values-pt-rBR/strings.xml:\n"
            "+ home.greeting.morning → 'Bom Dia, {name}'\n"
            "+ home.weather.condition.sunny → 'Ensolarado'\n"
            "+ home.calendar.today_label → 'Hoje'\n\n"
            "No other locales affected. Fix estimated: 2 hours. Re-run LOC-NH-11198/99/200 to verify."
        ),
    },
    {
        "id": "b/337821050",
        "title": "[AR-SA] Nest Thermostat RTL regression — temperature display broken in Sprint 43",
        "severity": "P0", "status": "DRAFT",
        "component": "NestThermostat/TempDisplay/RTL",
        "assignee": "@alinajamali", "reporter": "locatest-agent@google.com",
        "sprint": "Sprint 43", "created": "2026-05-28T11:15:00",
        "firmware": "6.4.0.3-rc1",
        "rca_id": "RCA-2026-043-002",
        "test_cases": ["LOC-NT-11201", "LOC-NT-11202"],
        "approved": False,
        "developer_comment": None,
    },
    {
        "id": "b/335012345",
        "title": "[ZH-CN] Nest Hub Max — assistant 'Done' label falls back to English",
        "severity": "P1", "status": "ASSIGNED",
        "component": "NestHubMax/AssistantUI/Confirmation",
        "assignee": "@wangxiaolong", "reporter": "qa-engineer-1@google.com",
        "sprint": "Sprint 42", "created": "2026-05-12T14:00:00",
        "firmware": "3.8.2.4-rc1",
        "rca_id": None,
        "test_cases": ["LOC-NH-11211"],
        "approved": True,
        "developer_comment": "Identified missing key in zh-CN bundle. Fix in progress.",
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# SIMULATION SCENARIOS
# ─────────────────────────────────────────────────────────────────────────────
SIMULATION_SCENARIOS: list[dict] = [
    {
        "id": "SIM-001",
        "name": "PT-BR Nest Hub Home Screen — Sprint 43 Regression",
        "suite": "home_screen", "locale": "pt-BR",
        "device": "Nest Hub (2nd gen)", "firmware": "4.1.0.12-rc3",
        "type": "regression", "total_cases": 47, "passed": 44, "failed": 3,
        "duration_seconds": 142, "status": "completed",
        "hil_triggered": True,
        "hil_reason": "3 P0 failures detected — RCA requires human approval before Buganizer filing.",
        "rca_id": "RCA-2026-043-001",
        "run_at": "2026-05-28T10:20:00",
    },
    {
        "id": "SIM-002",
        "name": "AR-SA Nest Thermostat RTL Smoke",
        "suite": "temperature_control", "locale": "ar-SA",
        "device": "Nest Thermostat (4th gen)", "firmware": "6.4.0.3-rc1",
        "type": "smoke", "total_cases": 28, "passed": 26, "failed": 2,
        "duration_seconds": 87, "status": "completed",
        "hil_triggered": True,
        "hil_reason": "RTL regression detected — human review required before escalation.",
        "rca_id": "RCA-2026-043-002",
        "run_at": "2026-05-28T09:50:00",
    },
    {
        "id": "SIM-003",
        "name": "DE-DE Full Regression — All Surfaces",
        "suite": "all", "locale": "de-DE",
        "device": "All Nest Devices", "firmware": "various",
        "type": "full_regression", "total_cases": 1800, "passed": 1798, "failed": 2,
        "duration_seconds": 5420, "status": "completed",
        "hil_triggered": False, "rca_id": None,
        "run_at": "2026-05-28T06:00:00",
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# GENERATED TEST CASES (registry for agent-created tests)
# ─────────────────────────────────────────────────────────────────────────────
GENERATED_TEST_CASES: list[dict] = []


def register_generated_test(test: dict) -> None:
    """Add an agent-generated test case to the live registry."""
    GENERATED_TEST_CASES.append(test)


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
def get_dashboard_metrics() -> dict:
    total_auto = TOTAL_AUTOMATED
    auto_pct   = round(total_auto / TOTAL_TEST_CASES * 100, 1)
    total_pass = sum(s["passed"] for s in TEST_SUITES.values())
    pass_pct   = round(total_pass / TOTAL_TEST_CASES * 100, 1)
    active_month = next((r for r in ROADMAP if r["status"] == "in_progress"), ROADMAP[-1])
    pending_approvals = sum(1 for i in BUGANIZER_ISSUES if not i["approved"])
    release_blockers = [
        b["device"] for b in FIRMWARE_BUILDS.values() if b.get("release_blocker")
    ]
    p0_fails = [tc for tc in TEST_CASES if tc["status"] == "FAIL" and tc.get("priority") == "P0"]

    return {
        "total_test_cases": TOTAL_TEST_CASES,
        "total_automated": total_auto,
        "automation_pct": auto_pct,
        "automation_target_pct": 70.0,
        "automation_gap_pct": round(70.0 - auto_pct, 1),
        "pass_rate_pct": pass_pct,
        "total_failures": TOTAL_FAILED,
        "critical_failures": len(p0_fails),
        "active_sprint": "Sprint 43",
        "active_sprint_failures": SPRINTS["Sprint 43"]["failed"],
        "active_sprint_new_failures": SPRINTS["Sprint 43"]["new_failures"],
        "locales_with_issues": [loc for loc, d in LOCALES.items() if d["failed"] > 0],
        "open_rca_count": len([r for r in RCA_REPORTS if r["status"] != "closed"]),
        "pending_approval_count": pending_approvals,
        "manual_tester_count": 92,
        "firmware_builds_in_qa": [k for k, v in FIRMWARE_BUILDS.items() if v["status"] == "QA"],
        "release_blockers": release_blockers,
        "roadmap_month": active_month["label"],
        "roadmap_current_pct": active_month.get("actual_pct") or auto_pct,
        "roadmap_target_pct": active_month["target_pct"],
        "roadmap_variance": active_month.get("variance"),
        "health_score": round((pass_pct * 0.6 + auto_pct * 0.25 + 85 * 0.15), 1),
        "generated_test_count": len(GENERATED_TEST_CASES),
    }
