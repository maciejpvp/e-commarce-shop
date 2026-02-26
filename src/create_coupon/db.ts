import { PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../utils/docClient";

const tableName = process.env.TABLE_NAME!;

export const createCoupon = async (coupon: any) => {
    const item = {
        PK: `COUPON${coupon.code}`,
        SK: `METADATA`,
        discount_type: coupon.discountType,
        value: coupon.discountValue,
        expiry_date: coupon.expiryDate,
        is_active: coupon.isActive,
        created_at: Date.now(),
        version: 1,
        gsi1pk: `COUPON_STATUS#${coupon.isActive ? "ACTIVE" : "INACTIVE"}`,
        gsi1sk: `EXPIRY#${coupon.expiryDate}#${coupon.code}`,
    }

    const commandInput: PutCommandInput = {
        TableName: tableName,
        Item: item,
    };
    const command = new PutCommand(commandInput);
    await docClient.send(command);
}