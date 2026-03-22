import React from "react";
import type { ReceiptTemplateProps } from "./types";
import { ReceiptHeader } from "./components/ReceiptHeader";
import { ReceiptItems } from "./components/ReceiptItems";
import { ReceiptTotals } from "./components/ReceiptTotals";
import { ReceiptFooter } from "./components/ReceiptFooter";

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Artisanal Editorial Design System
// Primary:       #171818  (Deep Charcoal)
// Secondary:     #775a19  (Soft Gold)
// Surface:       #fbf9f5  (Warm Cream)
// Container-Low: #f3f0e9  (Inset areas)
// On-surface:    #171818
// No rounded corners. No explicit 1px borders. Tonal layering only.
// ─────────────────────────────────────────────────────────────────────────────

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ summary, date }) => {
  return (
    <div
      style={{
        fontFamily: "'Manrope', 'Helvetica Neue', Arial, sans-serif",
        maxWidth: "660px",
        margin: "0 auto",
        backgroundColor: "#fbf9f5",
        // Ghost border fallback (15% opacity outline-variant)
        outline: "1px solid rgba(23,24,24,0.10)",
      }}
    >
      {/* ── Hero Header: primary → primary-container gradient ── */}
      <div
        style={{
          background: "linear-gradient(150deg, #171818 0%, #2c2f2f 55%, #775a19 140%)",
          padding: "48px 56px 44px",
        }}
      >
        <ReceiptHeader orderId={summary.orderId} date={date} currency={summary.currency} />
      </div>

      {/* ── Line Items: surface-container-low inset ── */}
      <div
        style={{
          backgroundColor: "#f3f0e9",
          padding: "48px 56px",
        }}
      >
        <ReceiptItems items={summary.lineItems} currency={summary.currency} />
      </div>

      {/* ── Totals: surface (cream) — tonal break from container-low ── */}
      <div
        style={{
          backgroundColor: "#fbf9f5",
          padding: "40px 56px",
        }}
      >
        <ReceiptTotals
          subtotalBeforeDiscounts={summary.subtotalBeforeDiscounts}
          itemDiscountTotal={summary.itemDiscountTotal}
          orderDiscountTotal={summary.orderDiscountTotal}
          shippingCost={summary.shippingCost}
          totalAmount={summary.totalAmount}
          currency={summary.currency}
          appliedOrderRules={summary.appliedOrderRules}
        />
      </div>

      {/* ── Footer: deep charcoal base ── */}
      <div
        style={{
          backgroundColor: "#171818",
          padding: "36px 56px",
        }}
      >
        <ReceiptFooter />
      </div>
    </div>
  );
};

export default ReceiptTemplate;
