import React from "react";

interface ReceiptHeaderProps {
  orderId: string;
  date: string;
  currency: string;
}

export const ReceiptHeader: React.FC<ReceiptHeaderProps> = ({
  orderId,
  date,
  currency,
}) => {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0">
      <tbody>
        <tr>
          {/* ── Brand wordmark ── */}
          <td style={{ verticalAlign: "bottom" }}>
            {/* Eyebrow label */}
            <div
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "#775a19",
                marginBottom: "10px",
              }}
            >
              Order Receipt
            </div>
            {/* Serif headline */}
            <div
              style={{
                fontFamily: "'Georgia', 'Noto Serif', serif",
                fontSize: "36px",
                fontWeight: "400",
                letterSpacing: "-0.5px",
                lineHeight: "1",
                color: "#fbf9f5",
              }}
            >
              Brew &amp; Bean
            </div>
            {/* Tagline */}
            <div
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "12px",
                color: "rgba(251,249,245,0.45)",
                marginTop: "8px",
                letterSpacing: "0.5px",
              }}
            >
              Artisanal Coffee &amp; Equipment
            </div>
          </td>

          {/* ── Order metadata ── */}
          <td style={{ textAlign: "right", verticalAlign: "bottom" }}>
            {/* Order number */}
            <div
              style={{
                fontFamily: "'Georgia', 'Noto Serif', serif",
                fontSize: "15px",
                color: "#fbf9f5",
                letterSpacing: "0.5px",
                marginBottom: "6px",
              }}
            >
              #{orderId}
            </div>

            {/* Date */}
            <div
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "12px",
                color: "rgba(251,249,245,0.45)",
                letterSpacing: "0.3px",
              }}
            >
              {date}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
