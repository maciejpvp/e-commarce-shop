/**
 * DynamoDB Single-Table Design Types: E-Commerce
 */

export type ISO8601 = string;
export type UnixTimestamp = number;

export enum OrderStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
}

export enum DiscountType {
    PERCENT = "PERCENT",
    FLAT = "FLAT",
}

// --- Base Interface ---
interface BaseItem {
    version?: number;
    created_at?: ISO8601;
    updated_at?: ISO8601;
    gsi1pk?: string;
    gsi1sk?: string;
    gsi2pk?: string;
    gsi2sk?: string;
}

// --- 1. User Related ---

export interface UserProfile extends BaseItem {
    PK: `USER#${string}`;
    SK: "PROFILE";
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
}

export interface EmailClaim {
    PK: `EMAIL#${string}`;
    SK: `EMAIL#${string}`;
}

export interface UserAddress extends BaseItem {
    PK: `USER#${string}`;
    SK: `ADDRESS#${string}`;
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    is_default: boolean;
}

export interface UserCart extends BaseItem {
    PK: `USER#${string}`;
    SK: `CART#${string}`;
    quantity: number;
    price_at_add: number;
    ttl: UnixTimestamp;
}

// --- 2. Order Related ---

export interface OrderSummary extends BaseItem {
    PK: `USER#${string}`;
    SK: `ORDER#${string}`;
    status: OrderStatus;
    orderId: string;
    sessionId: string;
    sessionUrl: string;
    token: string;
    total_amount: number;
    currency: string;
    shipping_address: string; // Address ID
}

export interface OrderItem extends BaseItem {
    PK: `ORDER#${string}`;
    SK: `ITEM#${string}`;
    product_name: string;
    quantity: number;
    price_at_purchase: number;
    gsi1pk: string;
    gsi1sk: string;
}

// --- 3. Product Related ---

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

export interface ProductCategory extends BaseItem {
    PK: `PRODUCT#${string}`;
    SK: `CATEGORY#${string}`;
}

export interface ProductComment extends BaseItem {
    PK: `PRODUCT#${string}`;
    SK: `COMMENT#${ISO8601}#${string}`;
    content: string;
    rating: number; // 1-10
    user_name: string;
}

// --- 4. Promotion Related ---

export interface Coupon extends BaseItem {
    PK: `COUPON#${string}`;
    SK: "METADATA";
    discount_type: DiscountType;
    value: number;
    expiry_date: ISO8601;
    is_active: boolean;
}

// --- 5. Global Table Type ---

export type DynamoDBItem =
    | UserProfile
    | EmailClaim
    | UserAddress
    | UserCart
    | OrderSummary
    | OrderItem
    | Product
    | ProductCategory
    | ProductComment
    | Coupon;