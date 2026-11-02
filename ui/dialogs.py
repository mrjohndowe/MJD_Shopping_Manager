"""
MJD Shopping Manager - Interactive Dialogs & Wizards
Supports First-Time Setup Wizard, Item Modals, Store Taxes, and Export Configuration.
"""
from decimal import Decimal
from typing import Optional, Dict, Any, Tuple
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm, FloatPrompt
from rich.table import Table
from rich.text import Text
from config.constants import (
    DEFAULT_LOCATION_CITY,
    DEFAULT_LOCATION_STATE,
    DEFAULT_LOCATION_ZIP,
    DEFAULT_LOCATION_ADDRESS,
    DEFAULT_STATE_TAX_RATE,
    DEFAULT_COUNTY_TAX_RATE,
    DEFAULT_CITY_TAX_RATE,
    DEFAULT_BUDGET,
    ReceiptStyle,
    ExportFormat,
    ItemCategory,
)
from shopping.item import ShoppingItem
from storage.storage import ClientManager, AddressManager, StoreManager, StoreProfile, StoreAddressManager


class DialogManager:
    """Provides rich interactive terminal prompts and modal dialogs."""

    def __init__(self, console: Optional[Console] = None):
        self.console = console or Console()

    def run_first_time_setup(self, client_mgr: ClientManager, store_mgr: StoreManager) -> None:
        """
        First Time Setup System asking:
        - Location
        - Address
        - Tax rates (Colorado State 2.9%, Pueblo County 1.0%, City of Pueblo 3.7%)
        - Store customization
        """
        self.console.clear()
        banner = Panel(
            Text.from_markup(
                "[bold cyan]🛒 WELCOME TO MJD SHOPPING MANAGER SETUP WIZARD 🛒[/bold cyan]\n"
                "[dim]Let's configure your local jurisdiction, store tax profiles, and budget preferences.[/dim]"
            ),
            border_style="bold cyan",
            title="[bold yellow]System Initialization[/bold yellow]",
        )
        self.console.print(banner)
        self.console.print("")

        # 1. User Info
        user_name = Prompt.ask("[bold green]👤 Enter your name[/bold green]", default=client_mgr.user_name)
        client_mgr.user_name = user_name

        # 2. Location & Address
        self.console.print("\n[bold cyan]📍 Primary Shopping Location & Defaults[/bold cyan]")
        city = Prompt.ask("City", default=DEFAULT_LOCATION_CITY)
        state = Prompt.ask("State", default=DEFAULT_LOCATION_STATE)
        zip_code = Prompt.ask("ZIP Code", default=DEFAULT_LOCATION_ZIP)
        street = Prompt.ask("Street Address", default=DEFAULT_LOCATION_ADDRESS)

        client_mgr.address = AddressManager(
            city=city,
            state=state,
            zip_code=zip_code,
            street_address=street,
        )

        # 3. Tax Rates
        self.console.print("\n[bold yellow]💰 Default Regional Tax Rates[/bold yellow]")
        self.console.print(f"[dim]Default configured for Pueblo, CO (State: 2.90%, County: 1.00%, City: 3.70%)[/dim]")
        
        state_pct = FloatPrompt.ask("Colorado State Tax Rate (%)", default=2.90)
        county_pct = FloatPrompt.ask("Pueblo County Tax Rate (%)", default=1.00)
        city_pct = FloatPrompt.ask("City Tax Rate (%)", default=3.70)

        state_rate = Decimal(str(state_pct)) / Decimal("100")
        county_rate = Decimal(str(county_pct)) / Decimal("100")
        city_rate = Decimal(str(city_pct)) / Decimal("100")

        # Update default store taxes
        default_store = store_mgr.get_default_store()
        default_store.state_tax_rate = state_rate
        default_store.county_tax_rate = county_rate
        default_store.city_tax_rate = city_rate

        # 4. Default Budget
        default_budget_num = FloatPrompt.ask("\n[bold green]💵 Starting Shopping Budget ($)[/bold green]", default=float(DEFAULT_BUDGET))
        client_mgr.default_budget = Decimal(str(default_budget_num))
        client_mgr.setup_completed = True

        self.console.print("\n[bold green]✅ Setup completed successfully! Initializing workspace...[/bold green]")

    def prompt_add_item(self) -> Optional[ShoppingItem]:
        """Prompts user to create a new ShoppingItem."""
        self.console.print("\n[bold cyan]➕ Add New Shopping Item[/bold cyan]")
        name = Prompt.ask("Item Name")
        if not name.strip():
            return None

        categories = [c.value for c in ItemCategory]
        category = Prompt.ask("Category", choices=categories, default=ItemCategory.GROCERY.value)
        department = Prompt.ask("Department", default="Grocery")

        qty_str = Prompt.ask("Quantity", default="1")
        try:
            quantity = Decimal(qty_str)
        except Exception:
            quantity = Decimal("1.00")

        price_str = Prompt.ask("Regular Price ($)", default="0.00")
        try:
            regular_price = Decimal(price_str)
        except Exception:
            regular_price = Decimal("0.00")

        has_discounts = Confirm.ask("Are there sales discounts or coupons on this item?", default=False)
        sale_discount = Decimal("0.00")
        coupon_discount = Decimal("0.00")

        if has_discounts:
            sale_str = Prompt.ask("  Sale discount per unit ($)", default="0.00")
            try:
                sale_discount = Decimal(sale_str)
            except Exception:
                pass

            coupon_str = Prompt.ask("  Manufacturer coupon per unit ($)", default="0.00")
            try:
                coupon_discount = Decimal(coupon_str)
            except Exception:
                pass

        is_taxable = Confirm.ask("Is this item taxable?", default=True)
        is_favorite = Confirm.ask("Mark as favorite item?", default=False)
        notes = Prompt.ask("Notes / Aisle / Brand (optional)", default="")

        return ShoppingItem(
            name=name,
            category=category,
            department=department,
            quantity=quantity,
            regular_price=regular_price,
            sale_discount=sale_discount,
            coupon_discount=coupon_discount,
            is_taxable=is_taxable,
            is_favorite=is_favorite,
            notes=notes,
        )

    def prompt_edit_item(self, item: ShoppingItem) -> None:
        """Prompts user to edit an existing item."""
        self.console.print(f"\n[bold cyan]✏️  Edit Item: {item.name}[/bold cyan]")
        name = Prompt.ask("Item Name", default=item.name)
        category = Prompt.ask("Category", default=item.category)
        department = Prompt.ask("Department", default=item.department)
        
        qty_str = Prompt.ask("Quantity", default=str(item.quantity))
        price_str = Prompt.ask("Regular Price ($)", default=str(item.regular_price))
        sale_str = Prompt.ask("Sale Discount ($)", default=str(item.sale_discount))
        coupon_str = Prompt.ask("Coupon Discount ($)", default=str(item.coupon_discount))
        is_taxable = Confirm.ask("Is taxable?", default=item.is_taxable)
        is_fav = Confirm.ask("Is favorite?", default=item.is_favorite)
        notes = Prompt.ask("Notes", default=item.notes)

        item.name = name
        item.category = category
        item.department = department
        try:
            item.quantity = Decimal(qty_str)
            item.regular_price = Decimal(price_str)
            item.sale_discount = Decimal(sale_str)
            item.coupon_discount = Decimal(coupon_str)
        except Exception:
            pass
        item.is_taxable = is_taxable
        item.is_favorite = is_fav
        item.notes = notes

    def prompt_adjust_budget(self, current_budget: Decimal) -> Decimal:
        new_budget = FloatPrompt.ask("\n[bold green]💵 Set New Budget ($)[/bold green]", default=float(current_budget))
        return Decimal(str(new_budget))
