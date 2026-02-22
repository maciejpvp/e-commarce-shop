export type PresignedPost = {
    uploadUrl: string;
    fields: string;
    key: string;
    type: "image/" | "video/";
    isMain: boolean;
}

export type ProductMetadata = {
    PK: string;
    SK: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    media: PresignedPost[];
    created_at: number;
    version: number;
}

export type ProductCategory = {
    PK: string;
    SK: string;
    gsi1pk: string;
    gsi1sk: string;
}

