"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@/components/ui";

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/decks");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Choose a username"
        required
        minLength={3}
        autoComplete="username"
        autoFocus
        helperText="At least 3 characters, letters, numbers, _ and - only"
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Choose a password"
        required
        minLength={6}
        autoComplete="new-password"
        helperText="At least 6 characters"
      />

      <Input
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm your password"
        required
        autoComplete="new-password"
      />

      {error && (
        <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
      >
        Create Account
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary hover:text-primary-hover font-medium"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
