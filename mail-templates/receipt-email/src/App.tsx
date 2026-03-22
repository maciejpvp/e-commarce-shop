import React from "react";
import ReceiptTemplate from "./ReceiptTemplate";
import { CheckoutSummary } from "./types";

const sampleSummary: CheckoutSummary = {
  userId: "b39428d2-3061-707c-508a-fd75e9c11d91",
  orderId: "25cc070d-8251-4904-8b2b-9e20b893cffd",
  lineItems: [
    {
      productId: "95fb5902-c0e9-4060-a1b4-ff1b894b1835",
      name: "MokaPot Bialetti",
      quantity: 2,
      unitPrice: 50,
      discountApplied: 25,
      subtotal: 75,
      appliedRules: ["SECOND_MOKAPOT_HALF_OFF"],
      media: [
        {
          type: "image",
          key: "https://images.unsplash.com/photo-1544193159-079c42a41a4a?q=80&w=200&auto=format&fit=crop",
          isMain: true,
        },
      ],
    },
    {
      productId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      name: "Ethiopian Single Origin Beans",
      quantity: 1,
      unitPrice: 22.50,
      discountApplied: 0,
      subtotal: 22.50,
      appliedRules: [],
      media: [
        {
          type: "image",
          key: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=200&auto=format&fit=crop",
          isMain: true,
        },
      ],
    },
  ],
  subtotalBeforeDiscounts: 122.50,
  itemDiscountTotal: 25,
  orderDiscountTotal: 0,
  shippingCost: 0,
  totalAmount: 97.50,
  appliedOrderRules: [],
  currency: "usd",
};

export default function App() {
  return (
    <div
      style={{
        backgroundColor: "#171818", // Dark background for contrast in the preview
        padding: "60px 20px",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: "660px", width: "100%" }}>
        <ReceiptTemplate
          summary={sampleSummary}
          date="March 22, 2026"
        />
      </div>
    </div>
  );
}
