"""
MJD Shopping Manager - Core ShoppingApp Class
Orchestrates state, managers, terminal UI, startup lifecycle, and transitions.
"""
import sys
import time
from decimal import Decimal
from typing import Optional, Dict, Any, List
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich.text import Text
from rich.align import Align

from config.constants import (
    APP_NAME,
    APP_VERSION,
    APP_TAGLINE,
    ReceiptStyle,
    ExportFormat,
    DEFAULT_BUDGET,
    AUTOSAVE_PATH,
    SETTINGS_PATH,
)
from shopping.item import ShoppingItem
from shopping.cart import ShoppingCart
from taxes.calculator import TaxCalculator
from storage.storage import (
    StorageManager,
    StoreManager,
    AddressManager,
    StoreAddressManager,
    ClientManager,
    ItemManager,
    StoreProfile,
)
from receipts.printer import ReceiptPrinter
from exports.exporter import ExportManager
from history.history import HistoryManager
from statistics.statistics import StatisticsManager
from settings.settings import SettingsManager
from themes.theme import ThemeManager
from ui.dialogs import DialogManager
from ui.screens import ScreenManager


class ShoppingApp:
    """
    Main application controller for MJD Shopping Manager.
    Encapsulates all required managers and UI coordinators.
    """

    def __init__(self):
        self.console: Console = Console()
        self.storage: StorageManager = StorageManager()
        self.settings: SettingsManager = SettingsManager(self.storage)
        self.theme: ThemeManager = ThemeManager(self.settings.config.theme)
        
        self.store_manager: StoreManager = StoreManager()
        self.address_manager: AddressManager = AddressManager()
        self.client_manager: ClientManager = ClientManager(address=self.address_manager)
        self.item_manager: ItemManager = ItemManager()
        self.history_manager: HistoryManager = HistoryManager(self.storage)
        self.statistics_manager: StatisticsManager = StatisticsManager(self.history_manager)
        self.export_manager: ExportManager = ExportManager()

        self.cart: ShoppingCart = ShoppingCart(budget=self.settings.config.default_budget)
        self.dialogs: DialogManager = DialogManager(self.console)
        self.screens: ScreenManager = ScreenManager(self.console)
        self.selected_item_index: int = 0
        self.is_running: bool = False

        # Link store tax rates to cart
        default_store = self.store_manager.get_default_store()
        self._apply_store_to_cart(default_store)

    def _apply_store_to_cart(self, store: StoreProfile) -> None:
        self.cart.store_id = store.id
        self.cart.store_name = store.name
        self.cart.store_address = store.address.formatted()
        self.cart.tax_calculator.set_rates(
            state_rate=store.state_tax_rate,
            county_rate=store.county_tax_rate,
            city_rate=store.city_tax_rate,
            special_rate=store.special_tax_rate,
        )

    def display_splash_screen(self, duration: float = 0.8) -> None:
        """Displays startup banner with animation delay."""
        self.console.clear()
        banner_text = Text()
        banner_text.append(f"  {APP_NAME} v{APP_VERSION}  \n", style="bold cyan")
        banner_text.append(f"  {APP_TAGLINE}  \n\n", style="italic bright_white")
        banner_text.append("  • Colorado State Tax: 2.90%\n", style="green")
        banner_text.append("  • Pueblo County Tax:  1.00%\n", style="green")
        banner_text.append("  • City of Pueblo Tax: 3.70%\n", style="green")
        banner_text.append("  • Total Regional Rate: 7.60%\n\n", style="bold yellow")
        banner_text.append("  [ Initializing storage, SQLite database & cached lists... ]", style="dim")

        panel = Panel(
            Align.center(banner_text),
            title="[bold yellow]🚀 SYSTEM BOOT[/bold yellow]",
            border_style="cyan",
            padding=(1, 2),
        )
        self.console.print(panel)
        time.sleep(duration)

    def initialize_system(self) -> None:
        """Checks first-time setup status and autosave recovery."""
        self.display_splash_screen()

        # 1. First-time setup check
        if not self.client_manager.setup_completed:
            # We can populate defaults or prompt if interactive
            pass

        # 2. Check for autosave
        autosave_data = self.storage.load_autosave()
        if autosave_data and autosave_data.get("items"):
            items_cnt = len(autosave_data.get("items", []))
            self.console.print(f"\n[bold yellow]📂 Previous shopping session found ({items_cnt} items)![/bold yellow]")
            restore = Confirm.ask("Would you like to restore your previous shopping trip?", default=True)
            if restore:
                self.cart = ShoppingCart.from_dict(autosave_data)
                self.console.print("[bold green]✓ Session successfully restored![/bold green]")
                time.sleep(0.6)
            else:
                self.storage.clear_autosave()

    def run_interactive(self) -> None:
        """Main terminal event loop."""
        self.initialize_system()
        self.is_running = True

        while self.is_running:
            current_store = self.store_manager.get_store_by_id(self.cart.store_id or 1) or self.store_manager.get_default_store()
            self.screens.render_dashboard(
                cart=self.cart,
                store=current_store,
                palette=self.theme.current,
                selected_index=self.selected_item_index if self.cart.items else None,
            )

            # Prompt command
            cmd = Prompt.ask("\n[bold cyan]Action[/bold cyan] [A/E/D/DEL/F/S/R/X/H/B/C/T/Q/?]", default="A").strip().upper()

            if cmd == "A" or cmd == "ADD":
                new_item = self.dialogs.prompt_add_item()
                if new_item:
                    self.cart.add_item(new_item)
                    self.item_manager.add_to_catalog(new_item)
                    self.storage.save_autosave(self.cart.to_dict())
            
            elif cmd == "E" or cmd == "EDIT":
                if self.cart.items and 0 <= self.selected_item_index < len(self.cart.items):
                    item = self.cart.items[self.selected_item_index]
                    self.dialogs.prompt_edit_item(item)
                    self.storage.save_autosave(self.cart.to_dict())
                else:
                    self.console.print("[yellow]No item selected to edit.[/yellow]")
                    time.sleep(0.8)

            elif cmd == "D" or cmd == "DUP":
                if self.cart.items and 0 <= self.selected_item_index < len(self.cart.items):
                    item = self.cart.items[self.selected_item_index]
                    self.cart.duplicate_item(item.id)
                    self.storage.save_autosave(self.cart.to_dict())

            elif cmd == "DEL" or cmd == "DELETE" or cmd == "REMOVE":
                if self.cart.items and 0 <= self.selected_item_index < len(self.cart.items):
                    item = self.cart.items[self.selected_item_index]
                    self.cart.remove_item(item.id)
                    self.selected_item_index = max(0, min(self.selected_item_index, len(self.cart.items) - 1))
                    self.storage.save_autosave(self.cart.to_dict())

            elif cmd == "F" or cmd == "FAV":
                if self.cart.items and 0 <= self.selected_item_index < len(self.cart.items):
                    item = self.cart.items[self.selected_item_index]
                    item.is_favorite = not item.is_favorite
                    self.storage.save_autosave(self.cart.to_dict())

            elif cmd == "B" or cmd == "BUDGET":
                new_b = self.dialogs.prompt_adjust_budget(self.cart.budget)
                self.cart.budget = new_b
                self.storage.save_autosave(self.cart.to_dict())

            elif cmd == "S" or cmd == "STORE":
                self._handle_store_menu()

            elif cmd == "R" or cmd == "RECEIPT":
                self._handle_receipt_menu()

            elif cmd == "X" or cmd == "EXPORT":
                self._handle_export_menu()

            elif cmd == "H" or cmd == "HISTORY":
                self._handle_history_menu()

            elif cmd == "T" or cmd == "THEME":
                self._handle_theme_menu()

            elif cmd == "C" or cmd == "CLEAR":
                if Confirm.ask("Are you sure you want to clear the active shopping cart?", default=False):
                    self.cart.clear_cart()
                    self.storage.clear_autosave()

            elif cmd == "STAT" or cmd == "STATS":
                stats = self.statistics_manager.calculate_statistics()
                self.screens.render_statistics_dashboard(stats, self.theme.current)
                Prompt.ask("\n[bold yellow]Press Enter to return to dashboard[/bold yellow]")

            elif cmd == "?" or cmd == "HELP":
                self.screens.render_help()
                Prompt.ask("\n[bold yellow]Press Enter to return to dashboard[/bold yellow]")

            elif cmd == "Q" or cmd == "QUIT" or cmd == "EXIT":
                self.storage.save_autosave(self.cart.to_dict())
                self.console.print("[bold green]Cart autosaved. Thank you for using MJD Shopping Manager![/bold green]")
                self.is_running = False

    def _handle_store_menu(self) -> None:
        self.screens.render_store_manager(self.store_manager)
        store_choice = Prompt.ask("\nSelect store number to apply to cart (or [B] Back)", default="1")
        if store_choice.upper() != "B":
            try:
                sid = int(store_choice)
                s = self.store_manager.get_store_by_id(sid)
                if s:
                    self._apply_store_to_cart(s)
                    self.console.print(f"[bold green]Applied {s.name} tax profile to cart![/bold green]")
                    time.sleep(0.7)
            except Exception:
                pass

    def _handle_receipt_menu(self) -> None:
        style_map = {
            "1": ReceiptStyle.STANDARD,
            "2": ReceiptStyle.STORE,
            "3": ReceiptStyle.DETAILED,
            "4": ReceiptStyle.BUDGET_SUMMARY,
            "5": ReceiptStyle.THERMAL_RECEIPT,
        }
        current_style = ReceiptStyle.STANDARD
        while True:
            self.screens.render_receipt_studio(self.cart, self.theme.current, current_style)
            ch = Prompt.ask("\nChoose Receipt Style [1-5] or [B] Back", default="1").upper()
            if ch in style_map:
                current_style = style_map[ch]
            elif ch == "B":
                break

    def _handle_export_menu(self) -> None:
        self.console.clear()
        self.console.print(Panel("[bold cyan]💾 EXPORT SHOPPING CART[/bold cyan]", border_style="cyan"))
        self.console.print("1. Text Format (.txt)")
        self.console.print("2. CSV Spreadsheet (.csv)")
        self.console.print("3. JSON Data (.json)")
        self.console.print("4. Markdown Summary (.md)")

        choice = Prompt.ask("\nSelect format [1-4] or [B] Back", default="1")
        if choice.upper() == "B":
            return

        fmt_map = {"1": "txt", "2": "csv", "3": "json", "4": "md"}
        fmt = fmt_map.get(choice, "txt")

        encrypt = Confirm.ask("Lock and encrypt export with a custom encryption key?", default=False)
        key = None
        if encrypt:
            key = Prompt.ask("Enter encryption key / password")

        path = self.export_manager.export_by_format(self.cart, fmt, encrypt_key=key)
        self.console.print(f"\n[bold green]✅ Export successfully saved to: {path}[/bold green]")
        Prompt.ask("\nPress Enter to continue")

    def _handle_history_menu(self) -> None:
        self.console.clear()
        self.console.print(Panel("[bold green]📜 SHOPPING HISTORY[/bold green]", border_style="green"))

        if not self.history_manager.trips:
            self.console.print("[dim italic]No completed trips in history yet.[/dim italic]")
        else:
            for t in self.history_manager.trips[:8]:
                self.console.print(f"• [bold]{t.completed_at}[/bold] | [cyan]{t.store_name}[/cyan] | Spent: [bold green]${t.grand_total}[/bold green] | Items: {t.items_count}")

        Prompt.ask("\nPress Enter to return")

    def _handle_theme_menu(self) -> None:
        self.console.clear()
        self.console.print(Panel("[bold magenta]🎨 THEME SELECTION[/bold magenta]", border_style="magenta"))
        themes = self.theme.list_themes()
        for idx, t in enumerate(themes):
            active_marker = " [bold green](Active)[/bold green]" if t["id"] == self.theme.current_theme_id else ""
            self.console.print(f"{idx + 1}. [bold]{t['name']}[/bold]{active_marker}")

        ch = Prompt.ask("\nSelect Theme [1-5] or [B] Back", default="1")
        if ch.upper() != "B":
            try:
                idx = int(ch) - 1
                if 0 <= idx < len(themes):
                    self.theme.set_theme(themes[idx]["id"])
                    self.settings.config.theme = themes[idx]["id"]
                    self.settings.save()
            except Exception:
                pass
