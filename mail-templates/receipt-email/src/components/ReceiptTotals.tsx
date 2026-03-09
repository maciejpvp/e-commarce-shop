import React from "react";
import { formatCurrency } from "../utils/formatters";

interface ReceiptTotalsProps {
  subtotal: number;
  tax: number;
  total: number;
}

export const ReceiptTotals: React.FC<ReceiptTotalsProps> = ({
  subtotal,
  tax,
  total,
}) => {
  return (
    <table width="100%" style={{ marginTop: "20px" }}>
      <tbody>
        <tr>
          <td width="60%"></td>
          <td width="40%">
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "5px 0",
                      color: "#777",
                      fontSize: "14px",
                    }}
                  >
                    Subtotal
                  </td>
                  <td style={{ textAlign: "right", fontSize: "14px" }}>
                    {formatCurrency(subtotal)}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "5px 0",
                      color: "#777",
                      fontSize: "14px",
                    }}
                  >
                    Tax (7%)
                  </td>
                  <td style={{ textAlign: "right", fontSize: "14px" }}>
                    {formatCurrency(tax)}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "15px 0 0 0",
                      fontWeight: "bold",
                      fontSize: "18px",
                      borderTop: "2px solid #4a3728",
                      marginTop: "10px",
                    }}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                      fontSize: "18px",
                      borderTop: "2px solid #4a3728",
                      paddingTop: "15px",
                    }}
                  >
                    {formatCurrency(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
