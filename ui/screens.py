"""
MJD Shopping Manager - Interactive Terminal Screens
Implements polished views for Dashboard, Receipt Studio, History, Statistics, and Settings.
"""
from decimal import Decimal
from typing import Optional, List, Dict, Any
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.align import Align
from config.constants import ReceiptStyle, ExportFormat
from shopping.cart import ShoppingCart
from receipts.printer import ReceiptPrinter
from storage.storage import StoreManager, StoreProfile
from history.history import HistoryManager
from statistics.statistics import StatisticsManager
from settings.settings import SettingsManager
from themes.theme import ThemeManager, ThemePalette
from ui.widgets import (
    create_header_banner,
    create_budget_progress_widget,
    create_items_table,
    create_tax_summary_panel,
    create_footer_shortcuts,
)


class ScreenManager:
    """Renders formatted full-screen views for the terminal UI."""

    def __init__(self, console: Optional[Console] = None):
        self.console = console or Console()

    def render_dashboard(
        self,
        cart: ShoppingCart,
        store: StoreProfile,
        palette: ThemePalette,
        selected_index: Optional[int] = None,
    ) -> None:
        """Main active workspace view."""
        self.console.clear()

        # 1. Header Banner
        header = create_header_banner(palette, store.name, cart.name)
        self.console.print(header)

        # 2. Budget Gauge & Quick Summary
        budget_widget = create_budget_progress_widget(cart, palette)
        tax_widget = create_tax_summary_panel(cart, palette)

        # Columns layout
        grid = Table.grid(expand=True)
        grid.add_column(ratio=6)
        grid.add_column(ratio=4)
        grid.add_row(budget_widget, tax_widget)
        self.console.print(grid)

        # 3. Cart Items Table
        items_table = create_items_table(cart, palette, selected_index)
        self.console.print(items_table)

        # 4. Status Bar & Shortcuts
        shortcuts = create_footer_shortcuts()
        self.console.print(shortcuts)

    def render_receipt_studio(self, cart: ShoppingCart, palette: ThemePalette, style: ReceiptStyle = ReceiptStyle.STANDARD) -> None:
        """Receipt generation studio with 5 styles."""
        self.console.clear()
        printer = ReceiptPrinter(cart)
        receipt_text = printer.render(style)

        header = Panel(
            Text.from_markup(f"[bold cyan]🧾 MJD RECEIPT STUDIO - Style: [bold yellow]{style.value.upper()}[/bold yellow][/bold cyan]"),
            border_style="cyan",
        )
        self.console.print(header)

        receipt_panel = Panel(
            Text(receipt_text),
            title=f"[bold white]Receipt Preview ({style.value})[/bold white]",
            border_style="green",
            padding=(1, 2),
        )
        self.console.print(Align.center(receipt_panel))

        options_text = Text.from_markup(
            "[bold yellow][1][/bold yellow] Standard  "
            "[bold yellow][2][/bold yellow] Store Branded  "
            "[bold yellow][3][/bold yellow] Detailed Audit  "
            "[bold yellow][4][/bold yellow] Budget Summary  "
            "[bold yellow][5][/bold yellow] Thermal Slip  "
            "[bold yellow][B][/bold yellow] Back to Dashboard"
        )
        self.console.print(Panel(Align.center(options_text), style="dim white"))

    def render_statistics_dashboard(self, stats: Dict[str, Any], palette: ThemePalette) -> None:
        """Displays aggregated trip statistics and category distributions."""
        self.console.clear()
        header = Panel(
            Text.from_markup("[bold magenta]📊 MJD SHOPPING INTELLIGENCE & STATISTICS[/bold magenta]\n[dim]Historical spending insights, store analytics, and savings analysis[/dim]"),
            border_style="magenta",
        )
        self.console.print(header)

        grid = Table(expand=True, border_style="dim white", show_header=False)
        grid.add_column(ratio=1)
        grid.add_column(ratio=1)
        grid.add_column(ratio=1)

        p1 = Panel(
            f"[dim]Total Completed Trips:[/dim]\n[bold cyan]{stats['trips']}[/bold cyan]\n\n"
            f"[dim]Total Money Spent:[/dim]\n[bold green]${stats['money_spent']}[/bold green]\n\n"
            f"[dim]Total Taxes Paid:[/dim]\n[bold yellow]${stats['taxes_paid']}[/bold yellow]",
            title="[bold cyan]Expenditure Summary[/bold cyan]",
            border_style="cyan",
        )

        p2 = Panel(
            f"[dim]Average Trip Total:[/dim]\n[bold white]${stats['average_trip']}[/bold white]\n\n"
            f"[dim]Largest Trip:[/dim]\n[bold red]${stats['largest_trip']}[/bold red]\n\n"
            f"[dim]Smallest Trip:[/dim]\n[bold green]${stats['smallest_trip']}[/bold green]",
            title="[bold yellow]Trip Extremes[/bold yellow]",
            border_style="yellow",
        )

        p3 = Panel(
            f"[dim]Favorite Store:[/dim]\n[bold green]{stats['favorite_store']}[/bold green]\n\n"
            f"[dim]Most Purchased Item:[/dim]\n[bold magenta]{stats['most_purchased_item']}[/bold magenta]\n\n"
            f"[dim]Total Promotional Savings:[/dim]\n[bold green]${stats['money_saved']}[/bold green] ([cyan]{stats['coupons_used']} coupons[/cyan])",
            title="[bold magenta]Habits & Savings[/bold magenta]",
            border_style="magenta",
        )

        grid.add_row(p1, p2, p3)
        self.console.print(grid)

        # Category spending table
        cat_table = Table(title="Spending by Category", expand=True, border_style="dim white")
        cat_table.add_column("Category", ratio=3)
        cat_table.add_column("Total Spent ($)", justify="right", ratio=2)

        for cat, amt in stats.get("category_breakdown", {}).items():
            cat_table.add_row(cat, f"${amt}")

        self.console.print(cat_table)

    def render_store_manager(self, store_mgr: StoreManager) -> None:
        """Displays configured stores and itemized tax rates."""
        self.console.clear()
        header = Panel(
            Text.from_markup("[bold green]🏬 STORE PROFILES & ITEMIZED TAX RATES[/bold green]\n[dim]Every store can have customized city, county, and state tax rules[/dim]"),
            border_style="green",
        )
        self.console.print(header)

        table = Table(expand=True, border_style="dim white")
        table.add_column("#", justify="center", width=4)
        table.add_column("Default", justify="center", width=8)
        table.add_column("Store Name", ratio=3)
        table.add_column("Address & Phone", ratio=3)
        table.add_column("State Tax", justify="right", width=11)
        table.add_column("County Tax", justify="right", width=11)
        table.add_column("City Tax", justify="right", width=11)
        table.add_column("Total Tax", justify="right", width=11)

        for s in store_mgr.stores:
            def_badge = "[bold green]DEFAULT[/bold green]" if s.is_default else "[dim]-[/dim]"
            table.add_row(
                str(s.id),
                def_badge,
                f"[bold]{s.name}[/bold]",
                f"{s.address.formatted()}\n[dim]{s.address.phone}[/dim]",
                f"{s.state_tax_rate * Decimal('100'):.2f}%",
                f"{s.county_tax_rate * Decimal('100'):.2f}%",
                f"{s.city_tax_rate * Decimal('100'):.2f}%",
                f"[bold cyan]{s.total_tax_rate * Decimal('100'):.2f}%[/bold cyan]",
            )

        self.console.print(table)

    def render_help(self) -> None:
        """Displays help screen and documentation."""
        self.console.clear()
        help_text = Text.from_markup(
            "[bold cyan]MJD Shopping Manager - User Manual & Command Shortcuts[/bold cyan]\n\n"
            "[bold yellow]Core Navigation Shortcuts:[/bold yellow]\n"
            "  • [bold white]A[/bold white] : Add a new item to the active cart with category, quantity, prices, and coupon\n"
            "  • [bold white]E[/bold white] : Edit the currently highlighted item\n"
            "  • [bold white]D[/bold white] : Duplicate the currently highlighted item\n"
            "  • [bold white]DEL[/bold white] : Remove the item from active cart\n"
            "  • [bold white]F[/bold white] : Toggle favorite status on an item\n"
            "  • [bold white]↑ / ↓[/bold white] : Move item order up or down\n"
            "  • [bold white]B[/bold white] : Change starting shopping budget\n"
            "  • [bold white]S[/bold white] : Open Store Profiles & Itemized Tax Manager\n"
            "  • [bold white]R[/bold white] : Open Receipt Studio (Standard, Store, Detailed, Budget, Thermal)\n"
            "  • [bold white]X[/bold white] : Export Cart to TXT, CSV, JSON, Markdown with encryption & read-only lock\n"
            "  • [bold white]H[/bold white] : View Trip History and completed shopping sessions\n"
            "  • [bold white]STAT[/bold white] : View Aggregate Statistics & Category Charts\n"
            "  • [bold white]T[/bold white] : Switch UI Theme (Dark, Cyberpunk, Emerald, Midnight, Nord)\n"
            "  • [bold white]C[/bold white] : Clear current active cart\n"
            "  • [bold white]Q[/bold white] : Save and exit the application\n\n"
            "[bold green]Sales Tax Engine:[/bold green]\n"
            "  • Configured by default for Pueblo, Colorado (State: 2.90%, Pueblo County: 1.00%, City: 3.70%)\n"
            "  • Only taxes that are active and greater than $0.00 are displayed on receipts\n"
        )
        panel = Panel(help_text, title="[bold yellow]📖 Help & Documentation[/bold yellow]", border_style="yellow")
        self.console.print(panel)
