import { NextResponse } from "next/server";
import { userStore } from "@/app/lib/store";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const id = `user_${Date.now()}`;

  userStore[id] = {
    id,
    username,
    password,
  };

  return NextResponse.json({ id });
}