import { CalculateCheckoutProps, CartItemInput, CheckoutSummary, LineItemSummary, RulesJson } from "./types";
import rules from "./rules.json";

const typedRules = rules as RulesJson;

// Packs
function applyBulkBeans(item: CartItemInput): { discount: number; ruleId: string } | null {
    const rule = typedRules.item_discounts.find((r) => r.id === "BULK_BEANS_5_PLUS");
    if (!rule) return null;
    const { category, min_qty } = rule.conditions as { category: string; min_qty: number };
    if (!item.categories.some((c) => c.toLowerCase() === category.toLowerCase()) || item.quantity < min_qty) return null;
    const discount = rule.action.value * item.quantity;
    return { discount, ruleId: rule.id };
}

function applySecondMokaPotHalfOff(item: CartItemInput): { discount: number; ruleId: string } | null {
    const rule = typedRules.item_discounts.find((r) => r.id === "SECOND_MOKAPOT_HALF_OFF");
    if (!rule) return null;
    const { category, min_qty } = rule.conditions as { category: string; min_qty: number };
    if (!item.categories.some((c) => c.toLowerCase() === category.toLowerCase()) || item.quantity < min_qty) return null;

    const discount = item.price * (rule.action.value / 100);
    return { discount, ruleId: rule.id };
}

function applyMokaPotBundle(
    item: CartItemInput,
    allItems: CartItemInput[]
): { discount: number; ruleId: string } | null {
    const rule = typedRules.item_discounts.find((r) => r.id === "MOKAPOT_BUNDLE");
    if (!rule) return null;
    const { target_category, required_category } = rule.conditions as {
        target_category: string;
        required_category: string;
    };
    if (!item.categories.some((c) => c.toLowerCase() === target_category.toLowerCase())) return null;
    if (!allItems.some((i) => i.categories.some((category) => category.toLowerCase() === required_category.toLowerCase()))) return null;
    // 15% off the total line price for this moka pot
    const lineTotal = item.price * item.quantity;
    const discount = lineTotal * (rule.action.value / 100);
    return { discount, ruleId: rule.id };
}

// Shipping

function calculateShipping(items: CartItemInput[], subtotalAfterItemDiscounts: number): number {
    const { default_cost, free_threshold, surcharge_categories } = typedRules.shipping;

    // Normalize keys to lowercase for case-insensitive matching
    const surchargeMap = Object.fromEntries(
        Object.entries(surcharge_categories).map(([k, v]) => [k.toLowerCase(), v])
    );
    const espressoItem = items.find((item) => item.categories.some((category) => category.toLowerCase() in surchargeMap));
    const surcharge = espressoItem ? surchargeMap[espressoItem.categories.find((category) => category.toLowerCase() in surchargeMap)!.toLowerCase()] : 0;

    const baseCost = subtotalAfterItemDiscounts >= free_threshold ? 0 : default_cost;
    return baseCost + surcharge;
}

// Coupons
function applyCouponDiscount(
    subtotalAfterItemDiscounts: number,
    couponCode?: string
): { discount: number; ruleId: string } | null {
    if (!couponCode) return null;

    const rule = typedRules.order_discounts.find(
        (r) => r.coupon.toUpperCase() === couponCode.toUpperCase()
    );
    if (!rule) return null;

    if (subtotalAfterItemDiscounts < rule.conditions.min_spend) return null;

    if (rule.action.type === "FIXED") {
        return { discount: rule.action.value, ruleId: rule.id };
    }
    if (rule.action.type === "PERCENT") {
        return {
            discount: parseFloat(
                ((subtotalAfterItemDiscounts * rule.action.value) / 100).toFixed(2)
            ),
            ruleId: rule.id,
        };
    }
    return null;
}

export function calculateSummary(props: CalculateCheckoutProps): CheckoutSummary {
    const { userId, orderId, cartItems, couponCode } = props;

    let subtotalBeforeDiscounts = 0;
    let itemDiscountTotal = 0;
    const lineItems: LineItemSummary[] = [];

    for (const item of cartItems) {
        const lineTotal = item.price * item.quantity;
        subtotalBeforeDiscounts += lineTotal;

        let lineDiscount = 0;
        const appliedRules: string[] = [];

        const bulkBeans = applyBulkBeans(item);
        if (bulkBeans) {
            lineDiscount += bulkBeans.discount;
            appliedRules.push(bulkBeans.ruleId);
        }

        const secondMokaPot = applySecondMokaPotHalfOff(item);
        if (secondMokaPot) {
            lineDiscount += secondMokaPot.discount;
            appliedRules.push(secondMokaPot.ruleId);
        }

        const mokaPotBundle = applyMokaPotBundle(item, cartItems);
        if (mokaPotBundle) {
            lineDiscount += mokaPotBundle.discount;
            appliedRules.push(mokaPotBundle.ruleId);
        }

        itemDiscountTotal += lineDiscount;

        lineItems.push({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            discountApplied: parseFloat(lineDiscount.toFixed(2)),
            subtotal: parseFloat((lineTotal - lineDiscount).toFixed(2)),
            appliedRules,
        });
    }

    const subtotalAfterItemDiscounts = parseFloat(
        (subtotalBeforeDiscounts - itemDiscountTotal).toFixed(2)
    );

    const couponResult = applyCouponDiscount(subtotalAfterItemDiscounts, couponCode);
    const orderDiscountTotal = couponResult?.discount ?? 0;
    const appliedOrderRules = couponResult ? [couponResult.ruleId] : [];

    const subtotalAfterAllDiscounts = parseFloat(
        (subtotalAfterItemDiscounts - orderDiscountTotal).toFixed(2)
    );

    const shippingCost = calculateShipping(cartItems, subtotalAfterItemDiscounts);

    const totalAmount = parseFloat((subtotalAfterAllDiscounts + shippingCost).toFixed(2));

    return {
        userId,
        orderId,
        lineItems,
        subtotalBeforeDiscounts: parseFloat(subtotalBeforeDiscounts.toFixed(2)),
        itemDiscountTotal: parseFloat(itemDiscountTotal.toFixed(2)),
        orderDiscountTotal: parseFloat(orderDiscountTotal.toFixed(2)),
        shippingCost: parseFloat(shippingCost.toFixed(2)),
        totalAmount,
        appliedOrderRules,
        currency: "usd",
    };
}
