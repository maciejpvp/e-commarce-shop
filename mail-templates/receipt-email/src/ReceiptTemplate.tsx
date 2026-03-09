import React from "react";
import type { ReceiptTemplateProps } from "./types";
import { ReceiptHeader } from "./components/ReceiptHeader";
import { ReceiptItems } from "./components/ReceiptItems";
import { ReceiptTotals } from "./components/ReceiptTotals";
import { ReceiptFooter } from "./components/ReceiptFooter";

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  items,
  orderNumber,
  date,
}) => {
  const subtotal = items.reduce(
    (acc, item) => acc + item.details.price * item.quantity,
    0
  );
  const tax = subtotal * 0.07;
  const total = subtotal + tax;

  return (
    <div
      style={{
        fontFamily: "Helvetica, Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
        color: "#333",
        backgroundColor: "#ffffff",
        padding: "40px",
        border: "1px solid #eeeeee",
        borderRadius: "8px",
        textAlign: "left",
      }}
    >
      <ReceiptHeader orderNumber={orderNumber} date={date} />
      <ReceiptItems items={items} />
      <ReceiptTotals subtotal={subtotal} tax={tax} total={total} />
      <ReceiptFooter />
    </div>
  );
};

export default ReceiptTemplate;
