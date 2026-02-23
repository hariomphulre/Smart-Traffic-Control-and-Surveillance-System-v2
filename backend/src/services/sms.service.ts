import twilio from "twilio";

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);

export const sendAccidentAlert = async (
    hospitalNumber: string,
    location: string
) => {
    try {
        const message = await client.messages.create({
            body: `🚨 ACCIDENT ALERT 🚨
    Location: ${location}`,
            from: process.env.TWILIO_PHONE_NUMBER!,
            to: hospitalNumber,
        });

        console.log("SMS Sent:", message.sid);
    } catch (error) {
        console.error("SMS Error:", error);
    }
};