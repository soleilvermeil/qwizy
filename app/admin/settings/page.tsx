"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";

export default function AdminSettingsPage() {
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(true);
  const [allowTeacherRegistration, setAllowTeacherRegistration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setAllowSelfRegistration(data.settings.allowSelfRegistration);
        setAllowTeacherRegistration(data.settings.allowTeacherRegistration ?? false);
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowSelfRegistration, allowTeacherRegistration }),
      });

      if (!response.ok) throw new Error("Failed to save settings");
      setSuccessMessage("Settings saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
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
        <h1 className="text-2xl font-bold text-foreground">Website Settings</h1>
        <p className="text-muted">Configure global application settings</p>
      </div>

      {successMessage && (
        <div className="p-3 rounded-lg bg-success/10 text-success text-sm">{successMessage}</div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-error/10 text-error text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registration</CardTitle>
          <CardDescription>
            Control whether new users can register accounts on their own
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowSelfRegistration}
              onChange={(e) => setAllowSelfRegistration(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="font-medium text-foreground">Allow self-registration</p>
              <p className="text-sm text-muted">
                When disabled, only administrators can create personal user accounts.
                The registration page will show a message telling users to contact their administrator.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowTeacherRegistration}
              onChange={(e) => setAllowTeacherRegistration(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="font-medium text-foreground">Allow teacher registration</p>
              <p className="text-sm text-muted">
                When enabled, users can register as teachers from the registration page.
                Teachers can create and manage their own students, groups, and education-only decks.
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      <Button onClick={handleSave} isLoading={isSaving}>
        Save Settings
      </Button>
    </div>
  );
}
