import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { userStore, challengeStore } from "@/app/lib/store";

export async function POST(req: Request) {
  const rpid=process.env.WEBAUTHN_RPID || "localhost";
  const { userId } = await req.json();

  if (!userStore[userId]) {
    return NextResponse.json(
      { error: "user not found" },
      { status: 404 }
    );
  }

  const user = userStore[userId];

  const opts = await generateAuthenticationOptions({
    rpID: rpid,
    allowCredentials: [
      {
        id: user.passkey.id,
        transports: user.passkey.transports,
      },
    ],
  });

  challengeStore[userId] = opts.challenge;

  return NextResponse.json({ options: opts });
}