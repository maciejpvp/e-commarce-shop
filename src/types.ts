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