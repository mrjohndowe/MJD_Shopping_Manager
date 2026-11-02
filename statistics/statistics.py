"""
MJD Shopping Manager - Statistics Manager
Computes comprehensive spending analytics, store rankings, and item frequencies.
"""
from collections import Counter
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List
from history.history import CompletedTrip, HistoryManager


class StatisticsManager:
    """Aggregates and analyzes shopping data across past trips."""

    def __init__(self, history_manager: HistoryManager):
        self.history_manager = history_manager

    def calculate_statistics(self) -> Dict[str, Any]:
        trips: List[CompletedTrip] = self.history_manager.trips
        total_trips = len(trips)

        if total_trips == 0:
            return {
                "trips": 0,
                "money_spent": "0.00",
                "average_trip": "0.00",
                "largest_trip": "0.00",
                "smallest_trip": "0.00",
                "favorite_store": "N/A",
                "most_purchased_item": "N/A",
                "items_purchased": 0,
                "taxes_paid": "0.00",
                "money_saved": "0.00",
                "coupons_used": 0,
                "average_item_price": "0.00",
                "category_breakdown": {},
                "store_distribution": {},
            }

        money_spent = sum((t.grand_total for t in trips), Decimal("0.00"))
        taxes_paid = sum((t.total_tax for t in trips), Decimal("0.00"))
        money_saved = sum((t.money_saved for t in trips), Decimal("0.00"))
        items_purchased = sum(t.items_count for t in trips)
        coupons_used = sum(t.coupons_count for t in trips)

        trip_totals = [t.grand_total for t in trips]
        largest_trip = max(trip_totals)
        smallest_trip = min(trip_totals)
        average_trip = (money_spent / Decimal(str(total_trips))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        average_item_price = Decimal("0.00")
        if items_purchased > 0:
            average_item_price = (money_spent / Decimal(str(items_purchased))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Store frequency
        store_counts = Counter(t.store_name for t in trips)
        favorite_store = store_counts.most_common(1)[0][0] if store_counts else "N/A"

        # Item frequency & Category spending
        item_counts: Counter = Counter()
        category_spending: Dict[str, Decimal] = {}

        for t in trips:
            for it in t.items:
                name = it.get("name", "Unknown")
                qty = Decimal(str(it.get("quantity", "1")))
                item_counts[name] += int(qty)

                cat = it.get("category", "General")
                net_subtotal = Decimal(str(it.get("net_subtotal", "0.00")))
                category_spending[cat] = category_spending.get(cat, Decimal("0.00")) + net_subtotal

        most_purchased_item = item_counts.most_common(1)[0][0] if item_counts else "N/A"

        return {
            "trips": total_trips,
            "money_spent": str(money_spent.quantize(Decimal("0.01"))),
            "average_trip": str(average_trip),
            "largest_trip": str(largest_trip.quantize(Decimal("0.01"))),
            "smallest_trip": str(smallest_trip.quantize(Decimal("0.01"))),
            "favorite_store": favorite_store,
            "most_purchased_item": most_purchased_item,
            "items_purchased": items_purchased,
            "taxes_paid": str(taxes_paid.quantize(Decimal("0.01"))),
            "money_saved": str(money_saved.quantize(Decimal("0.01"))),
            "coupons_used": coupons_used,
            "average_item_price": str(average_item_price),
            "category_breakdown": {k: str(v.quantize(Decimal("0.01"))) for k, v in category_spending.items()},
            "store_distribution": dict(store_counts),
        }
