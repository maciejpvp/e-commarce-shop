export const slugify = (text: string): string => {
    if (typeof text !== "string") return "";

    return text
        .normalize("NFD")               // Decompose combined characters (e.g., é -> e + ´)
        .replace(/[\u0300-\u036f]/g, "") // Remove the accent marks
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")    // Remove non-alphanumeric (except spaces/hyphens)
        .replace(/[\s_]+/g, "-")         // Replace spaces and underscores with a single hyphen
        .replace(/-+/g, "-")             // Prevent multiple consecutive hyphens
        .replace(/^-+|-+$/g, "");        // Trim hyphens from start/end
};

export const unslugify = (text: string): string => {
    if (typeof text !== "string") return "";

    return text
        .replace(/-/g, " ")
        .replace(/\s+/g, " ") // Collapse multiple spaces into one
        .trim();
};

export const normalizeName = (text: string): string => {
    if (typeof text !== "string") return "";

    return text
        .normalize("NFKC")           // Compatibility decomposition (handles symbols/variants)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")   // Strictly alphanumeric
        .trim();
};