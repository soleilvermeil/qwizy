"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Checkbox } from "@/components/ui";

interface RegisterFormProps {
  accountType?: string;
}

export function RegisterForm({ accountType = "PERSONAL" }: RegisterFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!acceptedLegal) {
      setError("You must accept the Privacy Policy and Legal Notice to register");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, confirmPassword, acceptedLegal, accountType }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push(accountType === "TEACHER" ? "/admin/decks" : "/decks");
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
        helperText="At least 3 characters"
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
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword((v) => !v)}
      />

      <Input
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm your password"
        required
        autoComplete="new-password"
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword((v) => !v)}
      />

      <Checkbox
        checked={acceptedLegal}
        onChange={setAcceptedLegal}
      >
        I have read and accept the{" "}
        <Link
          href="/privacy-policy"
          target="_blank"
          className="text-primary hover:text-primary-hover font-medium"
        >
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link
          href="/legal-notice"
          target="_blank"
          className="text-primary hover:text-primary-hover font-medium"
        >
          Legal Notice
        </Link>
      </Checkbox>

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
