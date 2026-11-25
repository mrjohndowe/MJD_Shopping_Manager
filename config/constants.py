"""
MJD Shopping Manager - Global Constants and Enums
"""
from decimal import Decimal
from enum import Enum
from pathlib import Path

# Application Meta
APP_NAME = "MJD Shopping Manager"
APP_VERSION = "2.4.1"
APP_AUTHOR = "Dowe Technologies, LLC"
APP_LICENSE = "MIT"
APP_TAGLINE = "Next-Gen Intelligent Terminal Shopping & Budget Assistant"

# Directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
EXPORTS_DIR = BASE_DIR / "exports_output"
HISTORY_DIR = BASE_DIR / "history_output"
ASSETS_DIR = BASE_DIR / "assets"

DATA_DIR.mkdir(parents=True, exist_ok=True)
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
HISTORY_DIR.mkdir(parents=True, exist_ok=True)
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

SQLITE_DB_PATH = DATA_DIR / "records.db"
AUTOSAVE_PATH = DATA_DIR / "autosave.json"
SETTINGS_PATH = DATA_DIR / "settings.json"

# Location & Tax Defaults (Pueblo, Colorado)
DEFAULT_LOCATION_CITY = "Pueblo"
DEFAULT_LOCATION_STATE = "Colorado"
DEFAULT_LOCATION_ZIP = "81003"
DEFAULT_LOCATION_ADDRESS = "100 Main St, Pueblo, CO 81003"

DEFAULT_STATE_TAX_RATE = Decimal("0.0290")   # 2.90% Colorado State
DEFAULT_COUNTY_TAX_RATE = Decimal("0.0100")  # 1.00% Pueblo County
DEFAULT_CITY_TAX_RATE = Decimal("0.0370")    # 3.70% City of Pueblo
DEFAULT_TOTAL_TAX_RATE = Decimal("0.0760")   # 7.60% Total Tax

DEFAULT_BUDGET = Decimal("0.00")
DEFAULT_CURRENCY = "USD"
DEFAULT_CURRENCY_SYMBOL = "$"

class ReceiptStyle(str, Enum):
    STANDARD = "standard"
    STORE = "store"
    DETAILED = "detailed"
    BUDGET_SUMMARY = "budget_summary"
    THERMAL_RECEIPT = "thermal_receipt"

class ExportFormat(str, Enum):
    TXT = "txt"
    CSV = "csv"
    JSON = "json"
    MARKDOWN = "md"
    PDF = "pdf"

class ItemCategory(str, Enum):
    GROCERY = "Grocery"
    PRODUCE = "Produce"
    DAIRY = "Dairy & Eggs"
    MEAT_SEAFOOD = "Meat & Seafood"
    BAKERY = "Bakery"
    FROZEN = "Frozen Foods"
    BEVERAGES = "Beverages"
    SNACKS = "Snacks & Sweets"
    HOUSEHOLD = "Household Essentials"
    HEALTH_BEAUTY = "Health & Beauty"
    ELECTRONICS = "Electronics"
    APPAREL = "Apparel"
    PETS = "Pet Supplies"
    GARDEN = "Lawn & Garden"
    AUTOMOTIVE = "Automotive"
    OFFICE = "Office & School"
    GENERAL = "General"

class StorePreset(str, Enum):
    WALMART = "Walmart"
    SAMS_CLUB = "Sam's Club"
    COSTCO = "Costco"
    TARGET = "Target"
    HOME_DEPOT = "Home Depot"
    LOWES = "Lowe's"
    BEST_BUY = "Best Buy"
    PRAIRIE_LIQUORS = "Prairie Liquors"
    CUSTOM = "Custom"

PRESET_STORES_DATA = [
    {
        "id": 1,
        "name": "Walmart Supercenter",
        "chain": "Walmart",
        "street_address": "4200 Dillon Dr",
        "city": "Pueblo",
        "state": "CO",
        "zip_code": "81008",
        "phone": "(719) 545-6600",
        "state_tax": Decimal("0.0290"),
        "county_tax": Decimal("0.0100"),
        "city_tax": Decimal("0.0370"),
        "special_tax": Decimal("0.0000"),
        "is_default": False,
        "notes": "Low everyday prices, groceries & general merchandise",
    },
    {
        "id": 2,
        "name": "Sam's Club #6549",
        "chain": "Sam's Club",
        "street_address": "412 E Highway 50",
        "city": "Pueblo",
        "state": "CO",
        "zip_code": "81008",
        "phone": "(719) 542-8820",
        "state_tax": Decimal("0.0290"),
        "county_tax": Decimal("0.0100"),
        "city_tax": Decimal("0.0370"),
        "special_tax": Decimal("0.0000"),
        "is_default": False,
        "notes": "Wholesale bulk club store",
    },
    {
        "id": 3,
        "name": "Costco Wholesale",
        "chain": "Costco",
        "street_address": "5030 N Nevada Ave",
        "city": "Colorado Springs",
        "state": "CO",
        "zip_code": "80918",
        "phone": "(719) 264-0018",
        "state_tax": Decimal("0.0290"),
        "county_tax": Decimal("0.0123"),
        "city_tax": Decimal("0.0312"),
        "special_tax": Decimal("0.0000"),
        "is_default": False,
        "notes": "Costco membership warehouse",
    },
    {
        "id": 4,
        "name": "Target Store #1842",
        "chain": "Target",
        "street_address": "3300 Dillon Dr",
        "city": "Pueblo",
        "state": "CO",
        "zip_code": "81008",
        "phone": "(719) 543-0500",
        "state_tax": Decimal("0.0290"),
        "county_tax": Decimal("0.0100"),
        "city_tax": Decimal("0.0370"),
        "special_tax": Decimal("0.0000"),
        "is_default": False,
        "notes": "Target Pueblo Mall area",
    },
    {
        "id": 5,
        "name": "The Home Depot #1509",
        "chain": "Home Depot",
        "street_address": "4400 Dillon Dr",
        "city": "Pueblo",
        "state": "CO",
        "zip_code": "81008",
        "phone": "(719) 544-2400",
        "state_tax": Decimal("0.0290"),
        "county_tax": Decimal("0.0100"),
        "city_tax": Decimal("0.0370"),
        "special_tax": Decimal("0.0000"),
        "is_default": False,
        "notes": "Home improvement & garden supplies",
    },
    {
        "id": 6,
        "name": "Lowe's Home Improvement #1833",
        "chain": "Lowe's",
        "street_address": "4000 Dillon Dr",
        "city": "Pueblo",
        "state": "CO",
        "zip_code": "81008",
        "phone": "(719) 544-8000",
        "state_tax": Decimal("0.0290"),
        "county_tax": Decimal("0.0100"),
        "city_tax": Decimal("0.0370"),
        "special_tax": Decimal("0.0000"),
        "is_default": False,
        "notes": "Hardware, tools, building materials",
    },
    {
        "id": 7,
        "name": "Best Buy #283",
        "chain": "Best Buy",
        "street_address": "3201 Dillon Dr",
        "city": "Pueblo",
        "state": "CO",
        "zip_code": "81008",
        "phone": "(719) 545-3100",
        "state_tax": Decimal("0.0290"),
        "county_tax": Decimal("0.0100"),
        "city_tax": Decimal("0.0370"),
        "special_tax": Decimal("0.0000"),
        "is_default": False,
        "notes": "Electronics, computers, gadgets",
    },
    {
        id": 8,
        "name": "Prairie Liquors",
        "chain": "Prairie Liquors",
        "street_address": "1659 S Prairie Ave",
        "city": "Pueblo",
        "state": "CO",
        "zip_code": "81005",
        "phone": "(719) 564-0370",
        "state_tax": Decimal("0.0290"),
        "county_tax": Decimal("0.000"),
        "city_tax": Decimal("0.000"),
        "special_tax": Decimal("0.0000"),
        "is_default": True,
        "notes": "Liquor store",
    },

]
