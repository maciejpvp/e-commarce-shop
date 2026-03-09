export interface BaseItem {
  PK: string;
  SK: string;
}

export interface Product extends BaseItem {
  PK: `PRODUCT#${string}`;
  SK: "METADATA";
  name: string;
  description: string;
  price: number;
  stock: number;
  media: Array<{
    type: string;
    key: string;
    isMain: boolean;
  }>;
}

export interface ReceiptItem {
  details: Product;
  quantity: number;
}

export interface ReceiptTemplateProps {
  items: ReceiptItem[];
  orderNumber: string;
  date: string;
}
