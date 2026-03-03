export type ProductMetadata = {
    PK: string;
    SK: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    media: { type: "image/" | "video/"; key: string; isMain: boolean }[];
    created_at: number;
    version: number;
}

export type ProductCategory = {
    PK: string;
    SK: string;
    gsi1pk: string;
    gsi1sk: string;
}

export type Media = {
    type: string;
    key: string;
    isMain: boolean;
};

export type CartItem = {
    productId: string;
    quantity: number;
    name: string;
    description: string;
    price: number;
    price_at_add: number;
    stock: number;
    media: Media[];
    created_at: number;
    updated_at: number;
    version: number;
    PK: string;
    SK: string;
};
