"""
MJD Shopping Manager - Terminal UI Widgets
Rich-based panels, dynamic budget progress bars, itemized tables, and styled elements.
"""
from decimal import Decimal
from typing import Optional, List, Dict, Any
from rich.console import Console, RenderableType
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.align import Align
from rich.progress import Progress, BarColumn, TextColumn
from rich.columns import Columns
from config.constants import APP_NAME, APP_VERSION, APP_TAGLINE
from shopping.cart import ShoppingCart
from themes.theme import ThemePalette


def create_header_banner(palette: ThemePalette, current_store: str, current_list: str) -> Panel:
    """Renders the top banner with title, active store, and active list."""
    grid = Table.grid(expand=True)
    grid.add_column(justify="left", ratio=2)
    grid.add_column(justify="right", ratio=1)

    title_text = Text()
    title_text.append("🛒 ", style="bold yellow")
    title_text.append(APP_NAME, style=palette.rich_primary)
    title_text.append(f" v{APP_VERSION}", style="dim cyan")
    title_text.append(f"  |  {APP_TAGLINE}", style="italic bright_black")

    info_text = Text()
    info_text.append("Store: ", style="bold white")
    info_text.append(f"{current_store} ", style="bold green")
    info_text.append("| List: ", style="bold white")
    info_text.append(current_list, style="bold yellow")

    grid.add_row(title_text, info_text)

    return Panel(grid, style=f"{palette.border}", padding=(0, 1), title="[bold white]MJD Shopping System[/bold white]", title_align="left")


def create_budget_progress_widget(cart: ShoppingCart, palette: ThemePalette) -> Panel:
    """Renders the budget status with instant color-coded visual progress bar."""
    budget = cart.budget
    spent = cart.grand_total
    remaining = cart.remaining_budget
    pct = cart.percent_used
    is_over = cart.is_overspent

    # Determine bar color based on utilization
    if is_over:
        bar_color = "bold red"
        status_badge = "[bold white on red] OVER BUDGET [/bold white on red]"
    elif pct >= Decimal("85.0"):
        bar_color = "bold yellow"
        status_badge = "[bold black on yellow] BUDGET WARNING [/bold black on yellow]"
    else:
        bar_color = "bold green"
        status_badge = "[bold white on green] ON TRACK [/bold white on green]"

    # Build ASCII progress bar
    bar_width = 32
    ratio = min(1.0, float(pct) / 100.0) if budget > 0 else 1.0
    filled_len = int(ratio * bar_width)
    empty_len = max(0, bar_width - filled_len)

    bar_str = f"[{bar_color}]{'█' * filled_len}[/{bar_color}][dim white]{'░' * empty_len}[/dim white]"

    table = Table.grid(expand=True)
    table.add_column(ratio=2)
    table.add_column(ratio=2)
    table.add_column(ratio=2)
    table.add_column(ratio=2)

    c1 = Text.from_markup(f"[dim]Budget:[/dim]\n[bold white]${budget:.2f}[/bold white]")
    c2 = Text.from_markup(f"[dim]Spent (w/ Tax):[/dim]\n[bold cyan]${spent:.2f}[/bold cyan]")
    c3 = Text.from_markup(f"[dim]Remaining:[/dim]\n[{'bold red' if is_over else 'bold green'}]${remaining:.2f}[/]")
    c4 = Text.from_markup(f"[dim]Used:[/dim]\n[bold magenta]{pct:.1f}%[/bold magenta]")

    table.add_row(c1, c2, c3, c4)

    progress_layout = Table.grid(expand=True)
    progress_layout.add_column(ratio=3)
    progress_layout.add_column(ratio=1, justify="right")
    progress_layout.add_row(Text.from_markup(f"{bar_str}  {pct:.1f}%"), Text.from_markup(status_badge))

    summary_content = Table.grid(expand=True)
    summary_content.add_column()
    summary_content.add_row(table)
    summary_content.add_row(Text(""))
    summary_content.add_row(progress_layout)

    return Panel(
        summary_content,
        title="[bold yellow]⚡ Real-Time Budget Gauge[/bold yellow]",
        border_style="yellow" if not is_over else "red",
        padding=(0, 1),
    )


def create_items_table(cart: ShoppingCart, palette: ThemePalette, selected_index: Optional[int] = None) -> Table:
    """Renders the interactive items table with all item details."""
    table = Table(
        title=f"🛒 Active Shopping Cart ({len(cart.items)} Items)",
        title_style="bold cyan",
        expand=True,
        border_style="dim white",
        header_style="bold magenta on #1e293b",
    )

    table.add_column("#", justify="center", width=4)
    table.add_column("Fav", justify="center", width=4)
    table.add_column("Item Name", justify="left", ratio=3)
    table.add_column("Category", justify="left", ratio=2)
    table.add_column("Qty", justify="right", width=6)
    table.add_column("Reg Price", justify="right", width=10)
    table.add_column("Discounts", justify="right", width=10)
    table.add_column("Net Unit", justify="right", width=10)
    table.add_column("Subtotal", justify="right", width=11)
    table.add_column("Tax", justify="center", width=5)

    if not cart.items:
        table.add_row("-", "-", "[dim italic]Cart is currently empty. Press [A] to add an item.[/dim italic]", "", "", "", "", "", "$0.00", "-")
        return table

    for idx, item in enumerate(cart.items):
        is_selected = selected_index == idx
        row_style = "bold white on #334155" if is_selected else ""

        fav_str = "[yellow]★[/yellow]" if item.is_favorite else "[dim]☆[/dim]"
        tax_str = "[green]✓[/green]" if item.is_taxable else "[dim]-[/dim]"
        
        discount_val = item.total_savings
        disc_str = f"[green]-${discount_val:.2f}[/green]" if discount_val > Decimal("0") else "[dim]$0.00[/dim]"

        table.add_row(
            f"{idx + 1}",
            fav_str,
            f"[bold]{item.name}[/bold]" + (f"\n[dim italic]{item.notes}[/dim italic]" if item.notes else ""),
            f"{item.category}",
            f"{item.quantity:.0f}" if item.quantity % 1 == 0 else f"{item.quantity:.2f}",
            f"${item.regular_price:.2f}",
            disc_str,
            f"${item.unit_price:.2f}",
            f"[bold cyan]${item.net_subtotal:.2f}[/bold cyan]",
            tax_str,
            style=row_style,
        )

    return table


def create_tax_summary_panel(cart: ShoppingCart, palette: ThemePalette) -> Panel:
    """Renders the itemized tax breakdown respecting the tax visibility rule."""
    bd = cart.tax_breakdown
    visible = bd.get_visible_taxes()

    table = Table.grid(expand=True)
    table.add_column(justify="left", ratio=2)
    table.add_column(justify="right", ratio=1)

    table.add_row(Text.from_markup("[dim]Merchandise Subtotal:[/dim]"), Text.from_markup(f"[bold white]${cart.subtotal:.2f}[/bold white]"))
    table.add_row(Text.from_markup("[dim]Taxable Subtotal:[/dim]"), Text.from_markup(f"${cart.taxable_subtotal:.2f}"))
    table.add_row(Text.from_markup("[dim]Non-Taxable Subtotal:[/dim]"), Text.from_markup(f"${cart.non_taxable_subtotal:.2f}"))
    table.add_row(Text.from_markup("[dim]──────────────────────────[/dim]"), Text.from_markup("[dim]──────────[/dim]"))

    # Only show active/visible taxes
    for name, info in visible.items():
        table.add_row(
            Text.from_markup(f"[cyan]{name}[/cyan] [dim]({info['percentage_str']}):[/dim]"),
            Text.from_markup(f"[bold cyan]${info['amount']:.2f}[/bold cyan]"),
        )

    table.add_row(Text.from_markup("[bold]Total Sales Tax:[/bold]"), Text.from_markup(f"[bold yellow]${cart.total_tax:.2f}[/bold yellow]"))
    table.add_row(Text.from_markup("[dim]══════════════════════════[/dim]"), Text.from_markup("[dim]══════════[/dim]"))
    table.add_row(Text.from_markup("[bold white]GRAND TOTAL:[/bold white]"), Text.from_markup(f"[bold green]${cart.grand_total:.2f}[/bold green]"))

    if cart.total_savings > Decimal("0"):
        table.add_row(Text.from_markup("[bold green]Total Savings (Coupons/Sales):[/bold green]"), Text.from_markup(f"[bold green]${cart.total_savings:.2f}[/bold green]"))

    return Panel(
        table,
        title="[bold cyan]📍 Sales Tax & Financial Breakdown[/bold cyan]",
        border_style="cyan",
        padding=(0, 1),
    )


def create_footer_shortcuts() -> Panel:
    """Renders the application footer with keyboard shortcuts."""
    shortcuts = [
        ("[A]", "Add Item"),
        ("[E]", "Edit"),
        ("[D]", "Duplicate"),
        ("[DEL]", "Delete"),
        ("[F]", "Favorite"),
        ("[↑/↓]", "Move Item"),
        ("[S]", "Store & Tax"),
        ("[R]", "Receipts"),
        ("[X]", "Export"),
        ("[H]", "History"),
        ("[B]", "Set Budget"),
        ("[C]", "Clear Cart"),
        ("[T]", "Themes"),
        ("[Q]", "Quit"),
    ]

    parts = []
    for key, label in shortcuts:
        parts.append(f"[bold yellow]{key}[/bold yellow] [dim]{label}[/dim]")

    text = Text.from_markup("  •  ".join(parts))
    return Panel(Align.center(text), style="dim #475569", padding=(0, 1))
