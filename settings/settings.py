"""
MJD Shopping Manager - Settings Manager
Configures themes, currency, database backends, receipt widths, folders, and tax presets.
"""
from dataclasses import dataclass, field
from decimal import Decimal
from pathlib import Path
from typing import Dict, Any, Optional
from config.constants import (
    DATA_DIR,
    EXPORTS_DIR,
    HISTORY_DIR,
    SQLITE_DB_PATH,
    DEFAULT_BUDGET,
    DEFAULT_CURRENCY,
    DEFAULT_STATE_TAX_RATE,
    DEFAULT_COUNTY_TAX_RATE,
    DEFAULT_CITY_TAX_RATE,
)
from storage.storage import StorageManager


@dataclass
class DatabaseSettings:
    backend: str = "sqlite"  # 'sqlite', 'mysql', or 'both'
    sqlite_path: str = str(SQLITE_DB_PATH)
    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_database: str = "mjd_shopping_db"
    mysql_table: str = "shopping_trips"


@dataclass
class AppConfig:
    theme: str = "dark"
    currency: str = DEFAULT_CURRENCY
    currency_symbol: str = "$"
    autosave_enabled: bool = True
    autosave_interval_seconds: int = 30
    receipt_width: int = 44
    default_budget: Decimal = field(default_factory=lambda: DEFAULT_BUDGET)
    default_store_name: str = "Walmart Supercenter"
    state_tax_rate: Decimal = field(default_factory=lambda: DEFAULT_STATE_TAX_RATE)
    county_tax_rate: Decimal = field(default_factory=lambda: DEFAULT_COUNTY_TAX_RATE)
    city_tax_rate: Decimal = field(default_factory=lambda: DEFAULT_CITY_TAX_RATE)
    special_tax_rate: Decimal = field(default_factory=lambda: Decimal("0.0000"))
    data_folder: str = str(DATA_DIR)
    export_folder: str = str(EXPORTS_DIR)
    history_folder: str = str(HISTORY_DIR)
    database: DatabaseSettings = field(default_factory=DatabaseSettings)


class SettingsManager:
    """Manages application-wide settings and persistence."""

    def __init__(self, storage: Optional[StorageManager] = None):
        self.storage = storage or StorageManager()
        self.config = AppConfig()
        self.load()

    def load(self) -> None:
        data = self.storage.load_settings_json()
        if not data:
            return

        self.config.theme = str(data.get("theme", "dark"))
        self.config.currency = str(data.get("currency", "USD"))
        self.config.currency_symbol = str(data.get("currency_symbol", "$"))
        self.config.autosave_enabled = bool(data.get("autosave_enabled", True))
        self.config.autosave_interval_seconds = int(data.get("autosave_interval_seconds", 30))
        self.config.receipt_width = int(data.get("receipt_width", 44))
        self.config.default_budget = Decimal(str(data.get("default_budget", DEFAULT_BUDGET)))
        self.config.default_store_name = str(data.get("default_store_name", "Walmart Supercenter"))
        self.config.state_tax_rate = Decimal(str(data.get("state_tax_rate", DEFAULT_STATE_TAX_RATE)))
        self.config.county_tax_rate = Decimal(str(data.get("county_tax_rate", DEFAULT_COUNTY_TAX_RATE)))
        self.config.city_tax_rate = Decimal(str(data.get("city_tax_rate", DEFAULT_CITY_TAX_RATE)))
        self.config.special_tax_rate = Decimal(str(data.get("special_tax_rate", "0.0000")))
        self.config.data_folder = str(data.get("data_folder", str(DATA_DIR)))
        self.config.export_folder = str(data.get("export_folder", str(EXPORTS_DIR)))
        self.config.history_folder = str(data.get("history_folder", str(HISTORY_DIR)))

        db_data = data.get("database", {})
        self.config.database.backend = "sqlite"
        self.config.database.sqlite_path = str(db_data.get("sqlite_path", str(SQLITE_DB_PATH)))
        self.config.database.mysql_host = str(db_data.get("mysql_host", "127.0.0.1"))
        self.config.database.mysql_port = int(db_data.get("mysql_port", 3306))
        self.config.database.mysql_user = str(db_data.get("mysql_user", "root"))
        self.config.database.mysql_password = str(db_data.get("mysql_password", ""))
        self.config.database.mysql_database = str(db_data.get("mysql_database", "mjd_shopping_db"))
        self.config.database.mysql_table = str(db_data.get("mysql_table", "shopping_trips"))

    def save(self) -> None:
        data = {
            "theme": self.config.theme,
            "currency": self.config.currency,
            "currency_symbol": self.config.currency_symbol,
            "autosave_enabled": self.config.autosave_enabled,
            "autosave_interval_seconds": self.config.autosave_interval_seconds,
            "receipt_width": self.config.receipt_width,
            "default_budget": str(self.config.default_budget),
            "default_store_name": self.config.default_store_name,
            "state_tax_rate": str(self.config.state_tax_rate),
            "county_tax_rate": str(self.config.county_tax_rate),
            "city_tax_rate": str(self.config.city_tax_rate),
            "special_tax_rate": str(self.config.special_tax_rate),
            "data_folder": self.config.data_folder,
            "export_folder": self.config.export_folder,
            "history_folder": self.config.history_folder,
            "database": {
                "backend": self.config.database.backend,
                "sqlite_path": self.config.database.sqlite_path,
                "mysql_host": self.config.database.mysql_host,
                "mysql_port": self.config.database.mysql_port,
                "mysql_user": self.config.database.mysql_user,
                "mysql_password": self.config.database.mysql_password,
                "mysql_database": self.config.database.mysql_database,
                "mysql_table": self.config.database.mysql_table,
            },
        }
        self.storage.save_settings_json(data)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "theme": self.config.theme,
            "currency": self.config.currency,
            "currency_symbol": self.config.currency_symbol,
            "autosave_enabled": self.config.autosave_enabled,
            "autosave_interval_seconds": self.config.autosave_interval_seconds,
            "receipt_width": self.config.receipt_width,
            "default_budget": str(self.config.default_budget),
            "default_store_name": self.config.default_store_name,
            "state_tax_rate": str(self.config.state_tax_rate),
            "county_tax_rate": str(self.config.county_tax_rate),
            "city_tax_rate": str(self.config.city_tax_rate),
            "special_tax_rate": str(self.config.special_tax_rate),
            "data_folder": self.config.data_folder,
            "export_folder": self.config.export_folder,
            "history_folder": self.config.history_folder,
            "database": {
                "backend": self.config.database.backend,
                "sqlite_path": self.config.database.sqlite_path,
                "mysql_host": self.config.database.mysql_host,
                "mysql_port": self.config.database.mysql_port,
                "mysql_user": self.config.database.mysql_user,
                "mysql_password": self.config.database.mysql_password,
                "mysql_database": self.config.database.mysql_database,
                "mysql_table": self.config.database.mysql_table,
            },
        }
