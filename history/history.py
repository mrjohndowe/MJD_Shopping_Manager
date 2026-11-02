"""
MJD Shopping Manager - History Manager
Records, searches, and manages completed shopping trips.
"""
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any, Optional
from config.constants import SQLITE_DB_PATH
from shopping.cart import ShoppingCart
from storage.storage import StorageManager


@dataclass
class CompletedTrip:
    id: int
    list_name: str
    store_name: str
    store_address: str
    budget: Decimal
    subtotal: Decimal
    state_tax: Decimal
    county_tax: Decimal
    city_tax: Decimal
    total_tax: Decimal
    grand_total: Decimal
    money_saved: Decimal
    remaining_budget: Decimal
    items_count: int
    coupons_count: int
    items: List[Dict[str, Any]] = field(default_factory=list)
    notes: str = ""
    completed_at: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "list_name": self.list_name,
            "store_name": self.store_name,
            "store_address": self.store_address,
            "budget": str(self.budget),
            "subtotal": str(self.subtotal),
            "state_tax": str(self.state_tax),
            "county_tax": str(self.county_tax),
            "city_tax": str(self.city_tax),
            "total_tax": str(self.total_tax),
            "grand_total": str(self.grand_total),
            "money_saved": str(self.money_saved),
            "remaining_budget": str(self.remaining_budget),
            "items_count": self.items_count,
            "coupons_count": self.coupons_count,
            "items": self.items,
            "notes": self.notes,
            "completed_at": self.completed_at,
        }


class HistoryManager:
    """Manages past shopping trip logs and persistence."""

    def __init__(self, storage: Optional[StorageManager] = None):
        self.storage = storage or StorageManager(SQLITE_DB_PATH)
        self.trips: List[CompletedTrip] = []
        self.load_from_storage()

    def load_from_storage(self) -> None:
        raw_trips = self.storage.get_trips_sqlite()
        self.trips = []
        for r in raw_trips:
            trip = CompletedTrip(
                id=int(r["id"]),
                list_name=str(r.get("list_name", "Shopping Trip")),
                store_name=str(r.get("store_name", "Store")),
                store_address=str(r.get("store_address", "")),
                budget=Decimal(str(r.get("budget", "0.00"))),
                subtotal=Decimal(str(r.get("subtotal", "0.00"))),
                state_tax=Decimal(str(r.get("state_tax", "0.00"))),
                county_tax=Decimal(str(r.get("county_tax", "0.00"))),
                city_tax=Decimal(str(r.get("city_tax", "0.00"))),
                total_tax=Decimal(str(r.get("total_tax", "0.00"))),
                grand_total=Decimal(str(r.get("grand_total", "0.00"))),
                money_saved=Decimal(str(r.get("money_saved", "0.00"))),
                remaining_budget=Decimal(str(r.get("remaining_budget", "0.00"))),
                items_count=int(r.get("items_count", 0)),
                coupons_count=int(r.get("coupons_count", 0)),
                items=r.get("items", []),
                notes=str(r.get("notes", "")),
                completed_at=str(r.get("completed_at", "")),
            )
            self.trips.append(trip)

    def record_trip(self, cart: ShoppingCart, notes: str = "") -> CompletedTrip:
        trip_dict = {
            "list_name": cart.name,
            "store_name": cart.store_name,
            "store_address": cart.store_address,
            "budget": str(cart.budget),
            "subtotal": str(cart.subtotal),
            "state_tax": str(cart.tax_breakdown.state_tax_amount),
            "county_tax": str(cart.tax_breakdown.county_tax_amount),
            "city_tax": str(cart.tax_breakdown.city_tax_amount),
            "total_tax": str(cart.total_tax),
            "grand_total": str(cart.grand_total),
            "money_saved": str(cart.total_savings),
            "remaining_budget": str(cart.remaining_budget),
            "items_count": int(cart.total_items_count),
            "coupons_count": cart.coupons_count,
            "items": [i.to_dict() for i in cart.items],
            "notes": notes,
        }

        new_id = self.storage.record_trip_sqlite(trip_dict)
        trip = CompletedTrip(
            id=new_id,
            list_name=cart.name,
            store_name=cart.store_name,
            store_address=cart.store_address,
            budget=cart.budget,
            subtotal=cart.subtotal,
            state_tax=cart.tax_breakdown.state_tax_amount,
            county_tax=cart.tax_breakdown.county_tax_amount,
            city_tax=cart.tax_breakdown.city_tax_amount,
            total_tax=cart.total_tax,
            grand_total=cart.grand_total,
            money_saved=cart.total_savings,
            remaining_budget=cart.remaining_budget,
            items_count=int(cart.total_items_count),
            coupons_count=cart.coupons_count,
            items=[i.to_dict() for i in cart.items],
            notes=notes,
            completed_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )
        self.trips.insert(0, trip)
        return trip

    def get_trip_by_id(self, trip_id: int) -> Optional[CompletedTrip]:
        for t in self.trips:
            if t.id == trip_id:
                return t
        return None

    def search(self, query: str) -> List[CompletedTrip]:
        q = query.lower().strip()
        if not q:
            return self.trips
        return [
            t for t in self.trips
            if q in t.list_name.lower() or q in t.store_name.lower() or q in t.notes.lower() or q in t.completed_at
        ]
