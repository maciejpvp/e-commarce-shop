// These types mirror CheckoutSummary / LineItemSummary from the backend.
// They are duplicated here to keep the mail-template package self-contained.

export interface LineItemSummary {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountApplied: number;
  subtotal: number;
  appliedRules: string[];
  media?: any[];
}

export interface CheckoutSummary {
  userId: string;
  orderId: string;
  lineItems: LineItemSummary[];
  subtotalBeforeDiscounts: number;
  itemDiscountTotal: number;
  orderDiscountTotal: number;
  shippingCost: number;
  totalAmount: number;
  appliedOrderRules: string[];
  currency: string;
}

export interface ReceiptTemplateProps {
  summary: CheckoutSummary;
  date: string;
}
