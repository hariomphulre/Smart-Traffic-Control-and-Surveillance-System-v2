import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { userStore, challengeStore } from "@/app/lib/store";

export async function POST(req: Request) {
  const origin=process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";
  const rpid=process.env.WEBAUTHN_RPID || "localhost";

  const { userId, cred } = await req.json();

  if (!userStore[userId]) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const user = userStore[userId];
  const challenge = challengeStore[userId];

  const result = await verifyAuthenticationResponse({
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpid,
    response: cred,
    credential: user.passkey,
  });

  if (!result.verified) {
    return NextResponse.json({
      error: "Not authenticated successfully!",
    });
  }

  // TODO: Create session/JWT here

  return NextResponse.json({
    success: true,
    userId,
  });
}