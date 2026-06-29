import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { userStore, challengeStore } from "@/app/lib/store";

export async function POST(req: Request) {
  const rpid=process.env.WEBAUTHN_RPID || "localhost";
  const rpname=process.env.WEBAUTHN_RPNAME || "My localhost machine";

  const { userId } = await req.json();

  const user = userStore[userId];

  if (!user)
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );

  const options = await generateRegistrationOptions({
    rpID: rpid,
    rpName: rpname,
    userName: user.username,
  });

  challengeStore[userId] = options.challenge;

  return NextResponse.json({ options });
}