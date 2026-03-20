import { UserAddress } from "../../dynamoDbTypes";

/**
 * A single enriched cart item as produced by the validateCart step,
 * augmented with product category and SKU needed for discount rule evaluation.
 */
export type CartItemInput = {
    productId: string;
    name: string;
    /** DynamoDB product category (e.g. "Beans", "Grinders", "Espresso Machines") */
    categories: string[];
    /** Optional product SKU for SKU-specific rules (e.g. "SIGNATURE-ROAST-500G") */
    sku?: string;
    /** Unit price in USD dollars (from Product.price) */
    price: number;
    quantity: number;
};

/**
 * Canonical props passed to calculateSummary (pure function).
 * cartItems are always resolved before this is called.
 */
export type CalculateCheckoutProps = {
    userId: string;
    orderId: string;
    cartItems: CartItemInput[];
    /** Shipping address carried through from init_checkout */
    address?: UserAddress;
    /** Optional coupon code */
    couponCode?: string;
};

// ─── Invocation contract types ────────────────────────────────────────────────

/**
 * Event shape when invoked by the Step Function.
 * validateCart already fetched and enriched the cart — no DynamoDB calls needed.
 */
export type StepFunctionEvent = {
    userId: string;
    orderId: string;
    address?: UserAddress;
    couponCode?: string;
    /** Enriched cart items produced by the preceding validateCart step */
    cartItems: CartItemInput[];
};

/**
 * Body parsed from an API Gateway request.
 * The Lambda fetches cart items itself using the authenticated userId.
 */
export type ApiGatewayBody = {
    /** Optional coupon code the user wants to preview */
    couponCode?: string;
};

// ─── Output types ─────────────────────────────────────────────────────────────

export type LineItemSummary = {
    productId: string;
    name: string;
    quantity: number;
    /** Unit price before any discounts */
    unitPrice: number;
    /** Total discount amount applied to this line */
    discountApplied: number;
    /** Final line total after discounts (unitPrice * quantity - discountApplied) */
    subtotal: number;
    /** IDs of rules applied to this line item */
    appliedRules: string[];
};

export type CheckoutSummary = {
    userId: string;
    orderId: string;
    lineItems: LineItemSummary[];
    /** Sum of (unitPrice * quantity) for all lines, before any discounts */
    subtotalBeforeDiscounts: number;
    /** Total saved from item-level discount rules */
    itemDiscountTotal: number;
    /** Total saved from order-level coupon rules */
    orderDiscountTotal: number;
    shippingCost: number;
    /** Final amount: subtotalBeforeDiscounts - itemDiscountTotal - orderDiscountTotal + shippingCost */
    totalAmount: number;
    /** IDs of order-level coupon rules applied */
    appliedOrderRules: string[];
    currency: string;
};

// ─── rules.json shape ─────────────────────────────────────────────────────────

type BulkBeansCondition = { category: string; min_qty: number };
type SecondBagCondition = { sku: string; min_qty: number };
type GrinderBundleCondition = { target_category: string; required_category: string };
type ItemDiscountCondition = BulkBeansCondition | SecondBagCondition | GrinderBundleCondition;

type OrderDiscountCondition = { min_spend: number };

export type RulesJson = {
    shipping: {
        default_cost: number;
        free_threshold: number;
        surcharge_categories: Record<string, number>;
    };
    item_discounts: Array<{
        id: string;
        description: string;
        conditions: ItemDiscountCondition;
        action: { type: string; value: number };
    }>;
    order_discounts: Array<{
        id: string;
        coupon: string;
        conditions: OrderDiscountCondition;
        action: { type: string; value: number };
    }>;
};