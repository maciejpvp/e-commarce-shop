export type MediaType = {
    type: "image/" | "video/";
    id: string;
    isMain: boolean;
}

export type PresignedPostResponse = {
    uploadUrl: string;
    fields: string;
    key: string;
    type: "image/" | "video/";
    isMain: boolean;
}

export type UploadProductEvent = {
    name: string;
    price: number;
    description: string;
    tech_spec: string;
    attributes: string;
    stock: number;
    categories: string[];
    media: MediaType[];
}

export interface ResponseProduct {
    id: string;
    name: string;
    subtitle?: string;
    description: string;
    price: number;
    stock: number;
    media: { type: string; key: string; isMain: boolean }[];
    categories: { name: string, slug: string }[];
    tech_spec: { label: string, value: string }[];
    attributes: {
        roastLevel?: string;
        roastPercent?: number;
        profile?: string;
        weight?: string;
    };
    version: number;
}
