"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Modal,
  ModalFooter,
} from "@/components/ui";
import { getTtsEngine, setTtsEngine } from "@/lib/tts";
import { getPiperSupportedLabels } from "@/lib/tts-languages";

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  accountType: string;
  newCardsPerDay: number;
  newCardsPerDayLocked: boolean;
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
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // TTS / Piper state
  const [ttsEngine, setTtsEngineState] = useState<"browser" | "piper">("browser");
  const [cachedVoiceCount, setCachedVoiceCount] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const [piperMayFallback, setPiperMayFallback] = useState(false);

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

  // Sync TTS engine preference and cached voice count from client-side state
  useEffect(() => {
    setTtsEngineState(getTtsEngine());
    setPiperMayFallback(typeof SharedArrayBuffer === "undefined");
    import("@/lib/tts-piper")
      .then(({ getPiperStoredVoices }) => getPiperStoredVoices())
      .then((voices) => setCachedVoiceCount(voices.length))
      .catch(() => setCachedVoiceCount(0));
  }, []);

  const handleSelectEngine = useCallback((engine: "browser" | "piper") => {
    setTtsEngine(engine);
    setTtsEngineState(engine);
  }, []);

  const handleClearPiperCache = useCallback(async () => {
    setIsClearing(true);
    try {
      const { clearPiperVoices } = await import("@/lib/tts-piper");
      await clearPiperVoices();
      setCachedVoiceCount(0);
    } catch {
      // ignore clear errors
    } finally {
      setIsClearing(false);
    }
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

  const handleExportData = async () => {
    setError("");
    setSuccessMessage("");
    setIsExporting(true);

    try {
      const response = await fetch("/api/user/data-export");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to export data");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extract filename from Content-Disposition header or use default
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      a.download = filenameMatch?.[1] ?? "open-duolingo-data-export.json";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMessage("Data exported successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError("");
    setSuccessMessage("");
    setIsDeleting(true);

    try {
      const response = await fetch("/api/user/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // Redirect to home page after account deletion
      window.location.href = "/";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete account"
      );
      setIsDeleting(false);
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
                {user?.isAdmin
                  ? "Administrator"
                  : user?.accountType === "EDUCATION"
                  ? "Education"
                  : "Personal"}
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
            {user?.newCardsPerDayLocked ? (
              <div className="space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-muted">New cards per day</span>
                  <span className="font-medium text-foreground">{user.newCardsPerDay}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <svg className="inline w-4 h-4 mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  This value has been set by your administrator.
                </p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Voice Quality - only for non-admin users */}
      {!user?.isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Voice Quality</CardTitle>
            <CardDescription>
              Choose the text-to-speech engine for pronunciation playback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Engine selection */}
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="tts-engine"
                    value="browser"
                    checked={ttsEngine === "browser"}
                    onChange={() => handleSelectEngine("browser")}
                    className="mt-0.5 accent-[var(--color-primary)]"
                  />
                  <div>
                    <p className="font-medium text-foreground">Browser default</p>
                    <p className="text-sm text-muted">
                      Uses your operating system&apos;s built-in voices. No download required. Supports all languages.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="tts-engine"
                    value="piper"
                    checked={ttsEngine === "piper"}
                    onChange={() => handleSelectEngine("piper")}
                    className="mt-0.5 accent-[var(--color-primary)]"
                  />
                  <div>
                    <p className="font-medium text-foreground">High quality (Piper)</p>
                    <p className="text-sm text-muted">
                      Natural-sounding AI voices downloaded on demand per language (~15-60 MB each). Cached locally for future use.
                    </p>
                  </div>
                </label>
              </div>

              {/* Piper details panel (shown when piper is selected) */}
              {ttsEngine === "piper" && (
                <div className="rounded-lg border border-border p-4 space-y-4">
                  {piperMayFallback && (
                    <div className="rounded-lg bg-error/10 p-3">
                      <p className="text-sm text-foreground">
                        Your browser may not fully support the AI voice engine. If high-quality playback fails, your browser&apos;s built-in voice will be used automatically.
                      </p>
                    </div>
                  )}
                  {/* Cache info & clear button */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Voice models are automatically downloaded the first time you hear a language. They are cached in your browser so subsequent plays are instant.
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearPiperCache}
                        isLoading={isClearing}
                      >
                        Clear cached voices
                      </Button>
                      <span className="text-xs text-muted">
                        {cachedVoiceCount === 0
                          ? "No voices cached yet"
                          : `${cachedVoiceCount} voice${cachedVoiceCount === 1 ? "" : "s"} cached`}
                      </span>
                    </div>
                  </div>

                  {/* Supported languages info */}
                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Supported languages
                    </p>
                    <p className="text-sm text-muted">
                      {getPiperSupportedLabels().join(", ")}
                    </p>
                    <p className="text-xs text-muted mt-2">
                      Other languages will automatically use your browser&apos;s built-in voice.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle>Export Your Data</CardTitle>
          <CardDescription>
            Download a copy of all your personal data, including your account
            information and learning progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your export will include your account details and your complete
            learning history in JSON format.
          </p>
          <Button
            onClick={handleExportData}
            isLoading={isExporting}
            variant="outline"
          >
            Download My Data
          </Button>
        </CardContent>
      </Card>

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

      {/* Delete Account */}
      <Card variant="outlined">
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This action is irreversible. All your account information, learning
            progress, and preferences will be permanently removed.
          </p>
          <Button variant="error" onClick={() => setShowDeleteModal(true)}>
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletePassword("");
        }}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete your account? This action cannot be
            undone. All your data will be permanently removed.
          </p>
          <Input
            label="Confirm your password"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletePassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
              disabled={!deletePassword}
            >
              Delete Permanently
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
