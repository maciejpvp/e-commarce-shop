import React from "react";
import { ReceiptItem } from "../types";
import { formatCurrency } from "../utils/formatters";

interface ReceiptItemsProps {
  items: ReceiptItem[];
}

export const ReceiptItems: React.FC<ReceiptItemsProps> = ({ items }) => {
  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{ marginTop: "20px" }}
    >
      <thead>
        <tr style={{ textAlign: "left" }}>
          <th
            style={{
              padding: "10px 0",
              fontSize: "11px",
              textTransform: "uppercase",
              color: "#999",
              borderBottom: "1px solid #eeeeee",
            }}
          >
            Item
          </th>
          <th
            style={{
              padding: "10px 0",
              fontSize: "11px",
              textTransform: "uppercase",
              color: "#999",
              borderBottom: "1px solid #eeeeee",
              textAlign: "center",
            }}
          >
            Qty
          </th>
          <th
            style={{
              padding: "10px 0",
              fontSize: "11px",
              textTransform: "uppercase",
              color: "#999",
              borderBottom: "1px solid #eeeeee",
              textAlign: "right",
            }}
          >
            Price
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const mainImage = item.details.media.find((m) => m.isMain)?.key;
          return (
            <tr key={item.details.PK}>
              <td
                style={{ padding: "15px 0", borderBottom: "1px solid #f9f9f9" }}
              >
                <table cellPadding="0" cellSpacing="0" border={0}>
                  <tbody>
                    <tr>
                      {mainImage && (
                        <td
                          style={{ paddingRight: "15px", verticalAlign: "top" }}
                        >
                          <img
                            src={mainImage}
                            alt={item.details.name}
                            width="50"
                            height="50"
                            style={{
                              display: "block",
                              borderRadius: "4px",
                              objectFit: "cover",
                              border: "1px solid #eeeeee",
                            }}
                          />
                        </td>
                      )}
                      <td style={{ verticalAlign: "top" }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "15px",
                            color: "#333",
                          }}
                        >
                          {item.details.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#777",
                            marginTop: "2px",
                            lineHeight: "1.4",
                          }}
                        >
                          {item.details.description}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td
                style={{
                  textAlign: "center",
                  borderBottom: "1px solid #f9f9f9",
                  verticalAlign: "middle",
                  fontSize: "14px",
                }}
              >
                {item.quantity}
              </td>
              <td
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #f9f9f9",
                  verticalAlign: "middle",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                {formatCurrency(item.details.price * item.quantity)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
