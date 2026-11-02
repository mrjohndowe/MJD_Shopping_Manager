#!/usr/bin/env python
"""
MJD Shopping Manager - Main Application Entrypoint
Usage:
    python main.py                 # Launch interactive terminal UI
    python main.py --demo          # Run live demo cart with Pueblo, CO taxes
    python main.py --receipt store # Print formatted receipt
    python main.py --summary       # Output current cart summary
    python main.py --stats         # Print spending statistics
    python main.py --setup         # Run first-time setup wizard
"""
import sys
import argparse
from decimal import Decimal
from rich.console import Console

from shopping.app import ShoppingApp
from shopping.item import ShoppingItem
from receipts.printer import ReceiptPrinter
from config.constants import ReceiptStyle, APP_NAME, APP_VERSION


def seed_demo_cart(app: ShoppingApp) -> None:
    """Populates demo items for Pueblo, Colorado shopping trip."""
    app.cart.clear_cart()
    app.cart.name = "Weekly Family Groceries & Supplies"
    app.cart.budget = Decimal("150.00")

    demo_items = [
        ShoppingItem(
            name="Crush Strawberry (12 oz)",
            category="Beverages",
            department="Grocery",
            quantity=Decimal("1.00"),
            regular_price=Decimal("3.49"),
            sale_discount=Decimal("1.00"),
            coupon_discount=Decimal("1.00"),
            is_taxable=True,
            is_favorite=True,
            notes="Strawberry flavored soda",
        ),
        ShoppingItem(
            name="RC Cola (12 oz)",
            category="Beverages",
            department="Grocery",
            quantity=Decimal("1.00"),
            regular_price=Decimal("3.49"),
            sale_discount=Decimal("1.00"),
            coupon_discount=Decimal("1.00"),
            is_taxable=True,
            is_favorite=True,
            notes="RC Cola Classic",
        ),
        ShoppingItem(
            name="Crush Orange (12 oz)",
            category="Beverages",
            department="Grocery",
            quantity=Decimal("1.00"),
            regular_price=Decimal("3.49"),
            sale_discount=Decimal("1.00"),
            coupon_discount=Decimal("1.00"),
            is_taxable=True,
            is_favorite=True,
            notes="Orange flavored soda",
        ),


    ]

    for item in demo_items:
        app.cart.add_item(item)


def main():
    parser = argparse.ArgumentParser(description=f"{APP_NAME} v{APP_VERSION}")
    parser.add_argument("--demo", action="store_true", help="Load demo cart with Pueblo, CO taxes and show preview")
    parser.add_argument("--receipt", type=str, choices=["standard", "store", "detailed", "budget", "thermal"], help="Render styled receipt")
    parser.add_argument("--summary", action="store_true", help="Print cart summary and budget breakdown")
    parser.add_argument("--stats", action="store_true", help="Print aggregated shopping statistics")
    parser.add_argument("--setup", action="store_true", help="Launch first-time location & tax setup wizard")
    parser.add_argument("--tax-calc", type=float, help="Calculate Pueblo Colorado sales tax for a dollar amount")

    args = parser.parse_args()
    app = ShoppingApp()
    console = Console()

    if args.tax_calc is not None:
        amt = Decimal(str(args.tax_calc))
        bd = app.cart.tax_calculator.calculate_for_amount(amt)
        console.print(f"[bold cyan]Sales Tax Calculation for ${amt:.2f}:[/bold cyan]")
        console.print(f"  • Colorado State Tax (2.90%):   ${bd.state_tax_amount:.2f}")
        console.print(f"  • Pueblo County Tax (1.00%):    ${bd.county_tax_amount:.2f}")
        console.print(f"  • City of Pueblo Tax (3.70%):   ${bd.city_tax_amount:.2f}")
        console.print(f"  • Total Sales Tax (7.60%):      [bold yellow]${bd.total_tax:.2f}[/bold yellow]")
        console.print(f"  • Grand Total:                  [bold green]${amt + bd.total_tax:.2f}[/bold green]")
        return

    if args.demo:
        seed_demo_cart(app)
        app.screens.render_dashboard(app.cart, app.store_manager.get_default_store(), app.theme.current)
        console.print("\n[bold green]✓ Demo cart loaded successfully![/bold green]")
        return

    if args.receipt:
        if not app.cart.items:
            seed_demo_cart(app)
        style_enum = {
            "standard": ReceiptStyle.STANDARD,
            "store": ReceiptStyle.STORE,
            "detailed": ReceiptStyle.DETAILED,
            "budget": ReceiptStyle.BUDGET_SUMMARY,
            "thermal": ReceiptStyle.THERMAL_RECEIPT,
        }.get(args.receipt, ReceiptStyle.STANDARD)
        printer = ReceiptPrinter(app.cart)
        console.print(printer.render(style_enum))
        return

    if args.summary:
        if not app.cart.items:
            seed_demo_cart(app)
        import json
        console.print(json.dumps(app.cart.to_dict(), indent=2))
        return

    if args.stats:
        stats = app.statistics_manager.calculate_statistics()
        app.screens.render_statistics_dashboard(stats, app.theme.current)
        return

    if args.setup:
        app.dialogs.run_first_time_setup(app.client_manager, app.store_manager)
        app.settings.config.default_budget = app.client_manager.default_budget
        app.settings.save()
        return

    # Default interactive launcher
    app.run_interactive()


if __name__ == "__main__":
    main()
