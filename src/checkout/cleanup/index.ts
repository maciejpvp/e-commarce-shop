import { getOrderItems, deleteOrderSummary, batchDeleteOrderItems } from '../../services/order';

interface StepFunctionErrorEvent {
    Error: string;
    Cause: string;
}

interface CleanupPayload {
    cleanupData: {
        PK: string;
        SK: string;
        orderId: string;
    };
}

export const handler = async (event: StepFunctionErrorEvent): Promise<void> => {
    try {
        const cleanupData = parseErrorMetadata(event);

        if (!cleanupData) {
            console.warn("No cleanup data found in event cause. Skipping.");
            return;
        }

        const { PK, SK, orderId } = cleanupData;

        await deleteOrderSummary(PK, SK);

        const orderItems = await getOrderItems(orderId);

        if (orderItems.length > 0) {
            await batchDeleteOrderItems(orderItems);
        }

        console.log(`Cleanup successful for Order: ${orderId}`);
    } catch (error) {
        console.error("Cleanup failed. Throwing to Step Function for retry:", error);
        throw error;
    }
};

const parseErrorMetadata = (event: StepFunctionErrorEvent) => {
    try {
        const sfnCause = JSON.parse(event.Cause);
        const payload: CleanupPayload =
            typeof sfnCause.errorMessage === 'string'
                ? JSON.parse(sfnCause.errorMessage)
                : sfnCause.errorMessage;

        return payload?.cleanupData || null;
    } catch (e) {
        console.error("Failed to parse Step Function metadata", e);
        return null;
    }
};