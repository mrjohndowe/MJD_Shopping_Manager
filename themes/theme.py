"""
MJD Shopping Manager - Theme Manager
Modern Dark Theme by default with multi-palette styling for terminal and UI.
"""
from dataclasses import dataclass
from typing import Dict, Any, List


@dataclass
class ThemePalette:
    id: str
    name: str
    background: str
    card_bg: str
    primary: str
    secondary: str
    accent: str
    success: str
    warning: str
    danger: str
    text_primary: str
    text_muted: str
    border: str
    rich_primary: str
    rich_accent: str


THEME_PALETTES: Dict[str, ThemePalette] = {
    "dark": ThemePalette(
        id="dark",
        name="MJD Dark Matrix (Default)",
        background="#0f172a",
        card_bg="#1e293b",
        primary="#38bdf8",
        secondary="#818cf8",
        accent="#a855f7",
        success="#10b981",
        warning="#f59e0b",
        danger="#ef4444",
        text_primary="#f8fafc",
        text_muted="#94a3b8",
        border="#334155",
        rich_primary="bold cyan",
        rich_accent="magenta",
    ),
    "cyberpunk": ThemePalette(
        id="cyberpunk",
        name="Cyberpunk Amber Glow",
        background="#09090b",
        card_bg="#18181b",
        primary="#f59e0b",
        secondary="#ec4899",
        accent="#06b6d4",
        success="#22c55e",
        warning="#fbbf24",
        danger="#f43f5e",
        text_primary="#fef08a",
        text_muted="#a1a1aa",
        border="#27272a",
        rich_primary="bold yellow",
        rich_accent="bold bright_magenta",
    ),
    "emerald": ThemePalette(
        id="emerald",
        name="Emerald Forest",
        background="#064e3b",
        card_bg="#065f46",
        primary="#34d399",
        secondary="#10b981",
        accent="#6ee7b7",
        success="#059669",
        warning="#fcd34d",
        danger="#f87171",
        text_primary="#ecfdf5",
        text_muted="#a7f3d0",
        border="#047857",
        rich_primary="bold green",
        rich_accent="bold bright_green",
    ),
    "midnight": ThemePalette(
        id="midnight",
        name="Midnight OLED Pure",
        background="#000000",
        card_bg="#111111",
        primary="#60a5fa",
        secondary="#c084fc",
        accent="#38bdf8",
        success="#4ade80",
        warning="#fb923c",
        danger="#f87171",
        text_primary="#ffffff",
        text_muted="#71717a",
        border="#27272a",
        rich_primary="bold bright_blue",
        rich_accent="bold cyan",
    ),
    "nord": ThemePalette(
        id="nord",
        name="Nord Frost Arctic",
        background="#2e3440",
        card_bg="#3b4252",
        primary="#88c0d0",
        secondary="#81a1c1",
        accent="#b48ead",
        success="#a3be8c",
        warning="#ebcb8b",
        danger="#bf616a",
        text_primary="#eceff4",
        text_muted="#d8dee9",
        border="#4c566a",
        rich_primary="bold bright_cyan",
        rich_accent="bold purple",
    ),
}


class ThemeManager:
    """Manages active visual themes and Rich console styles."""

    def __init__(self, current_theme_id: str = "dark"):
        self.current_theme_id = current_theme_id if current_theme_id in THEME_PALETTES else "dark"

    @property
    def current(self) -> ThemePalette:
        return THEME_PALETTES.get(self.current_theme_id, THEME_PALETTES["dark"])

    def set_theme(self, theme_id: str) -> bool:
        if theme_id in THEME_PALETTES:
            self.current_theme_id = theme_id
            return True
        return False

    def list_themes(self) -> List[Dict[str, str]]:
        return [{"id": p.id, "name": p.name} for p in THEME_PALETTES.values()]
