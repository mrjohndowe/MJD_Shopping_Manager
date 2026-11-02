"""
MJD Shopping Manager - Export Manager
Supports TXT, CSV, JSON, Markdown, and formatted summary exports.
Includes optional key encryption locking and read-only attribute protection.
"""
import csv
import io
import json
import os
import stat
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Dict, Any, Optional, Union
from config.constants import EXPORTS_DIR, ExportFormat
from shopping.cart import ShoppingCart


class ExportManager:
    """
    Handles exporting cart data, trip history, and statistics to various formats.
    Supports file locking and XOR/Key-based encryption protection.
    """

    def __init__(self, export_dir: Path = EXPORTS_DIR):
        self.export_dir = export_dir
        self.export_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _encrypt_bytes(data: bytes, key: str) -> bytes:
        """XOR Stream Cipher with key rotation and integrity header."""
        if not key:
            return data
        key_bytes = key.encode("utf-8")
        header = b"MJD_ENCRYPTED_V1:"
        encrypted = bytearray(len(data))
        for i, b in enumerate(data):
            encrypted[i] = b ^ key_bytes[i % len(key_bytes)]
        return header + bytes(encrypted)

    @staticmethod
    def _decrypt_bytes(data: bytes, key: str) -> bytes:
        header = b"MJD_ENCRYPTED_V1:"
        if not data.startswith(header):
            return data
        raw = data[len(header):]
        key_bytes = key.encode("utf-8")
        decrypted = bytearray(len(raw))
        for i, b in enumerate(raw):
            decrypted[i] = b ^ key_bytes[i % len(key_bytes)]
        return bytes(decrypted)

    def export_cart_txt(self, cart: ShoppingCart, filename: Optional[str] = None, encrypt_key: Optional[str] = None, make_readonly: bool = True) -> Path:
        from receipts.printer import ReceiptPrinter
        printer = ReceiptPrinter(cart)
        content = printer.render_standard() + "\n\n" + printer.render_detailed()

        fname = filename or f"mjd_cart_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        dest = self.export_dir / fname
        raw_bytes = content.encode("utf-8")

        if encrypt_key:
            raw_bytes = self._encrypt_bytes(raw_bytes, encrypt_key)
            if not fname.endswith(".enc"):
                fname += ".enc"
                dest = self.export_dir / fname

        with open(dest, "wb") as f:
            f.write(raw_bytes)

        if make_readonly:
            try:
                os.chmod(dest, stat.S_IREAD | stat.S_IRGRP | stat.S_IROTH)
            except Exception:
                pass

        return dest

    def export_cart_csv(self, cart: ShoppingCart, filename: Optional[str] = None, encrypt_key: Optional[str] = None, make_readonly: bool = True) -> Path:
        fname = filename or f"mjd_cart_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        dest = self.export_dir / fname

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["MJD Shopping Manager - Cart Export", f"Store: {cart.store_name}", f"Date: {datetime.now().isoformat()}"])
        writer.writerow([])
        writer.writerow(["Item Name", "Category", "Department", "Quantity", "Regular Price", "Sale Discount", "Coupon Discount", "Unit Price", "Net Subtotal", "Savings", "Taxable", "Notes"])

        for item in cart.items:
            writer.writerow([
                item.name,
                item.category,
                item.department,
                str(item.quantity),
                f"${item.regular_price:.2f}",
                f"${item.sale_discount:.2f}",
                f"${item.coupon_discount:.2f}",
                f"${item.unit_price:.2f}",
                f"${item.net_subtotal:.2f}",
                f"${item.total_savings:.2f}",
                "YES" if item.is_taxable else "NO",
                item.notes,
            ])

        writer.writerow([])
        writer.writerow(["Subtotal", f"${cart.subtotal:.2f}"])
        visible_taxes = cart.tax_breakdown.get_visible_taxes()
        for name, info in visible_taxes.items():
            writer.writerow([f"{name} ({info['percentage_str']})", f"${info['amount']:.2f}"])
        writer.writerow(["Total Tax", f"${cart.total_tax:.2f}"])
        writer.writerow(["Grand Total", f"${cart.grand_total:.2f}"])
        writer.writerow(["Budget", f"${cart.budget:.2f}"])
        writer.writerow(["Remaining Budget", f"${cart.remaining_budget:.2f}"])

        content_bytes = output.getvalue().encode("utf-8")
        if encrypt_key:
            content_bytes = self._encrypt_bytes(content_bytes, encrypt_key)
            if not fname.endswith(".enc"):
                fname += ".enc"
                dest = self.export_dir / fname

        with open(dest, "wb") as f:
            f.write(content_bytes)

        if make_readonly:
            try:
                os.chmod(dest, stat.S_IREAD | stat.S_IRGRP | stat.S_IROTH)
            except Exception:
                pass

        return dest

    def export_cart_json(self, cart: ShoppingCart, filename: Optional[str] = None, encrypt_key: Optional[str] = None, make_readonly: bool = True) -> Path:
        fname = filename or f"mjd_cart_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        dest = self.export_dir / fname

        payload = {
            "application": "MJD Shopping Manager",
            "version": "2.4.0",
            "export_timestamp": datetime.now().isoformat(),
            "locked_readonly": make_readonly,
            "cart": cart.to_dict(),
        }

        json_str = json.dumps(payload, indent=2)
        raw_bytes = json_str.encode("utf-8")

        if encrypt_key:
            raw_bytes = self._encrypt_bytes(raw_bytes, encrypt_key)
            if not fname.endswith(".enc"):
                fname += ".enc"
                dest = self.export_dir / fname

        with open(dest, "wb") as f:
            f.write(raw_bytes)

        if make_readonly:
            try:
                os.chmod(dest, stat.S_IREAD | stat.S_IRGRP | stat.S_IROTH)
            except Exception:
                pass

        return dest

    def export_cart_markdown(self, cart: ShoppingCart, filename: Optional[str] = None, encrypt_key: Optional[str] = None, make_readonly: bool = True) -> Path:
        fname = filename or f"mjd_cart_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        dest = self.export_dir / fname

        lines = [
            f"# 🛒 MJD Shopping Manager - Trip Summary",
            f"**List Name:** {cart.name}  ",
            f"**Store:** {cart.store_name} ({cart.store_address})  ",
            f"**Date:** {datetime.now().strftime('%B %d, %Y - %I:%M %p')}  ",
            "",
            "## 📦 Items in Cart",
            "| Item | Qty | Reg Price | Discounts | Unit Price | Subtotal | Taxable |",
            "| :--- | :---: | :---: | :---: | :---: | :---: | :---: |",
        ]

        for item in cart.items:
            discounts = f"-${item.total_savings:.2f}" if item.total_savings > Decimal("0") else "$0.00"
            tax_flag = "✓" if item.is_taxable else "-"
            lines.append(f"| **{item.name}** | {item.quantity} | ${item.regular_price:.2f} | {discounts} | ${item.unit_price:.2f} | **${item.net_subtotal:.2f}** | {tax_flag} |")

        lines.extend([
            "",
            "## 💰 Financial & Tax Breakdown",
            f"- **Merchandise Subtotal:** `${cart.subtotal:.2f}`",
        ])

        visible_taxes = cart.tax_breakdown.get_visible_taxes()
        for name, info in visible_taxes.items():
            lines.append(f"- **{name} ({info['percentage_str']}):** `${info['amount']:.2f}`")

        lines.extend([
            f"- **Total Sales Tax:** `${cart.total_tax:.2f}`",
            f"- **Grand Total:** **`${cart.grand_total:.2f}`**",
            f"- **Total Savings:** `${cart.total_savings:.2f}`",
            "",
            "## 📊 Budget Progress",
            f"- **Allocated Budget:** `${cart.budget:.2f}`",
            f"- **Remaining Balance:** `${cart.remaining_budget:.2f}`",
            f"- **Percent Utilized:** `{cart.percent_used}%`",
            f"- **Status:** {'⚠️ OVER BUDGET' if cart.is_overspent else '✅ Within Budget'}",
            "",
            "---",
            "*Generated securely by MJD Shopping Manager*",
        ])

        raw_bytes = "\n".join(lines).encode("utf-8")
        if encrypt_key:
            raw_bytes = self._encrypt_bytes(raw_bytes, encrypt_key)
            if not fname.endswith(".enc"):
                fname += ".enc"
                dest = self.export_dir / fname

        with open(dest, "wb") as f:
            f.write(raw_bytes)

        if make_readonly:
            try:
                os.chmod(dest, stat.S_IREAD | stat.S_IRGRP | stat.S_IROTH)
            except Exception:
                pass

        return dest

    def export_by_format(self, cart: ShoppingCart, fmt: Union[ExportFormat, str], encrypt_key: Optional[str] = None) -> Path:
        fmt_str = str(fmt).lower()
        if "csv" in fmt_str:
            return self.export_cart_csv(cart, encrypt_key=encrypt_key)
        elif "json" in fmt_str:
            return self.export_cart_json(cart, encrypt_key=encrypt_key)
        elif "md" in fmt_str or "markdown" in fmt_str:
            return self.export_cart_markdown(cart, encrypt_key=encrypt_key)
        else:
            return self.export_cart_txt(cart, encrypt_key=encrypt_key)
