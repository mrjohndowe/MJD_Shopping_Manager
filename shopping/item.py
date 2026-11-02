"""
MJD Shopping Manager - Shopping Item Data Model
"""
from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional
import uuid


@dataclass
class ShoppingItem:
    """
    Represents an individual item in a shopping cart or list.
    All monetary calculations strictly use Decimal.
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "New Item"
    category: str = "General"
    department: str = "Grocery"
    quantity: Decimal = field(default_factory=lambda: Decimal("1.00"))
    regular_price: Decimal = field(default_factory=lambda: Decimal("0.00"))
    sale_discount: Decimal = field(default_factory=lambda: Decimal("0.00"))   # per unit discount
    coupon_discount: Decimal = field(default_factory=lambda: Decimal("0.00")) # per unit coupon
    is_taxable: bool = True
    is_favorite: bool = False
    barcode: str = ""
    notes: str = ""
    sort_order: int = 0

    def __post_init__(self):
        if not isinstance(self.quantity, Decimal):
            self.quantity = Decimal(str(self.quantity))
        if not isinstance(self.regular_price, Decimal):
            self.regular_price = Decimal(str(self.regular_price))
        if not isinstance(self.sale_discount, Decimal):
            self.sale_discount = Decimal(str(self.sale_discount))
        if not isinstance(self.coupon_discount, Decimal):
            self.coupon_discount = Decimal(str(self.coupon_discount))

    @property
    def unit_price(self) -> Decimal:
        """Effective net price per unit after sale and coupon discounts."""
        effective = self.regular_price - self.sale_discount - self.coupon_discount
        return max(Decimal("0.00"), effective).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @property
    def regular_total(self) -> Decimal:
        """Total price without any discounts."""
        return (self.regular_price * self.quantity).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @property
    def total_savings(self) -> Decimal:
        """Total savings (sales + coupons) for the entire quantity."""
        savings_per_unit = self.sale_discount + self.coupon_discount
        return (savings_per_unit * self.quantity).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @property
    def net_subtotal(self) -> Decimal:
        """Total net subtotal for this item (unit_price * quantity)."""
        return (self.unit_price * self.quantity).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @property
    def is_on_sale(self) -> bool:
        return self.sale_discount > Decimal("0.00")

    @property
    def has_coupon(self) -> bool:
        return self.coupon_discount > Decimal("0.00")

    def clone(self) -> "ShoppingItem":
        """Creates a duplicated copy with a fresh ID."""
        return ShoppingItem(
            id=str(uuid.uuid4()),
            name=f"{self.name} (Copy)",
            category=self.category,
            department=self.department,
            quantity=self.quantity,
            regular_price=self.regular_price,
            sale_discount=self.sale_discount,
            coupon_discount=self.coupon_discount,
            is_taxable=self.is_taxable,
            is_favorite=self.is_favorite,
            barcode=self.barcode,
            notes=self.notes,
            sort_order=self.sort_order + 1,
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "department": self.department,
            "quantity": str(self.quantity),
            "regular_price": str(self.regular_price),
            "sale_discount": str(self.sale_discount),
            "coupon_discount": str(self.coupon_discount),
            "unit_price": str(self.unit_price),
            "net_subtotal": str(self.net_subtotal),
            "total_savings": str(self.total_savings),
            "is_taxable": self.is_taxable,
            "is_favorite": self.is_favorite,
            "barcode": self.barcode,
            "notes": self.notes,
            "sort_order": self.sort_order,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ShoppingItem":
        return cls(
            id=str(data.get("id", uuid.uuid4())),
            name=str(data.get("name", "Item")),
            category=str(data.get("category", "General")),
            department=str(data.get("department", "Grocery")),
            quantity=Decimal(str(data.get("quantity", "1"))),
            regular_price=Decimal(str(data.get("regular_price", "0.00"))),
            sale_discount=Decimal(str(data.get("sale_discount", "0.00"))),
            coupon_discount=Decimal(str(data.get("coupon_discount", "0.00"))),
            is_taxable=bool(data.get("is_taxable", True)),
            is_favorite=bool(data.get("is_favorite", False)),
            barcode=str(data.get("barcode", "")),
            notes=str(data.get("notes", "")),
            sort_order=int(data.get("sort_order", 0)),
        )
