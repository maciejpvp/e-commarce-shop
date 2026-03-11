/**
 * Builds dynamic DynamoDB UpdateExpression components from a partial object.
 * Returns the UpdateExpression string, ExpressionAttributeNames, and ExpressionAttributeValues.
 */
export function buildDynamicUpdateExpression(attributes: Record<string, any>, currentVersion: number) {
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === "version") return;
        const attrName = `#${key}`;
        const valName = `:${key}`;
        updateExpressionParts.push(`${attrName} = ${valName}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[valName] = value;
    });

    // Always increment version for tracking changes (Optimistic Locking)
    updateExpressionParts.push("#version = if_not_exists(#version, :zero) + :inc");
    expressionAttributeNames["#version"] = "version";
    expressionAttributeValues[":inc"] = 1;
    expressionAttributeValues[":zero"] = 0;

    //Conditional write to prevent concurrent updates
    const conditionExpression = `#version = :version`;
    expressionAttributeValues[":version"] = currentVersion;

    const updateExpression = `SET ${updateExpressionParts.join(", ")}`;

    return {
        updateExpression,
        expressionAttributeNames,
        expressionAttributeValues,
        conditionExpression,
    };
}
