"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { FiKey, FiUser } from "react-icons/fi";

interface ProfileClientProps {
  userId: string;
}

export default function ProfileClient({ userId }: ProfileClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePasskey = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const challengeResult = await response.json();
      if (!response.ok) {
        setError(challengeResult.error || "Failed to start passkey registration");
        return;
      }

      const authResult = await startRegistration({
        optionsJSON: challengeResult.options,
      });

      const verifyRes = await fetch("/api/auth/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, cred: authResult }),
      });

      const verifyResult = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(verifyResult.error || "Passkey verification failed");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="gcloud-card p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#e8f0fe] dark:bg-[#669DF6]/20 flex items-center justify-center mb-4">
            <FiUser className="w-8 h-8 text-[#1a73e8] dark:text-[#8ab4f8]" />
          </div>
          <h1 className="text-xl font-medium text-[#202124] dark:text-[#e8eaed]">Your Profile</h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1 font-mono">{userId}</p>
        </div>

        {success ? (
          <div className="text-center py-4">
            <p className="text-[#1e8e3e] dark:text-[#81c995] font-medium">Passkey registered!</p>
            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-2">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-6 text-center">
              Register a passkey to enable secure sign-in for this identity.
            </p>

            {error && (
              <p className="text-sm text-[#d93025] dark:text-[#f28b82] mb-4 text-center">{error}</p>
            )}

            <button
              onClick={handlePasskey}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] text-white dark:text-[#202124] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiKey className="w-4 h-4" />
              {loading ? "Registering..." : "Register Passkey"}
            </button>
          </>
        )}

        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-6 text-center">
          <Link href="/iam" className="text-[#1a73e8] dark:text-[#8ab4f8] hover:underline">
            View all identities
          </Link>
        </p>
      </div>
    </div>
  );
}
