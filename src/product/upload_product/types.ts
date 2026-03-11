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
    stock: number;
    categories: string[];
    media: MediaType[];
}


