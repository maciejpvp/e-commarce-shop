import { calculateSummary } from "./calculateSummary";
import { CalculateCheckoutProps, CartItemInput } from "./types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Category: "beans" — matches BULK_BEANS_5_PLUS rule */
const BEANS_ITEM: CartItemInput = {
    productId: "p1",
    name: "Ethiopian Blend",
    categories: ["beans"],
    price: 15,
    quantity: 1,
};

/** Category: "moka-pot" — matches SECOND_MOKAPOT_HALF_OFF and MOKAPOT_BUNDLE rules */
const MOKA_POT_ITEM: CartItemInput = {
    productId: "p2",
    name: "Classic Moka Pot",
    categories: ["moka-pot"],
    price: 50,
    quantity: 1,
};

/** Category: "espresso-machines" — required for MOKAPOT_BUNDLE and triggers $25 shipping surcharge */
const ESPRESSO_MACHINE_ITEM: CartItemInput = {
    productId: "p3",
    name: "Barista Pro X1",
    categories: ["Espresso Machines"], // must match surcharge_categories key in rules.json
    price: 120,
    quantity: 1,
};

/** Generic item with no special discount rules */
const GENERIC_ITEM: CartItemInput = {
    productId: "p4",
    name: "Coffee Mug",
    categories: ["accessories"],
    price: 12,
    quantity: 1,
};

function makeProps(
    cartItems: CartItemInput[],
    overrides: Partial<CalculateCheckoutProps> = {}
): CalculateCheckoutProps {
    return {
        userId: "user-123",
        orderId: "order-abc",
        cartItems,
        ...overrides,
    };
}

// ─── Shipping rules ───────────────────────────────────────────────────────────

describe("Shipping", () => {
    it("charges $12 flat when subtotal < $75 and no espresso machine", () => {
        const result = calculateSummary(makeProps([{ ...BEANS_ITEM, price: 10, quantity: 2 }]));
        expect(result.shippingCost).toBe(12);
        expect(result.totalAmount).toBe(10 * 2 + 12);
    });

    it("ships free when subtotal >= $75", () => {
        const result = calculateSummary(makeProps([{ ...BEANS_ITEM, price: 80, quantity: 1 }]));
        expect(result.shippingCost).toBe(0);
    });

    it("adds $25 surcharge when cart contains an Espresso Machine (below free threshold)", () => {
        // $40 machine — below $75 threshold so base $12 + $25 surcharge = $37
        const result = calculateSummary(makeProps([{ ...ESPRESSO_MACHINE_ITEM, price: 40, quantity: 1 }]));
        expect(result.shippingCost).toBe(12 + 25);
    });

    it("charges only the $25 surcharge (no base) when Espresso Machine subtotal >= $75", () => {
        // $120 machine — above $75 threshold so base = $0, but surcharge $25
        const result = calculateSummary(makeProps([ESPRESSO_MACHINE_ITEM]));
        expect(result.shippingCost).toBe(25);
    });
});

// ─── Item discount: BULK_BEANS_5_PLUS ─────────────────────────────────────────

describe("Item discount: BULK_BEANS_5_PLUS", () => {
    it("does NOT apply when qty < 5", () => {
        const item = { ...BEANS_ITEM, quantity: 4 };
        const result = calculateSummary(makeProps([item]));
        expect(result.lineItems[0].appliedRules).not.toContain("BULK_BEANS_5_PLUS");
        expect(result.itemDiscountTotal).toBe(0);
    });

    it("applies $2 off per unit when qty >= 5 and category is 'beans'", () => {
        const item = { ...BEANS_ITEM, quantity: 5, price: 15 };
        const result = calculateSummary(makeProps([item]));
        const line = result.lineItems[0];
        expect(line.appliedRules).toContain("BULK_BEANS_5_PLUS");
        expect(line.discountApplied).toBe(10); // 5 * $2
        expect(line.subtotal).toBe(15 * 5 - 10); // $65
    });

    it("does NOT apply to other categories", () => {
        const item = { ...GENERIC_ITEM, quantity: 5 };
        const result = calculateSummary(makeProps([item]));
        expect(result.lineItems[0].appliedRules).not.toContain("BULK_BEANS_5_PLUS");
    });
});

// ─── Item discount: SECOND_MOKAPOT_HALF_OFF ───────────────────────────────────

describe("Item discount: SECOND_MOKAPOT_HALF_OFF", () => {
    it("does NOT apply when qty < 2", () => {
        const item = { ...MOKA_POT_ITEM, quantity: 1 };
        const result = calculateSummary(makeProps([item]));
        expect(result.lineItems[0].appliedRules).not.toContain("SECOND_MOKAPOT_HALF_OFF");
    });

    it("applies 50% off the 2nd unit when category is 'moka-pot' and qty >= 2", () => {
        const item = { ...MOKA_POT_ITEM, quantity: 2, price: 30 };
        const result = calculateSummary(makeProps([item]));
        const line = result.lineItems[0];
        expect(line.appliedRules).toContain("SECOND_MOKAPOT_HALF_OFF");
        expect(line.discountApplied).toBe(15); // 50% of $30
        expect(line.subtotal).toBe(30 * 2 - 15); // $45
    });

    it("does NOT apply to 'beans' category items", () => {
        const item = { ...BEANS_ITEM, quantity: 2 };
        const result = calculateSummary(makeProps([item]));
        expect(result.lineItems[0].appliedRules).not.toContain("SECOND_MOKAPOT_HALF_OFF");
    });
});

// ─── Item discount: MOKAPOT_BUNDLE ────────────────────────────────────────────

describe("Item discount: MOKAPOT_BUNDLE", () => {
    it("applies 15% off Moka Pot when Espresso Machine is in cart", () => {
        const mokaPot = { ...MOKA_POT_ITEM, price: 80, quantity: 1 };
        // ESPRESSO_MACHINE_ITEM has category "Espresso Machines" — must match required_category "espresso-machines"
        const espresso = { ...ESPRESSO_MACHINE_ITEM, categories: ["espresso-machines"] };
        const result = calculateSummary(makeProps([mokaPot, espresso]));
        const mokaPotLine = result.lineItems.find((l) => l.productId === "p2")!;
        expect(mokaPotLine.appliedRules).toContain("MOKAPOT_BUNDLE");
        expect(mokaPotLine.discountApplied).toBe(12); // 15% of $80
        expect(mokaPotLine.subtotal).toBe(68); // $80 - $12
    });

    it("does NOT apply when no Espresso Machine is in cart", () => {
        const result = calculateSummary(makeProps([MOKA_POT_ITEM]));
        expect(result.lineItems[0].appliedRules).not.toContain("MOKAPOT_BUNDLE");
        expect(result.lineItems[0].discountApplied).toBe(0);
    });

    it("does NOT apply MOKAPOT_BUNDLE discount to non moka-pot items", () => {
        const espresso = { ...ESPRESSO_MACHINE_ITEM, categories: ["espresso-machines"] };
        const result = calculateSummary(makeProps([BEANS_ITEM, espresso]));
        const beansLine = result.lineItems.find((l) => l.productId === "p1")!;
        expect(beansLine.appliedRules).not.toContain("MOKAPOT_BUNDLE");
    });
});

// ─── Order discount: Coupons ──────────────────────────────────────────────────

describe("Order discount: FRESHSTART coupon", () => {
    it("applies $20 off when coupon is FRESHSTART and spend >= $150", () => {
        // 2x $80 generic item = $160, no item discounts
        const result = calculateSummary(
            makeProps([{ ...GENERIC_ITEM, price: 80, quantity: 2 }], { couponCode: "FRESHSTART" })
        );
        expect(result.appliedOrderRules).toContain("BARISTA_START");
        expect(result.orderDiscountTotal).toBe(20);
        // subtotal $160, shipping free (>= $75), minus $20 coupon = $140
        expect(result.totalAmount).toBe(140);
    });

    it("does NOT apply FRESHSTART when spend < $150", () => {
        const result = calculateSummary(
            makeProps([{ ...BEANS_ITEM, price: 14, quantity: 5 }], { couponCode: "FRESHSTART" })
        );
        // $70 subtotal -> $60 after bulk discount ($10) -> below $150 threshold
        expect(result.appliedOrderRules).not.toContain("BARISTA_START");
        expect(result.orderDiscountTotal).toBe(0);
    });
});

describe("Order discount: WELCOME10 coupon", () => {
    it("applies 10% off when coupon is WELCOME10 and spend >= $50", () => {
        const result = calculateSummary(
            makeProps([{ ...BEANS_ITEM, price: 60, quantity: 1 }], { couponCode: "WELCOME10" })
        );
        expect(result.appliedOrderRules).toContain("FIRST_ORDER_10");
        expect(result.orderDiscountTotal).toBe(6); // 10% of $60
    });

    it("does NOT apply WELCOME10 when spend < $50", () => {
        const result = calculateSummary(
            makeProps([{ ...BEANS_ITEM, price: 30, quantity: 1 }], { couponCode: "WELCOME10" })
        );
        expect(result.appliedOrderRules).not.toContain("FIRST_ORDER_10");
    });

    it("coupon code matching is case-insensitive", () => {
        const result = calculateSummary(
            makeProps([{ ...BEANS_ITEM, price: 60, quantity: 1 }], { couponCode: "welcome10" })
        );
        expect(result.appliedOrderRules).toContain("FIRST_ORDER_10");
    });
});

describe("Invalid/missing coupon", () => {
    it("ignores an unknown coupon code", () => {
        const result = calculateSummary(
            makeProps([{ ...BEANS_ITEM, price: 60, quantity: 1 }], { couponCode: "FAKECODE" })
        );
        expect(result.orderDiscountTotal).toBe(0);
        expect(result.appliedOrderRules).toHaveLength(0);
    });

    it("applies no coupon when couponCode is undefined", () => {
        const result = calculateSummary(makeProps([{ ...BEANS_ITEM, price: 60, quantity: 1 }]));
        expect(result.orderDiscountTotal).toBe(0);
    });
});

// ─── Combined scenarios ───────────────────────────────────────────────────────

describe("Combined rules", () => {
    it("bulk beans + WELCOME10 coupon stack correctly", () => {
        // 5x beans at $15 = $75, bulk discount $10 → $65 after item discounts
        // WELCOME10 (>= $50): 10% of $65 = $6.5
        // Shipping: $65 < $75 → $12
        const result = calculateSummary(
            makeProps([{ ...BEANS_ITEM, price: 15, quantity: 5 }], { couponCode: "WELCOME10" })
        );
        expect(result.itemDiscountTotal).toBe(10);
        expect(result.orderDiscountTotal).toBe(6.5);
        expect(result.shippingCost).toBe(12);
        expect(result.totalAmount).toBe(75 - 10 - 6.5 + 12);
    });

    it("Moka Pot + Espresso Machine: MOKAPOT_BUNDLE 15% off + $25 shipping surcharge", () => {
        // mokaPot matches MOKAPOT_BUNDLE target_category "moka-pot"
        // espressoBundle: category "espresso-machines" satisfies MOKAPOT_BUNDLE required_category
        // espressoShipping: category "Espresso Machines" satisfies the shipping surcharge key
        const mokaPot       = { ...MOKA_POT_ITEM,        price: 80,  quantity: 1 };
        const espressoBundle  = { ...ESPRESSO_MACHINE_ITEM, productId: "p3a", categories: ["espresso-machines"], price: 0, quantity: 1 };
        const espressoShipping = { ...ESPRESSO_MACHINE_ITEM, productId: "p3b", categories: ["Espresso Machines"],  price: 120, quantity: 1 };
        // Subtotals: $80 + $0 + $120 = $200
        // MOKAPOT_BUNDLE: 15% off $80 = $12 discount → mokaPot line $68
        // Shipping: espressoShipping category matched → surcharge $25, base free ($188 >= $75)
        const result = calculateSummary(makeProps([mokaPot, espressoBundle, espressoShipping]));
        expect(result.itemDiscountTotal).toBe(12);
        expect(result.shippingCost).toBe(25);
        expect(result.totalAmount).toBe(80 + 0 + 120 - 12 + 25);
    });

    it("totals reflect correct math: subtotalBeforeDiscounts - discounts + shipping = totalAmount", () => {
        const result = calculateSummary(
            makeProps(
                [
                    { ...MOKA_POT_ITEM, quantity: 2, price: 30 },
                    { ...MOKA_POT_ITEM, productId: "p5", categories: ["espresso-machines"], price: 80 },
                ],
                { couponCode: "WELCOME10" }
            )
        );
        const expected =
            result.subtotalBeforeDiscounts -
            result.itemDiscountTotal -
            result.orderDiscountTotal +
            result.shippingCost;
        expect(result.totalAmount).toBeCloseTo(expected, 2);
    });
});

// ─── Output structure ─────────────────────────────────────────────────────────

describe("Output structure", () => {
    it("returns correct userId and orderId", () => {
        const result = calculateSummary(makeProps([BEANS_ITEM]));
        expect(result.userId).toBe("user-123");
        expect(result.orderId).toBe("order-abc");
        expect(result.currency).toBe("usd");
    });

    it("includes one lineItem per cart item", () => {
        const result = calculateSummary(makeProps([BEANS_ITEM, MOKA_POT_ITEM]));
        expect(result.lineItems).toHaveLength(2);
    });

    it("lineItem has correct shape", () => {
        const result = calculateSummary(makeProps([BEANS_ITEM]));
        const line = result.lineItems[0];
        expect(line).toMatchObject({
            productId: "p1",
            name: "Ethiopian Blend",
            quantity: 1,
            unitPrice: 15,
            discountApplied: 0,
            subtotal: 15,
            appliedRules: [],
        });
    });
});
