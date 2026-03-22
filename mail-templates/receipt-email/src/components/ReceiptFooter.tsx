import React from "react";

export const ReceiptFooter: React.FC = () => {
  return (
    <div style={{ textAlign: "center", padding: "48px 56px", backgroundColor: "#171818" }}>
      {/* ── Brand closure ── */}
      <div
        style={{
          fontFamily: "'Georgia', 'Noto Serif', serif",
          fontSize: "18px",
          color: "#fbf9f5",
          marginBottom: "16px",
          letterSpacing: "0.5px",
        }}
      >
        Brew &amp; Bean
      </div>

      {/* ── Support & Copyright — Manrope labeling scale ── */}
      <p
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: "10px",
          fontWeight: "700",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: "rgba(251,249,245,0.4)",
          margin: "0 0 12px",
          lineHeight: "1.6",
        }}
      >
        Questions? Contact us at:{" "}
        <a
          href="mailto:support@brewandbean.com"
          style={{ 
            color: "#775a19", 
            textDecoration: "none",
            borderBottom: "1px solid rgba(119, 90, 25, 0.4)" 
          }}
        >
          support@brewandbean.net
        </a>
      </p>

      <p
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: "9px",
          fontWeight: "700",
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          color: "rgba(251,249,245,0.25)",
          margin: 0,
        }}
      >
        © {new Date().getFullYear()} — Fine Coffee &amp; Equipment
      </p>
    </div>
  );
};
