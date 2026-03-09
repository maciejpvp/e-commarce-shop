import React from "react";

export const ReceiptFooter: React.FC = () => {
  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "40px",
        borderTop: "1px solid #eeeeee",
        paddingTop: "20px",
      }}
    >
      <p style={{ fontSize: "12px", color: "#aaa", margin: 0 }}>
        If you have any questions, please contact support@brewandbean.com
      </p>
    </div>
  );
};
