"use client";

import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";

interface ProfileClientProps {
  userId: string;
}

export default function ProfileClient({ userId }: ProfileClientProps) {
  const router = useRouter();

  const backendUrl =
    process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:3001";

  const handlePasskey = async () => {
    try {
      console.log(`userId: ${userId}`);

      const response = await fetch(
        `${backendUrl}/api/auth/register-challenge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      const challengeResult = await response.json();
      const { options } = challengeResult;

      const authResult = await startRegistration({
        optionsJSON: options,
      });

      await fetch(`${backendUrl}/api/auth/register-verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          cred: authResult,
        }),
      });

      router.push("/login");
    } catch (error) {
      console.error("Something went wrong:", error);
    }
  };

  return (
    <div>
      <h1>Profile</h1>

      <button onClick={handlePasskey}>
        Register Passkey
      </button>
    </div>
  );
}