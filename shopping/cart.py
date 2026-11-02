"""
MJD Shopping Manager - Shopping Cart Model & Logic
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Dict, Any
from config.constants import DEFAULT_BUDGET
from shopping.item import ShoppingItem
from taxes.calculator import TaxCalculator, TaxBreakdown


class ShoppingCart:
    """
    Manages active items in the shopping cart and computes totals,
    tax breakdowns, savings, and budget tracking metrics.
    """

    def __init__(self, name: str = "My Shopping List", budget: Decimal = DEFAULT_BUDGET):
        self.name: str = name
        self.budget: Decimal = Decimal(str(budget))
        self.items: List[ShoppingItem] = []
        self.tax_calculator: TaxCalculator = TaxCalculator()
        self.store_id: Optional[int] = None
        self.store_name: str = "Walmart Supercenter"
        self.store_address: str = "4200 Dillon Dr, Pueblo, CO 81008"

    # --- Item Management ---

    def add_item(self, item: ShoppingItem) -> ShoppingItem:
        """Adds a new item to the cart and assigns its sort order."""
        item.sort_order = len(self.items)
        self.items.append(item)
        return item

    def remove_item(self, item_id: str) -> Optional[ShoppingItem]:
        """Removes an item by ID and re-indexes sort order."""
        for idx, item in enumerate(self.items):
            if item.id == item_id:
                removed = self.items.pop(idx)
                self._reindex()
                return removed
        return None

    def get_item(self, item_id: str) -> Optional[ShoppingItem]:
        """Finds an item by its ID."""
        for item in self.items:
            if item.id == item_id:
                return item
        return None

    def edit_item(
        self,
        item_id: str,
        name: Optional[str] = None,
        category: Optional[str] = None,
        department: Optional[str] = None,
        quantity: Optional[Decimal] = None,
        regular_price: Optional[Decimal] = None,
        sale_discount: Optional[Decimal] = None,
        coupon_discount: Optional[Decimal] = None,
        is_taxable: Optional[bool] = None,
        is_favorite: Optional[bool] = None,
        barcode: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[ShoppingItem]:
        item = self.get_item(item_id)
        if not item:
            return None

        if name is not None:
            item.name = name
        if category is not None:
            item.category = category
        if department is not None:
            item.department = department
        if quantity is not None:
            item.quantity = Decimal(str(quantity))
        if regular_price is not None:
            item.regular_price = Decimal(str(regular_price))
        if sale_discount is not None:
            item.sale_discount = Decimal(str(sale_discount))
        if coupon_discount is not None:
            item.coupon_discount = Decimal(str(coupon_discount))
        if is_taxable is not None:
            item.is_taxable = is_taxable
        if is_favorite is not None:
            item.is_favorite = is_favorite
        if barcode is not None:
            item.barcode = barcode
        if notes is not None:
            item.notes = notes

        return item

    def duplicate_item(self, item_id: str) -> Optional[ShoppingItem]:
        item = self.get_item(item_id)
        if not item:
            return None
        clone = item.clone()
        # Insert right after the original item
        idx = self.items.index(item)
        self.items.insert(idx + 1, clone)
        self._reindex()
        return clone

    def move_item(self, item_id: str, direction: str) -> bool:
        """Moves item 'up' or 'down' in the list."""
        item = self.get_item(item_id)
        if not item:
            return False
        idx = self.items.index(item)
        if direction.lower() == "up" and idx > 0:
            self.items[idx], self.items[idx - 1] = self.items[idx - 1], self.items[idx]
            self._reindex()
            return True
        elif direction.lower() == "down" and idx < len(self.items) - 1:
            self.items[idx], self.items[idx + 1] = self.items[idx + 1], self.items[idx]
            self._reindex()
            return True
        return False

    def clear_cart(self) -> None:
        self.items.clear()

    def _reindex(self) -> None:
        for idx, item in enumerate(self.items):
            item.sort_order = idx

    def search_items(self, query: str) -> List[ShoppingItem]:
        q = query.lower().strip()
        if not q:
            return list(self.items)
        return [
            item for item in self.items
            if q in item.name.lower() or q in item.category.lower() or q in item.department.lower() or q in item.notes.lower()
        ]

    # --- Calculations ---

    @property
    def total_items_count(self) -> Decimal:
        """Total quantity of all items."""
        return sum((item.quantity for item in self.items), Decimal("0"))

    @property
    def distinct_items_count(self) -> int:
        return len(self.items)

    @property
    def subtotal(self) -> Decimal:
        """Net subtotal of all items before taxes."""
        return sum((item.net_subtotal for item in self.items), Decimal("0.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @property
    def regular_subtotal(self) -> Decimal:
        """Subtotal if everything was bought at regular non-sale price."""
        return sum((item.regular_total for item in self.items), Decimal("0.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @property
    def total_savings(self) -> Decimal:
        """Total amount saved from sales and coupons."""
        return sum((item.total_savings for item in self.items), Decimal("0.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @property
    def coupons_count(self) -> int:
        """Number of items with active coupons."""
        return sum(1 for item in self.items if item.has_coupon)

    @property
    def taxable_subtotal(self) -> Decimal:
        return sum((item.net_subtotal for item in self.items if item.is_taxable), Decimal("0.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @property
    def non_taxable_subtotal(self) -> Decimal:
        return sum((item.net_subtotal for item in self.items if not item.is_taxable), Decimal("0.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @property
    def tax_breakdown(self) -> TaxBreakdown:
        return self.tax_calculator.calculate_for_amount(self.taxable_subtotal, self.non_taxable_subtotal)

    @property
    def total_tax(self) -> Decimal:
        return self.tax_breakdown.total_tax

    @property
    def grand_total(self) -> Decimal:
        return (self.subtotal + self.total_tax).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # --- Budget Metrics ---

    @property
    def remaining_budget(self) -> Decimal:
        return (self.budget - self.grand_total).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @property
    def percent_used(self) -> Decimal:
        if self.budget <= Decimal("0"):
            return Decimal("100.00") if self.grand_total > Decimal("0") else Decimal("0.00")
        pct = (self.grand_total / self.budget) * Decimal("100")
        return pct.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)

    @property
    def is_overspent(self) -> bool:
        return self.grand_total > self.budget

    @property
    def overspent_amount(self) -> Decimal:
        if self.is_overspent:
            return (self.grand_total - self.budget).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return Decimal("0.00")

    def get_budget_summary(self) -> Dict[str, Any]:
        return {
            "starting_budget": str(self.budget),
            "subtotal": str(self.subtotal),
            "state_tax": str(self.tax_breakdown.state_tax_amount),
            "county_tax": str(self.tax_breakdown.county_tax_amount),
            "city_tax": str(self.tax_breakdown.city_tax_amount),
            "special_tax": str(self.tax_breakdown.special_tax_amount),
            "total_tax": str(self.total_tax),
            "grand_total": str(self.grand_total),
            "total_savings": str(self.total_savings),
            "remaining_budget": str(self.remaining_budget),
            "percent_used": float(self.percent_used),
            "is_overspent": self.is_overspent,
            "overspent_amount": str(self.overspent_amount),
            "items_count": int(self.total_items_count),
            "distinct_items": self.distinct_items_count,
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "budget": str(self.budget),
            "store_id": self.store_id,
            "store_name": self.store_name,
            "store_address": self.store_address,
            "items": [item.to_dict() for item in self.items],
            "tax_rates": {
                "state": str(self.tax_calculator.state_rate),
                "county": str(self.tax_calculator.county_rate),
                "city": str(self.tax_calculator.city_rate),
                "special": str(self.tax_calculator.special_rate),
            },
            "summary": self.get_budget_summary(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ShoppingCart":
        cart = cls(
            name=str(data.get("name", "My Shopping List")),
            budget=Decimal(str(data.get("budget", DEFAULT_BUDGET))),
        )
        cart.store_id = data.get("store_id")
        cart.store_name = str(data.get("store_name", "Walmart Supercenter"))
        cart.store_address = str(data.get("store_address", "4200 Dillon Dr, Pueblo, CO 81008"))

        if "tax_rates" in data:
            rates = data["tax_rates"]
            cart.tax_calculator.set_rates(
                state_rate=Decimal(str(rates.get("state", "0.0290"))),
                county_rate=Decimal(str(rates.get("county", "0.0100"))),
                city_rate=Decimal(str(rates.get("city", "0.0370"))),
                special_rate=Decimal(str(rates.get("special", "0.0000"))),
            )

        for item_data in data.get("items", []):
            cart.add_item(ShoppingItem.from_dict(item_data))

        return cart
