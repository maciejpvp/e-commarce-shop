import React from "react";
import { formatCurrency } from "../utils/formatters";

interface ReceiptTotalsProps {
  subtotalBeforeDiscounts: number;
  itemDiscountTotal: number;
  orderDiscountTotal: number;
  shippingCost: number;
  totalAmount: number;
  currency: string;
  appliedOrderRules: string[];
}

const Row: React.FC<{
  label: React.ReactNode;
  value: string;
  isTotal?: boolean;
  isDiscount?: boolean;
}> = ({ label, value, isTotal = false, isDiscount = false }) => (
  <tr>
    <td
      style={{
        padding: isTotal ? "24px 0 0" : "8px 0",
        fontFamily: "'Manrope', sans-serif",
        fontSize: isTotal ? "14px" : "13px",
        fontWeight: isTotal ? "700" : "400",
        color: isTotal ? "#171818" : "rgba(23,24,24,0.6)",
        textTransform: isTotal ? "uppercase" : "none",
        letterSpacing: isTotal ? "1px" : "0",
      }}
    >
      {label}
    </td>
    <td
      style={{
        textAlign: "right",
        padding: isTotal ? "24px 0 0" : "8px 0",
        fontFamily: isTotal ? "'Georgia', 'Noto Serif', serif" : "'Manrope', sans-serif",
        fontSize: isTotal ? "28px" : "14px",
        fontWeight: isTotal ? "400" : "600",
        color: isDiscount ? "#775a19" : "#171818",
      }}
    >
      {value}
    </td>
  </tr>
);

export const ReceiptTotals: React.FC<ReceiptTotalsProps> = ({
  subtotalBeforeDiscounts,
  itemDiscountTotal,
  orderDiscountTotal,
  shippingCost,
  totalAmount,
  currency,
  appliedOrderRules,
}) => {
  const hasItemDiscount = itemDiscountTotal > 0;
  const hasOrderDiscount = orderDiscountTotal > 0;
  const isFreeShipping = shippingCost === 0;

  return (
    <table width="100%" cellPadding="0" cellSpacing="0">
      <tbody>
        <tr>
          {/* Left spacer for editorial offset */}
          <td width="40%" />
          <td width="60%">
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tbody>
                {/* Summary Eyebrow */}
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: "9px",
                      fontWeight: "700",
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      color: "#775a19",
                      paddingBottom: "20px",
                    }}
                  >
                    Statement Summary
                  </td>
                </tr>

                <Row
                  label="Subtotal"
                  value={formatCurrency(subtotalBeforeDiscounts, currency)}
                />

                {hasItemDiscount && (
                  <Row
                    label={
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        Item Savings
                        <span
                          style={{
                            fontSize: "8px",
                            fontWeight: "800",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                            backgroundColor: "rgba(119, 90, 25, 0.1)",
                            color: "#775a19",
                            padding: "2px 6px",
                            flex: 1,  
                            alignItems: "center",     
                            justifyContent: "center",  
                          }}
                        >
                          Applied
                        </span>
                      </span>
                    }
                    value={`−${formatCurrency(itemDiscountTotal, currency)}`}
                    isDiscount
                  />
                )}

                {hasOrderDiscount && (
                  <Row
                    label={
                      <span>
                        Order Discount
                        {appliedOrderRules.length > 0 && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "9px",
                              fontWeight: "700",
                              color: "rgba(119, 90, 25, 0.6)",
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
                            ({appliedOrderRules[0]})
                          </span>
                        )}
                      </span>
                    }
                    value={`−${formatCurrency(orderDiscountTotal, currency)}`}
                    isDiscount
                  />
                )}

                <Row
                  label="Shipping & Handling"
                  value={isFreeShipping ? "Free" : formatCurrency(shippingCost, currency)}
                />

                {/* The "No-Line" Total Break — achieved through extreme padding and type scale */}
                <Row
                  label="Amount Due"
                  value={formatCurrency(totalAmount, currency)}
                  isTotal
                />
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
