import React from "react";

interface ReceiptHeaderProps {
  orderNumber: string;
  date: string;
}

export const ReceiptHeader: React.FC<ReceiptHeaderProps> = ({
  orderNumber,
  date,
}) => {
  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{ borderBottom: "2px solid #f6f6f6", paddingBottom: "20px" }}
    >
      <tbody>
        <tr>
          <td>
            <h1 style={{ margin: 0, color: "#4a3728", fontSize: "24px" }}>
              Brew & Bean
            </h1>
            <p style={{ fontSize: "14px", color: "#888", margin: "5px 0 0 0" }}>
              Your Order Receipt
            </p>
          </td>
          <td style={{ textAlign: "right", verticalAlign: "top" }}>
            <p style={{ fontWeight: "bold", margin: 0, fontSize: "14px" }}>
              Order #{orderNumber}
            </p>
            <p style={{ fontSize: "13px", margin: 0, color: "#888" }}>{date}</p>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
