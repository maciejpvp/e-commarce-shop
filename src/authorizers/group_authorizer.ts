import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import { CognitoJwtVerifier } from "aws-jwt-verify";

const userPoolId = process.env.USER_POOL_ID!;
const clientId = process.env.CLIENT_ID!;

const verifier = CognitoJwtVerifier.create({
    userPoolId: userPoolId,
    tokenUse: "id",
    clientId: clientId,
});

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
    const token = event.authorizationToken.replace("Bearer ", "");

    try {
        const payload = await verifier.verify(token);
        const groups = (payload["cognito:groups"] as string[]) || [];

        const resourceMap: Record<string, string[]> = JSON.parse(process.env.RESOURCE_GROUP_MAPPING || "{}");

        const methodArn = event.methodArn;
        const arnParts = methodArn.split(':');
        const apiGatewayArnPart = arnParts[5].split('/');
        const method = apiGatewayArnPart[2];
        const resourcePath = "/" + apiGatewayArnPart.slice(3).join('/');

        const resourceKey = `${method}${resourcePath}`;
        const requiredGroups = resourceMap[resourceKey] || [];
        const isAuthorized = requiredGroups.length === 0 || requiredGroups.some(group => groups.includes(group));

        return generatePolicy(payload.sub as string, isAuthorized ? 'Allow' : 'Deny', methodArn, {
            sub: payload.sub as string,
            email: payload.email as string || "",
            groups: JSON.stringify(groups)
        });
    } catch (err) {
        console.error("Token verification failed:", err);
        return generatePolicy('user', 'Deny', event.methodArn);
    }
};

const generatePolicy = (principalId: string, effect: 'Allow' | 'Deny', resource: string, context?: Record<string, string | number | boolean>): APIGatewayAuthorizerResult => {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
        context
    };
};
