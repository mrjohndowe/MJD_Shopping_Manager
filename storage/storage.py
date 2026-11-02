"""
MJD Shopping Manager - Storage & Database Manager
Supports SQLite (records.db), JSON Autosave, Settings, and Profile Management.
"""
import sqlite3
import json
from dataclasses import dataclass, field
from decimal import Decimal
from pathlib import Path
from typing import List, Dict, Any, Optional
from config.constants import (
    SQLITE_DB_PATH,
    AUTOSAVE_PATH,
    SETTINGS_PATH,
    PRESET_STORES_DATA,
    DEFAULT_LOCATION_CITY,
    DEFAULT_LOCATION_STATE,
    DEFAULT_LOCATION_ZIP,
    DEFAULT_LOCATION_ADDRESS,
    DEFAULT_BUDGET,
)
from shopping.item import ShoppingItem


@dataclass
class AddressManager:
    """Manages user location, street address, and jurisdictional info."""
    city: str = DEFAULT_LOCATION_CITY
    state: str = DEFAULT_LOCATION_STATE
    zip_code: str = DEFAULT_LOCATION_ZIP
    street_address: str = DEFAULT_LOCATION_ADDRESS

    def formatted(self) -> str:
        return f"{self.street_address}, {self.city}, {self.state} {self.zip_code}".strip(", ")

    def to_dict(self) -> Dict[str, str]:
        return {
            "city": self.city,
            "state": self.state,
            "zip_code": self.zip_code,
            "street_address": self.street_address,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AddressManager":
        return cls(
            city=str(data.get("city", DEFAULT_LOCATION_CITY)),
            state=str(data.get("state", DEFAULT_LOCATION_STATE)),
            zip_code=str(data.get("zip_code", DEFAULT_LOCATION_ZIP)),
            street_address=str(data.get("street_address", DEFAULT_LOCATION_ADDRESS)),
        )


@dataclass
class StoreAddressManager:
    """Manages store-specific location and contact details."""
    street_address: str = ""
    city: str = "Pueblo"
    state: str = "CO"
    zip_code: str = "81008"
    phone: str = "(719) 555-0100"

    def formatted(self) -> str:
        return f"{self.street_address}, {self.city}, {self.state} {self.zip_code}".strip(", ")


@dataclass
class StoreProfile:
    id: int
    name: str
    chain: str
    address: StoreAddressManager
    state_tax_rate: Decimal
    county_tax_rate: Decimal
    city_tax_rate: Decimal
    special_tax_rate: Decimal
    is_default: bool = False
    notes: str = ""

    @property
    def total_tax_rate(self) -> Decimal:
        return self.state_tax_rate + self.county_tax_rate + self.city_tax_rate + self.special_tax_rate

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "chain": self.chain,
            "street_address": self.address.street_address,
            "city": self.address.city,
            "state": self.address.state,
            "zip_code": self.address.zip_code,
            "phone": self.address.phone,
            "state_tax_rate": str(self.state_tax_rate),
            "county_tax_rate": str(self.county_tax_rate),
            "city_tax_rate": str(self.city_tax_rate),
            "special_tax_rate": str(self.special_tax_rate),
            "total_tax_rate": str(self.total_tax_rate),
            "is_default": self.is_default,
            "notes": self.notes,
        }


class StoreManager:
    """Manages stores and their specific itemized tax rates."""

    def __init__(self, stores: Optional[List[StoreProfile]] = None):
        self.stores: List[StoreProfile] = stores or []
        if not self.stores:
            self._load_presets()

    def _load_presets(self) -> None:
        for item in PRESET_STORES_DATA:
            addr = StoreAddressManager(
                street_address=item["street_address"],
                city=item["city"],
                state=item["state"],
                zip_code=item["zip_code"],
                phone=item["phone"],
            )
            store = StoreProfile(
                id=item["id"],
                name=item["name"],
                chain=item["chain"],
                address=addr,
                state_tax_rate=item["state_tax"],
                county_tax_rate=item["county_tax"],
                city_tax_rate=item["city_tax"],
                special_tax_rate=item["special_tax"],
                is_default=item["is_default"],
                notes=item["notes"],
            )
            self.stores.append(store)

    def get_default_store(self) -> StoreProfile:
        for store in self.stores:
            if store.is_default:
                return store
        return self.stores[0] if self.stores else self._create_fallback_store()

    def _create_fallback_store(self) -> StoreProfile:
        fallback = StoreProfile(
            id=1,
            name="Walmart Supercenter",
            chain="Walmart",
            address=StoreAddressManager("4200 Dillon Dr", "Pueblo", "CO", "81008", "(719) 545-6600"),
            state_tax_rate=Decimal("0.0290"),
            county_tax_rate=Decimal("0.0100"),
            city_tax_rate=Decimal("0.0370"),
            special_tax_rate=Decimal("0.0000"),
            is_default=True,
            notes="Default store profile",
        )
        self.stores.append(fallback)
        return fallback

    def get_store_by_id(self, store_id: int) -> Optional[StoreProfile]:
        for s in self.stores:
            if s.id == store_id:
                return s
        return None

    def add_store(self, store: StoreProfile) -> StoreProfile:
        if not store.id:
            max_id = max((s.id for s in self.stores), default=0)
            store.id = max_id + 1
        if store.is_default:
            for s in self.stores:
                s.is_default = False
        self.stores.append(store)
        return store

    def set_default(self, store_id: int) -> bool:
        found = False
        for s in self.stores:
            if s.id == store_id:
                s.is_default = True
                found = True
            else:
                s.is_default = False
        return found


class ClientManager:
    """Manages client / user profile, location preferences, and setup state."""

    def __init__(
        self,
        user_name: str = "Shopper",
        address: Optional[AddressManager] = None,
        default_budget: Decimal = DEFAULT_BUDGET,
        setup_completed: bool = False,
    ):
        self.user_name: str = user_name
        self.address: AddressManager = address or AddressManager()
        self.default_budget: Decimal = Decimal(str(default_budget))
        self.setup_completed: bool = setup_completed

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_name": self.user_name,
            "address": self.address.to_dict(),
            "default_budget": str(self.default_budget),
            "setup_completed": self.setup_completed,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ClientManager":
        addr = AddressManager.from_dict(data.get("address", {}))
        return cls(
            user_name=str(data.get("user_name", "Shopper")),
            address=addr,
            default_budget=Decimal(str(data.get("default_budget", DEFAULT_BUDGET))),
            setup_completed=bool(data.get("setup_completed", False)),
        )


class ItemManager:
    """Manages the catalog of reusable items and frequent purchases."""

    def __init__(self):
        self.catalog: List[ShoppingItem] = []
        self._seed_default_catalog()

    def _seed_default_catalog(self) -> None:
        seeds = [
            ("Whole Milk 1 Gallon", "Dairy & Eggs", "Grocery", "3.89", False, False),
            ("Large White Eggs (18 Count)", "Dairy & Eggs", "Grocery", "4.49", False, True),
            ("Organic Bananas (1 lb)", "Produce", "Grocery", "0.68", False, True),
            ("Honeycrisp Apples (3 lb bag)", "Produce", "Grocery", "5.99", False, False),
            ("Boneless Chicken Breast (2 lb)", "Meat & Seafood", "Meat", "8.99", False, True),
            ("Ground Beef 80/20 (1 lb)", "Meat & Seafood", "Meat", "5.49", False, False),
            ("Whole Wheat Bread", "Bakery", "Bakery", "2.79", False, True),
            ("Paper Towels (6 Double Rolls)", "Household Essentials", "Home", "11.99", True, True),
            ("Bath Tissue (12 Mega Rolls)", "Household Essentials", "Home", "14.49", True, False),
            ("Liquid Dish Soap (28 oz)", "Household Essentials", "Home", "3.99", True, False),
            ("Sparkling Mineral Water (12 pk)", "Beverages", "Grocery", "5.99", True, False),
            ("Cold Brew Coffee (48 oz)", "Beverages", "Grocery", "6.29", True, True),
            ("Organic Tortilla Chips", "Snacks & Sweets", "Grocery", "3.49", False, False),
            ("Dark Chocolate Bar (70%)", "Snacks & Sweets", "Grocery", "2.99", True, False),
            ("Multivitamin Gummies (90 ct)", "Health & Beauty", "Pharmacy", "12.99", True, False),
            ("Shampoo & Conditioner 2-in-1", "Health & Beauty", "Personal Care", "6.49", True, False),
            ("Cat Food Grain Free (5 lb)", "Pet Supplies", "Pets", "16.99", True, False),
            ("AAA Alkaline Batteries (16 pk)", "Electronics", "Hardware", "13.99", True, False),
        ]
        for name, cat, dept, price, taxable, fav in seeds:
            self.catalog.append(
                ShoppingItem(
                    name=name,
                    category=cat,
                    department=dept,
                    quantity=Decimal("1.00"),
                    regular_price=Decimal(price),
                    is_taxable=taxable,
                    is_favorite=fav,
                )
            )

    def search(self, query: str) -> List[ShoppingItem]:
        q = query.lower().strip()
        if not q:
            return self.catalog
        return [i for i in self.catalog if q in i.name.lower() or q in i.category.lower() or q in i.department.lower()]

    def add_to_catalog(self, item: ShoppingItem) -> None:
        for existing in self.catalog:
            if existing.name.lower() == item.name.lower():
                existing.regular_price = item.regular_price
                existing.category = item.category
                existing.department = item.department
                existing.is_taxable = item.is_taxable
                return
        self.catalog.append(item.clone())


class StorageManager:
    """
    Central storage manager that coordinates SQLite database tables,
    JSON autosave, configuration persistence, and database backups.
    """

    def __init__(self, db_path: Path = SQLITE_DB_PATH):
        self.db_path = db_path
        self._init_sqlite()

    def _init_sqlite(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(str(self.db_path)) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS stores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    chain TEXT,
                    street_address TEXT,
                    city TEXT,
                    state TEXT,
                    zip_code TEXT,
                    phone TEXT,
                    state_tax_rate TEXT,
                    county_tax_rate TEXT,
                    city_tax_rate TEXT,
                    special_tax_rate TEXT,
                    is_default INTEGER DEFAULT 0,
                    notes TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS shopping_trips (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    list_name TEXT,
                    store_name TEXT,
                    store_address TEXT,
                    budget TEXT,
                    subtotal TEXT,
                    state_tax TEXT,
                    county_tax TEXT,
                    city_tax TEXT,
                    total_tax TEXT,
                    grand_total TEXT,
                    money_saved TEXT,
                    remaining_budget TEXT,
                    items_count INTEGER,
                    coupons_count INTEGER,
                    items_json TEXT,
                    notes TEXT,
                    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS app_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
            """)
            conn.commit()

    def save_autosave(self, cart_dict: Dict[str, Any]) -> None:
        try:
            AUTOSAVE_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(AUTOSAVE_PATH, "w", encoding="utf-8") as f:
                json.dump(cart_dict, f, indent=2)
        except Exception as e:
            print(f"[StorageManager] Error saving autosave: {e}")

    def load_autosave(self) -> Optional[Dict[str, Any]]:
        if not AUTOSAVE_PATH.exists():
            return None
        try:
            with open(AUTOSAVE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[StorageManager] Error reading autosave: {e}")
            return None

    def clear_autosave(self) -> None:
        if AUTOSAVE_PATH.exists():
            try:
                AUTOSAVE_PATH.unlink()
            except Exception:
                pass

    def save_settings_json(self, settings_dict: Dict[str, Any]) -> None:
        try:
            SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
                json.dump(settings_dict, f, indent=2)
        except Exception as e:
            print(f"[StorageManager] Error saving settings JSON: {e}")

    def load_settings_json(self) -> Optional[Dict[str, Any]]:
        if not SETTINGS_PATH.exists():
            return None
        try:
            with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def record_trip_sqlite(self, trip_data: Dict[str, Any]) -> int:
        with sqlite3.connect(str(self.db_path)) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO shopping_trips (
                    list_name, store_name, store_address, budget, subtotal,
                    state_tax, county_tax, city_tax, total_tax, grand_total,
                    money_saved, remaining_budget, items_count, coupons_count,
                    items_json, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                trip_data.get("list_name", "Shopping Trip"),
                trip_data.get("store_name", "Store"),
                trip_data.get("store_address", ""),
                str(trip_data.get("budget", "0.00")),
                str(trip_data.get("subtotal", "0.00")),
                str(trip_data.get("state_tax", "0.00")),
                str(trip_data.get("county_tax", "0.00")),
                str(trip_data.get("city_tax", "0.00")),
                str(trip_data.get("total_tax", "0.00")),
                str(trip_data.get("grand_total", "0.00")),
                str(trip_data.get("money_saved", "0.00")),
                str(trip_data.get("remaining_budget", "0.00")),
                int(trip_data.get("items_count", 0)),
                int(trip_data.get("coupons_count", 0)),
                json.dumps(trip_data.get("items", [])),
                trip_data.get("notes", ""),
            ))
            conn.commit()
            return cursor.lastrowid or 0

    def get_trips_sqlite(self) -> List[Dict[str, Any]]:
        with sqlite3.connect(str(self.db_path)) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM shopping_trips ORDER BY id DESC")
            rows = cursor.fetchall()
            results = []
            for r in rows:
                row_dict = dict(r)
                if row_dict.get("items_json"):
                    try:
                        row_dict["items"] = json.loads(row_dict["items_json"])
                    except Exception:
                        row_dict["items"] = []
                results.append(row_dict)
            return results
