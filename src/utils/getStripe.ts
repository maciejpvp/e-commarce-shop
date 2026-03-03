import Stripe from 'stripe';
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssmClient = new SSMClient({});
let stripeInstance: Stripe | null = null;

export const getStripe = async (): Promise<Stripe> => {
    if (stripeInstance) return stripeInstance;

    const command = new GetParameterCommand({
        Name: "/e-commerce-store/dev/stripe-secret-key",
        WithDecryption: true,
    });

    const { Parameter } = await ssmClient.send(command);

    if (!Parameter?.Value) {
        throw new Error("Missing Stripe Secret Key in SSM Parameter Store");
    }

    stripeInstance = new Stripe(Parameter.Value);
    return stripeInstance;
};
