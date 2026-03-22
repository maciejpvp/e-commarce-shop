import React from "react";
import { LineItemSummary } from "../types";
import { formatCurrency } from "../utils/formatters";

interface ReceiptItemsProps {
  items: LineItemSummary[];
  currency: string;
}

export const ReceiptItems: React.FC<ReceiptItemsProps> = ({ items, currency }) => {
  return (
    <div>
      {/* ── Section eyebrow ── */}
      <div
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: "9px",
          fontWeight: "700",
          letterSpacing: "3px",
          textTransform: "uppercase",
          color: "#775a19",
          marginBottom: "32px",
        }}
      >
        Items Ordered
      </div>

      <table width="100%" cellPadding="0" cellSpacing="0">
        {/* ── Column headers ── */}
        <thead>
          <tr>
            <th
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "9px",
                fontWeight: "700",
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "rgba(23,24,24,0.4)",
                textAlign: "left",
                paddingBottom: "14px",
              }}
            >
              Product
            </th>
            <th
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "9px",
                fontWeight: "700",
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "rgba(23,24,24,0.4)",
                textAlign: "center",
                paddingBottom: "14px",
                width: "56px",
              }}
            >
              Qty
            </th>
            <th
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "9px",
                fontWeight: "700",
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "rgba(23,24,24,0.4)",
                textAlign: "right",
                paddingBottom: "14px",
                width: "88px",
              }}
            >
              Unit
            </th>
            <th
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "9px",
                fontWeight: "700",
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "rgba(23,24,24,0.4)",
                textAlign: "right",
                paddingBottom: "14px",
                width: "88px",
              }}
            >
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            const mainImage = item.media?.find((m: any) => m.isMain)?.key;

            return (
              <tr key={item.productId}>
                {/* Product Image & Name */}
                <td
                  style={{
                    paddingTop: "20px",
                    paddingBottom: "20px",
                    paddingRight: "16px",
                    verticalAlign: "top",
                  }}
                >
                  <table cellPadding="0" cellSpacing="0" border={0}>
                    <tbody>
                      <tr>
                        {mainImage && (
                          <td style={{ paddingRight: "16px", verticalAlign: "top" }}>
                            <img
                              src={mainImage}
                              alt={item.name}
                              width="64"
                              height="64"
                              style={{
                                display: "block",
                                objectFit: "cover",
                                // Obsidian sheen fallback
                                backgroundColor: "#171818",
                                borderRadius: "0px",
                              }}
                            />
                          </td>
                        )}
                        <td style={{ verticalAlign: "top" }}>
                          {/* Name */}
                          <div
                            style={{
                              fontFamily: "'Georgia', 'Noto Serif', serif",
                              fontSize: "15px",
                              fontWeight: "400",
                              color: "#171818",
                              letterSpacing: "0.2px",
                              marginBottom: item.discountApplied > 0 ? "10px" : "0",
                            }}
                          >
                            {item.name}
                          </div>

                          {/* Discount detail row */}
                          {item.discountApplied > 0 && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              {/* Savings chip */}
                              <span
                                style={{
                                  display: "inline-block",
                                  backgroundColor: "#171818",
                                  color: "#fbf9f5",
                                  fontFamily: "'Manrope', sans-serif",
                                  fontSize: "9px",
                                  fontWeight: "700",
                                  letterSpacing: "1.5px",
                                  textTransform: "uppercase",
                                  padding: "3px 8px",
                                }}
                              >
                                −{formatCurrency(item.discountApplied, currency)}
                              </span>

                              {/* Rule ID tags */}
                              {item.appliedRules.map((rule) => (
                                <span
                                  key={rule}
                                  style={{
                                    display: "inline-block",
                                    color: "#775a19",
                                    fontFamily: "'Manrope', sans-serif",
                                    fontSize: "9px",
                                    fontWeight: "700",
                                    letterSpacing: "1.5px",
                                    textTransform: "uppercase",
                                    // Ghost border at ~15% opacity
                                    outline: "1px solid rgba(119,90,25,0.25)",
                                    padding: "3px 8px",
                                  }}
                                >
                                  {rule}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>

                {/* Quantity */}
                <td
                  style={{
                    textAlign: "center",
                    verticalAlign: "top",
                    paddingTop: "20px",
                    paddingBottom: "20px",
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "rgba(23,24,24,0.6)",
                  }}
                >
                  {item.quantity}
                </td>

                {/* Unit price */}
                <td
                  style={{
                    textAlign: "right",
                    verticalAlign: "top",
                    paddingTop: "20px",
                    paddingBottom: "20px",
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: "14px",
                    color: "rgba(23,24,24,0.55)",
                  }}
                >
                  {formatCurrency(item.unitPrice, currency)}
                </td>

                {/* Line subtotal */}
                <td
                  style={{
                    textAlign: "right",
                    verticalAlign: "top",
                    paddingTop: "20px",
                    paddingBottom: "20px",
                    fontFamily: "'Georgia', 'Noto Serif', serif",
                    fontSize: "15px",
                    color: item.discountApplied > 0 ? "#775a19" : "#171818",
                    fontWeight: "400",
                  }}
                >
                  {formatCurrency(item.subtotal, currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
