import { getCartItems } from "cart-db";
import { getProductItem, getProductCategories } from "product-db";
import { UserAddress, UserCart, Product } from "../../dynamoDbTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EnrichedCartItem = {
    // Cart fields
    PK: UserCart["PK"];
    cartSK: UserCart["SK"];
    quantity: number;
    price_at_add: number;
    // Product fields
    productId: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    media: Product["media"];
    // Enrichment
    categories: string[];
};

// ─── Step 1: Fetch cart ───────────────────────────────────────────────────────

const getCart = async (userId: string): Promise<UserCart[]> => {
    const items = await getCartItems(userId);
    return items ?? [];
};

// ─── Step 2: Fetch full product info for each cart item ───────────────────────

const getProductInfoForCart = async (
    cartItems: UserCart[]
): Promise<Map<string, Product>> => {
    const productIds = cartItems.map((item) => item.SK.split("#")[1]);
    const products = await getProductItem(productIds);

    return new Map(products.filter(Boolean).map((p) => [p.PK, p]));
};

// ─── Step 3: Fetch categories for each product ───────────────────────────────

const getCategoriesForProducts = async (
    productIds: string[]
): Promise<Map<string, string[]>> => {
    const entries = await Promise.all(
        productIds.map(async (id) => {
            const categories = await getProductCategories(id);
            return [id, categories] as [string, string[]];
        })
    );

    return new Map(entries);
};

// ─── Step 4: Enrich cart items with product data (skip missing products) ───────

const enrichCartItems = (
    cartItems: UserCart[],
    productMap: Map<string, Product>
): EnrichedCartItem[] => {
    const enriched: EnrichedCartItem[] = [];

    for (const item of cartItems) {
        const productId = item.SK.split("#")[1];
        const product = productMap.get(`PRODUCT#${productId}`);

        if (!product) {
            console.warn(`Product ${productId} not found — skipping cart item`);
            continue;
        }

        enriched.push({
            PK: item.PK,
            cartSK: item.SK,
            quantity: item.quantity,
            price_at_add: item.price_at_add,
            productId,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            media: product.media,
            categories: [],
        });
    }

    return enriched;
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async ({
    userId,
    orderId,
    address,
    couponCode
}: {
    userId: string;
    orderId: string;
    address: UserAddress;
    couponCode?: string;
}) => {
    console.log(`UserID: ${userId}, OrderId: ${orderId}`);

    try {
        // 1. Get cart
        const cartItems = await getCart(userId);

        if (cartItems.length === 0) {
            return {
                statusCode: 404,
                body: { message: "Cart is empty" },
            };
        }

        // 2. Fetch product details
        const productMap = await getProductInfoForCart(cartItems);

        // 3. Enrich items — skip any with no product record
        const validItems = enrichCartItems(cartItems, productMap);

        if (validItems.length === 0) {
            return {
                statusCode: 400,
                body: { message: "No valid cart items found" },
            };
        }

        // 4. Fetch categories for valid products
        const validProductIds = validItems.map((item) => item.productId);
        const categoriesMap = await getCategoriesForProducts(validProductIds);

        const enrichedCartItems: EnrichedCartItem[] = validItems.map((item) => ({
            ...item,
            categories: categoriesMap.get(item.productId) ?? [],
        }));

        return {
            statusCode: 200,
            body: {
                userId,
                orderId,
                address,
                couponCode,
                cartItems: enrichedCartItems,
            },
        };
    } catch (error) {
        console.error("@@@@ ERROR: ", error);
        return {
            statusCode: 500,
            body: { message: "Internal server error" },
        };
    }
};