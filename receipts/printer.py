"""
MJD Shopping Manager - Receipt Printer
Supports 5 Distinct Receipt Styles:
1. Standard
2. Store
3. Detailed
4. Budget Summary
5. Thermal Receipt
"""
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional
from config.constants import ReceiptStyle
from shopping.cart import ShoppingCart


class ReceiptPrinter:
    """
    Renders shopping cart contents into styled receipts for terminal display,
    text printing, or export.
    """

    def __init__(self, cart: ShoppingCart, width: int = 44):
        self.cart = cart
        self.width = max(32, min(width, 80))

    def render(self, style: ReceiptStyle = ReceiptStyle.STANDARD) -> str:
        if style == ReceiptStyle.STANDARD or style == "standard":
            return self.render_standard()
        elif style == ReceiptStyle.STORE or style == "store":
            return self.render_store()
        elif style == ReceiptStyle.DETAILED or style == "detailed":
            return self.render_detailed()
        elif style == ReceiptStyle.BUDGET_SUMMARY or style == "budget_summary":
            return self.render_budget_summary()
        elif style == ReceiptStyle.THERMAL_RECEIPT or style == "thermal_receipt":
            return self.render_thermal()
        return self.render_standard()

    def _divider(self, char: str = "-") -> str:
        return char * self.width

    def _line(self, left: str, right: str) -> str:
        space = self.width - len(left) - len(right)
        if space < 1:
            left = left[:max(1, self.width - len(right) - 2)] + ".."
            space = 1
        return f"{left}{' ' * space}{right}"

    def _center(self, text: str) -> str:
        return text.center(self.width)

    # 1. Standard Receipt
    def render_standard(self) -> str:
        lines = []
        now = datetime.now().strftime("%Y-%m-%d %I:%M %p")
        
        lines.append(self._center("MJD SHOPPING MANAGER"))
        lines.append(self._center(f"Store: {self.cart.store_name}"))
        lines.append(self._center(now))
        lines.append(self._divider("="))

        lines.append(self._line("ITEM", "PRICE"))
        lines.append(self._divider("-"))

        for item in self.cart.items:
            tax_flag = " T" if item.is_taxable else "  "
            qty_str = f"{item.quantity:.0f}x " if item.quantity != Decimal("1") else ""
            item_line = f"{qty_str}{item.name}"
            price_str = f"${item.net_subtotal:.2f}{tax_flag}"
            lines.append(self._line(item_line, price_str))
            if item.total_savings > Decimal("0.00"):
                lines.append(f"  * Saved ${item.total_savings:.2f}")

        lines.append(self._divider("-"))
        lines.append(self._line("Subtotal:", f"${self.cart.subtotal:.2f}"))

        # Visible taxes only
        tax_bd = self.cart.tax_breakdown
        visible_taxes = tax_bd.get_visible_taxes()
        for tax_name, info in visible_taxes.items():
            lines.append(self._line(f"{tax_name} ({info['percentage_str']}):", f"${info['amount']:.2f}"))

        lines.append(self._line("Total Sales Tax:", f"${self.cart.total_tax:.2f}"))
        lines.append(self._divider("="))
        lines.append(self._line("GRAND TOTAL:", f"${self.cart.grand_total:.2f}"))
        if self.cart.total_savings > Decimal("0"):
            lines.append(self._line("TOTAL SAVINGS:", f"${self.cart.total_savings:.2f}"))
        lines.append(self._divider("-"))
        lines.append(self._line("Budget:", f"${self.cart.budget:.2f}"))
        status_word = "Remaining" if not self.cart.is_overspent else "OVER BUDGET"
        lines.append(self._line(f"{status_word}:", f"${abs(self.cart.remaining_budget):.2f}"))
        lines.append(self._divider("="))
        lines.append(self._center("THANK YOU FOR SHOPPING!"))
        lines.append(self._center("Please retain for your records"))

        return "\n".join(lines)

    # 2. Branded Store Receipt
    def render_store(self) -> str:
        lines = []
        now = datetime.now().strftime("%m/%d/%Y %H:%M:%S")
        receipt_id = f"TRX#{abs(hash(self.cart.name + str(self.cart.grand_total))) % 900000 + 100000}"

        lines.append(self._divider("*"))
        lines.append(self._center(self.cart.store_name.upper()))
        if self.cart.store_address:
            lines.append(self._center(self.cart.store_address))
        lines.append(self._center("Pueblo, CO - Store #4210"))
        lines.append(self._center("Tel: (719) 545-6600"))
        lines.append(self._divider("*"))
        lines.append(self._line(f"Date: {now}", f"Reg: 04  Seq: 88"))
        lines.append(self._line(f"Receipt: {receipt_id}", "Cashier: Self-Check"))
        lines.append(self._divider("-"))
        lines.append(self._line("DESCRIPTION", "AMOUNT"))
        lines.append(self._divider("-"))

        for item in self.cart.items:
            tax_flag = " T" if item.is_taxable else " N"
            name_display = item.name[:22]
            lines.append(self._line(name_display, f"${item.net_subtotal:.2f}{tax_flag}"))
            if item.quantity != Decimal("1"):
                lines.append(f"  {item.quantity} @ ${item.unit_price:.2f}/ea")
            if item.sale_discount > Decimal("0"):
                lines.append(f"  SALE DISC -${item.sale_discount * item.quantity:.2f}")
            if item.coupon_discount > Decimal("0"):
                lines.append(f"  MFR COUPON -${item.coupon_discount * item.quantity:.2f}")

        lines.append(self._divider("-"))
        lines.append(self._line("SUBTOTAL", f"${self.cart.subtotal:.2f}"))

        visible_taxes = self.cart.tax_breakdown.get_visible_taxes()
        for name, info in visible_taxes.items():
            lines.append(self._line(f"TAX ({info['percentage_str']})", f"${info['amount']:.2f}"))

        lines.append(self._line("TOTAL TAX", f"${self.cart.total_tax:.2f}"))
        lines.append(self._divider("="))
        lines.append(self._line("TOTAL PAID", f"${self.cart.grand_total:.2f}"))
        lines.append(self._divider("="))
        lines.append(self._line("ITEMS SOLD", str(int(self.cart.total_items_count))))
        if self.cart.total_savings > Decimal("0"):
            lines.append(self._line("YOU SAVED TODAY", f"${self.cart.total_savings:.2f}"))
        lines.append(self._divider("-"))
        lines.append(self._center("RETURN POLICY: 90 DAYS WITH RECEIPT"))
        lines.append(self._center("Visit mjdshopping.local/survey"))
        lines.append(self._center("********************************"))

        return "\n".join(lines)

    # 3. Detailed Breakdown Receipt
    def render_detailed(self) -> str:
        lines = []
        now = datetime.now().strftime("%Y-%m-%d %H:%M")

        lines.append(self._divider("#"))
        lines.append(self._center("MJD SHOPPING MANAGER - DETAILED AUDIT"))
        lines.append(self._center(f"List: {self.cart.name} | Store: {self.cart.store_name}"))
        lines.append(self._center(f"Generated: {now}"))
        lines.append(self._divider("#"))

        # Group by category
        by_category: Dict[str, list] = {}
        for item in self.cart.items:
            by_category.setdefault(item.category, []).append(item)

        for cat, items in by_category.items():
            cat_subtotal = sum((i.net_subtotal for i in items), Decimal("0.00"))
            lines.append(f"[{cat.upper()}] - Subtotal: ${cat_subtotal:.2f}")
            lines.append(self._divider("."))
            for item in items:
                t_lbl = "[Taxable]" if item.is_taxable else "[Non-Taxable]"
                lines.append(f"  * {item.name}")
                lines.append(f"    Qty: {item.quantity} | Reg: ${item.regular_price:.2f} | Net: ${item.unit_price:.2f} | {t_lbl}")
                if item.total_savings > Decimal("0"):
                    lines.append(f"    Savings: Sale -${item.sale_discount * item.quantity:.2f}, Coupon -${item.coupon_discount * item.quantity:.2f}")
                if item.notes:
                    lines.append(f"    Note: {item.notes}")
                lines.append(self._line("    Item Subtotal:", f"${item.net_subtotal:.2f}"))
            lines.append("")

        lines.append(self._divider("="))
        lines.append(self._center("AUDIT FINANCIAL SUMMARY"))
        lines.append(self._divider("-"))
        lines.append(self._line("Regular Total (MSRP):", f"${self.cart.regular_subtotal:.2f}"))
        lines.append(self._line("Discounts & Coupons:", f"-${self.cart.total_savings:.2f}"))
        lines.append(self._line("Taxable Net Subtotal:", f"${self.cart.taxable_subtotal:.2f}"))
        lines.append(self._line("Non-Taxable Subtotal:", f"${self.cart.non_taxable_subtotal:.2f}"))
        lines.append(self._line("Net Merchandise Subtotal:", f"${self.cart.subtotal:.2f}"))
        
        visible_taxes = self.cart.tax_breakdown.get_visible_taxes()
        for name, info in visible_taxes.items():
            lines.append(self._line(f"  + {name} ({info['percentage_str']}):", f"${info['amount']:.2f}"))
        lines.append(self._line("Total Sales Taxes:", f"${self.cart.total_tax:.2f}"))
        lines.append(self._divider("-"))
        lines.append(self._line("FINAL GRAND TOTAL:", f"${self.cart.grand_total:.2f}"))
        lines.append(self._divider("#"))

        return "\n".join(lines)

    # 4. Budget Summary Receipt
    def render_budget_summary(self) -> str:
        lines = []
        now = datetime.now().strftime("%Y-%m-%d %I:%M %p")

        lines.append(self._divider("="))
        lines.append(self._center("MJD BUDGET HEALTH & SPENDING REPORT"))
        lines.append(self._center(f"Trip: {self.cart.name} ({now})"))
        lines.append(self._divider("="))

        lines.append(self._line("Allocated Starting Budget:", f"${self.cart.budget:.2f}"))
        lines.append(self._line("Total Cart Merchandise:", f"${self.cart.subtotal:.2f}"))
        lines.append(self._line("Total Itemized Taxes:", f"${self.cart.total_tax:.2f}"))
        lines.append(self._divider("-"))
        lines.append(self._line("Total Trip Expenditure:", f"${self.cart.grand_total:.2f}"))

        pct = self.cart.percent_used
        bar_len = 20
        filled = min(bar_len, int((float(pct) / 100.0) * bar_len))
        bar = "[" + "#" * filled + "-" * (bar_len - filled) + "]"
        lines.append(self._line("Budget Utilization:", f"{pct:.1f}%"))
        lines.append(self._center(bar))

        lines.append(self._divider("-"))
        if self.cart.is_overspent:
            lines.append(self._center("!! WARNING: OVER BUDGET !!"))
            lines.append(self._line("Over Budget Amount:", f"${self.cart.overspent_amount:.2f}"))
        else:
            lines.append(self._center("STATUS: UNDER BUDGET - HEALTHY"))
            lines.append(self._line("Surplus / Remaining Cash:", f"${self.cart.remaining_budget:.2f}"))

        lines.append(self._divider("-"))
        lines.append(self._line("Coupons & Promotional Savings:", f"${self.cart.total_savings:.2f}"))
        lines.append(self._line("Total Items Acquired:", str(int(self.cart.total_items_count))))
        lines.append(self._divider("="))

        return "\n".join(lines)

    # 5. Thermal Receipt
    def render_thermal(self) -> str:
        lines = []
        w = min(self.width, 38)
        now = datetime.now().strftime("%d-%b-%Y %H:%M")

        lines.append(".------------------------------------.")
        lines.append(f"| {self.cart.store_name[:34].center(34)} |")
        lines.append(f"| {'*** THERMAL TICKET ***'.center(34)} |")
        lines.append(f"| {now.center(34)} |")
        lines.append("|------------------------------------|")
        lines.append("| QTY ITEM                     PRICE |")
        lines.append("|------------------------------------|")

        for item in self.cart.items:
            q_str = f"{item.quantity:.0f}x"[:3]
            n_str = item.name[:18].ljust(18)
            p_str = f"${item.net_subtotal:.2f}".rjust(8)
            tax_flag = "T" if item.is_taxable else " "
            row = f"| {q_str:<3} {n_str} {p_str} {tax_flag}|"
            lines.append(row[:38])

        lines.append("|------------------------------------|")
        lines.append(f"| Subtotal:             ${self.cart.subtotal:>8.2f}  |")

        visible_taxes = self.cart.tax_breakdown.get_visible_taxes()
        for name, info in visible_taxes.items():
            short_name = name.replace("Colorado State Tax", "CO State Tax").replace("Pueblo County Tax", "Pueblo Co Tax")
            lines.append(f"| {short_name[:18]:<18}   ${info['amount']:>8.2f}  |")

        lines.append(f"| Total Tax:            ${self.cart.total_tax:>8.2f}  |")
        lines.append("|====================================|")
        lines.append(f"| GRAND TOTAL:          ${self.cart.grand_total:>8.2f}  |")
        lines.append("|====================================|")
        lines.append(f"| Budget Remaining:     ${self.cart.remaining_budget:>8.2f}  |")
        lines.append("|                                    |")
        lines.append("|   || | | ||| |||| | || ||||| |||   |")
        lines.append("|        9824 1092 8419 0281         |")
        lines.append("|                                    |")
        lines.append("|        THANK YOU FOR SHOPPING!     |")
        lines.append("'------------------------------------'")

        return "\n".join(lines)
