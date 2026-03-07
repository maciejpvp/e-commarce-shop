import { SESClient, SendEmailCommand, SendEmailCommandInput } from "@aws-sdk/client-ses";

const REGION = "eu-central-1";
const sesClient = new SESClient({ region: REGION });

export const sendEmail = async (recipient: string, htmlBody: string): Promise<void> => {
    const params: SendEmailCommandInput = {
        Destination: {
            ToAddresses: [recipient],
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: htmlBody,
                },
                Text: {
                    Charset: "UTF-8",
                    Data: "Proszę użyć czytnika obsługującego HTML.",
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Wiadomość z domeny zahut.me",
            },
        },
        Source: "noreply@zahut.me",
    };

    try {
        const command = new SendEmailCommand(params);
        const response = await sesClient.send(command);
        console.log("Email wysłany pomyślnie, ID:", response.MessageId);
    } catch (error) {
        console.error("Błąd podczas wysyłki maila:", error);
        throw error;
    }
}