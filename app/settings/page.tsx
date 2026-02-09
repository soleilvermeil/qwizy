"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  newCardsPerDay: number;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [newCardsPerDay, setNewCardsPerDay] = useState("10");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCards, setIsSavingCards] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) throw new Error("Failed to fetch user");
        const data = await response.json();
        setUser(data.user);
        setNewCardsPerDay(data.user.newCardsPerDay.toString());
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSaveCardsPerDay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const value = parseInt(newCardsPerDay);
    if (isNaN(value) || value < 1 || value > 100) {
      setError("New cards per day must be between 1 and 100");
      return;
    }

    setIsSavingCards(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newCardsPerDay: value }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update settings");
      }

      setSuccessMessage("Settings saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSavingCards(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }

      setSuccessMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted">Manage your account and preferences</p>
      </div>

      {successMessage && (
        <div className="p-3 rounded-lg bg-success/10 text-success text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-muted">Username</span>
              <span className="font-medium text-foreground">{user?.username}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted">Account Type</span>
              <span className="font-medium text-foreground">
                {user?.isAdmin ? "Administrator" : "User"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Settings - only for non-admin users */}
      {!user?.isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Learning</CardTitle>
            <CardDescription>Configure your learning preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCardsPerDay} className="space-y-4">
              <Input
                label="New cards per day"
                type="number"
                min="1"
                max="100"
                value={newCardsPerDay}
                onChange={(e) => setNewCardsPerDay(e.target.value)}
                helperText="How many new cards to learn each day (1-100)"
              />
              <Button type="submit" isLoading={isSavingCards}>
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TODO: Account Data Export (GDPR Art. 15 & 20 - Right of access & data portability)
          Add a card here that allows users to download all their personal data
          (account info + learning progress) as a JSON or CSV file.
          This requires a new API endpoint: GET /api/user/data-export */}

      {/* TODO: Account Deletion (GDPR Art. 17 - Right to erasure)
          Add a card here that allows users to permanently delete their account
          and all associated data (user record + all UserProgress entries).
          Should require password confirmation before deletion.
          This requires a new API endpoint: DELETE /api/user/account */}

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
              helperText="At least 6 characters"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
            <Button type="submit" isLoading={isSavingPassword}>
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
