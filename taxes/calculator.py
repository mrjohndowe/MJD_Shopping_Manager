"""
MJD Shopping Manager - Sales Tax Calculator
Itemized breakdown for State, County, City, and Special Districts.
Uses Python Decimal for exact precision.
"""
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Optional


@dataclass
class TaxBreakdown:
    state_tax_rate: Decimal
    county_tax_rate: Decimal
    city_tax_rate: Decimal
    special_tax_rate: Decimal
    
    state_tax_amount: Decimal
    county_tax_amount: Decimal
    city_tax_amount: Decimal
    special_tax_amount: Decimal
    
    taxable_subtotal: Decimal
    non_taxable_subtotal: Decimal
    total_tax: Decimal

    @property
    def total_rate(self) -> Decimal:
        return self.state_tax_rate + self.county_tax_rate + self.city_tax_rate + self.special_tax_rate

    def get_visible_taxes(self) -> Dict[str, Dict[str, Decimal]]:
        """Returns only taxes that are active and have an amount > 0 or rate > 0."""
        visible = {}
        if self.state_tax_rate > Decimal("0") or self.state_tax_amount > Decimal("0"):
            visible["Colorado State Tax"] = {
                "rate": self.state_tax_rate,
                "amount": self.state_tax_amount,
                "percentage_str": f"{self.state_tax_rate * Decimal('100'):.2f}%"
            }
        if self.county_tax_rate > Decimal("0") or self.county_tax_amount > Decimal("0"):
            visible["Pueblo County Tax"] = {
                "rate": self.county_tax_rate,
                "amount": self.county_tax_amount,
                "percentage_str": f"{self.county_tax_rate * Decimal('100'):.2f}%"
            }
        if self.city_tax_rate > Decimal("0") or self.city_tax_amount > Decimal("0"):
            visible["City Tax"] = {
                "rate": self.city_tax_rate,
                "amount": self.city_tax_amount,
                "percentage_str": f"{self.city_tax_rate * Decimal('100'):.2f}%"
            }
        if self.special_tax_rate > Decimal("0") or self.special_tax_amount > Decimal("0"):
            visible["Special District Tax"] = {
                "rate": self.special_tax_rate,
                "amount": self.special_tax_amount,
                "percentage_str": f"{self.special_tax_rate * Decimal('100'):.2f}%"
            }
        return visible


class TaxCalculator:
    """
    Precision Sales Tax Calculator for MJD Shopping Manager.
    Configurable by store and jurisdiction.
    """

    def __init__(
        self,
        state_rate: Decimal = Decimal("0.0290"),   # Colorado: 2.90%
        county_rate: Decimal = Decimal("0.0100"),  # Pueblo County: 1.00%
        city_rate: Decimal = Decimal("0.0370"),    # City of Pueblo: 3.70%
        special_rate: Decimal = Decimal("0.0000"), # Special district: 0.00%
    ):
        self.state_rate = Decimal(str(state_rate))
        self.county_rate = Decimal(str(county_rate))
        self.city_rate = Decimal(str(city_rate))
        self.special_rate = Decimal(str(special_rate))

    @staticmethod
    def quantize_money(amount: Decimal) -> Decimal:
        """Rounds to 2 decimal places using standard ROUND_HALF_UP."""
        return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def set_rates(
        self,
        state_rate: Optional[Decimal] = None,
        county_rate: Optional[Decimal] = None,
        city_rate: Optional[Decimal] = None,
        special_rate: Optional[Decimal] = None,
    ) -> None:
        if state_rate is not None:
            self.state_rate = Decimal(str(state_rate))
        if county_rate is not None:
            self.county_rate = Decimal(str(county_rate))
        if city_rate is not None:
            self.city_rate = Decimal(str(city_rate))
        if special_rate is not None:
            self.special_rate = Decimal(str(special_rate))

    def calculate_for_amount(self, taxable_amount: Decimal, non_taxable_amount: Decimal = Decimal("0.00")) -> TaxBreakdown:
        """Calculates precise itemized taxes for given taxable & non-taxable amounts."""
        taxable = Decimal(str(taxable_amount))
        non_taxable = Decimal(str(non_taxable_amount))

        state_tax = self.quantize_money(taxable * self.state_rate)
        county_tax = self.quantize_money(taxable * self.county_rate)
        city_tax = self.quantize_money(taxable * self.city_rate)
        special_tax = self.quantize_money(taxable * self.special_rate)

        total_tax = state_tax + county_tax + city_tax + special_tax

        return TaxBreakdown(
            state_tax_rate=self.state_rate,
            county_tax_rate=self.county_rate,
            city_tax_rate=self.city_rate,
            special_tax_rate=self.special_rate,
            state_tax_amount=state_tax,
            county_tax_amount=county_tax,
            city_tax_amount=city_tax,
            special_tax_amount=special_tax,
            taxable_subtotal=self.quantize_money(taxable),
            non_taxable_subtotal=self.quantize_money(non_taxable),
            total_tax=total_tax,
        )

    def calculate_item_tax(self, net_price: Decimal, is_taxable: bool) -> Decimal:
        """Calculates total tax for a single item."""
        if not is_taxable:
            return Decimal("0.00")
        combined_rate = self.state_rate + self.county_rate + self.city_rate + self.special_rate
        return self.quantize_money(net_price * combined_rate)
