import twilio from 'twilio';

let client: ReturnType<typeof twilio> | null = null;

function getTwilioClient(): ReturnType<typeof twilio> | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    return null;
  }
  if (!client) {
    client = twilio(accountSid, authToken);
  }
  return client;
}

export const sendAccidentAlert = async (
  hospitalNumber: string,
  location: string
): Promise<void> => {
  const twilioClient = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioClient || !fromNumber) {
    console.warn('⚠️ Twilio not configured — skipping SMS alert');
    return;
  }

  try {
    const message = await twilioClient.messages.create({
      body: `🚨 ACCIDENT ALERT 🚨
    Location: ${location}`,
      from: fromNumber,
      to: hospitalNumber,
    });

    console.log('SMS Sent:', message.sid);
  } catch (error) {
    console.error('SMS Error:', error);
  }
};
