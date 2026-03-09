import React from "react";
import ReceiptTemplate from "./ReceiptTemplate";
import { ReceiptItem } from "./types";

export default function App() {
  const sampleItems: ReceiptItem[] = [
    {
      quantity: 2,
      details: {
        PK: "PRODUCT#COFFEE_BEANS_01",
        SK: "METADATA",
        name: "Dark Roast Coffee Beans",
        description: "2x 12oz Bag - Notes of dark chocolate and molasses.",
        price: 18.0,
        stock: 45,
        media: [
          {
            type: "image",
            key: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=200&auto=format&fit=crop",
            isMain: true,
          },
        ],
      },
    },
    {
      quantity: 1,
      details: {
        PK: "PRODUCT#EQUIP_AEROPRESS_01",
        SK: "METADATA",
        name: "AeroPress Coffee Maker",
        description: "Includes 350 filters and zippered nylon tote bag.",
        price: 39.95,
        stock: 10,
        media: [
          {
            type: "image",
            key: "https://aeropress.com/cdn/shop/files/AP_OG_PDP_BTF_5_Mobile_567x.png?v=1757099532",
            isMain: true,
          },
        ],
      },
    },
  ];
  return (
    <div
      className="App"
      style={{
        backgroundColor: "#f9f9f9",
        padding: "20px",
        minHeight: "100vh",
      }}
    >
      <ReceiptTemplate
        items={sampleItems}
        orderNumber="ORD-55291"
        date="Oct 25, 2023"
      />
    </div>
  );
}
