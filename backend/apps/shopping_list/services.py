"""Business logic for the shopping list."""

from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Q

from apps.ingredients.models import Ingredient

from .models import ShoppingListItem


def _normalize(name: str) -> str:
    return (name or "").strip().lower()


def _to_decimal(quantity) -> Decimal:
    if isinstance(quantity, Decimal):
        return quantity
    try:
        return Decimal(str(quantity))
    except InvalidOperation:
        return Decimal(0)


def merge_item(user, *, ingredient=None, name=None, quantity, unit):
    """Add or merge a single shopping-list item.

    Merge rule: same ingredient (matched case-insensitively by name OR by
    ingredient FK) AND the same unit AND the existing line is not completed
    ->  quantities are summed into the open line. Anything else (different
    unit, completed line, or no match) creates a fresh line. Spec §9.
    """
    quantities = quantity if isinstance(quantity, (list, tuple)) else [quantity]
    if ingredient is not None:
        display_name = ingredient.name
    else:
        display_name = (name or "").strip() or "Item"
        ingredient = Ingredient.objects.filter(name__iexact=display_name).first()

    created_lines = []
    for qty in quantities:
        item = _merge_single(
            user,
            ingredient=ingredient,
            name=display_name,
            quantity=_to_decimal(qty),
            unit=unit,
        )
        created_lines.append(item)
    return created_lines


def _merge_single(user, *, ingredient, name, quantity, unit):
    target = _normalize(name)
    match = Q(name__iexact=target)
    if ingredient is not None:
        match |= Q(ingredient_id=ingredient.id)

    with transaction.atomic():
        existing = (
            ShoppingListItem.objects.select_for_update()
            .filter(user=user, is_completed=False, unit=unit)
            .filter(match)
            .order_by("id")
            .first()
        )
        if existing:
            existing.quantity = existing.quantity + quantity
            existing.save(update_fields=["quantity", "updated_at"])
            existing._merged_into_id = existing.pk
            return existing
        created = ShoppingListItem.objects.create(
            user=user,
            ingredient=ingredient,
            name=name,
            quantity=quantity,
            unit=unit,
        )
        created.merge_created = True
        return created