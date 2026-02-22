"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

interface Group {
  id: string;
  name: string;
}

interface DeckInfo {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  accountType: string;
  mustChangePassword: boolean;
  newCardsPerDay: number;
  newCardsPerDayLocked: boolean;
  createdAt: string;
  groups: Group[];
  decks: DeckInfo[];
}

interface DeckProgress {
  deckId: string;
  deckName: string;
  totalCards: number;
  learnedCards: number;
  dueCards: number;
  byMastery: { not_seen: number; low: number; medium: number; high: number };
  averageDifficulty: number;
  totalReviews: number;
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [progress, setProgress] = useState<DeckProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit states
  const [newPassword, setNewPassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newCardsPerDay, setNewCardsPerDay] = useState("");
  const [newCardsPerDayLocked, setNewCardsPerDayLocked] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/users/${id}`).then((r) => r.json()),
      fetch("/api/admin/groups").then((r) => r.json()),
      fetch(`/api/admin/users/${id}/progress`).then((r) => r.json()),
    ])
      .then(([userData, groupsData, progressData]) => {
        setUser(userData.user);
        setAllGroups(groupsData.groups);
        setProgress(progressData.deckProgress || []);

        // Initialize form state
        setMustChangePassword(userData.user.mustChangePassword);
        setNewCardsPerDay(userData.user.newCardsPerDay.toString());
        setNewCardsPerDayLocked(userData.user.newCardsPerDayLocked);
        setSelectedGroupIds(userData.user.groups.map((g: Group) => g.id));
      })
      .catch((err) => {
        console.error("Error loading user:", err);
        setError("Failed to load user");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const body: Record<string, unknown> = {
        mustChangePassword,
        newCardsPerDay: parseInt(newCardsPerDay) || 10,
        newCardsPerDayLocked,
        groupIds: selectedGroupIds,
      };

      if (newPassword.length > 0) {
        if (newPassword.length < 6) {
          setError("Password must be at least 6 characters");
          setIsSaving(false);
          return;
        }
        body.newPassword = newPassword;
      }

      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      setSuccessMessage("User updated successfully");
      setNewPassword("");

      // Refresh user data
      const userData = await fetch(`/api/admin/users/${id}`).then((r) => r.json());
      setUser(userData.user);
      setSelectedGroupIds(userData.user.groups.map((g: Group) => g.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (response.ok) {
        router.push("/admin/users");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-muted">User not found</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.username}</h1>
          <p className="text-muted">
            {user.accountType === "TEACHER" ? "Teacher" : user.accountType === "EDUCATION" ? "Education" : "Personal"} account
            {" "}&middot;{" "}
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Link href="/admin/users">
          <Button variant="outline" size="sm">Back to Users</Button>
        </Link>
      </div>

      {successMessage && (
        <div className="p-3 rounded-lg bg-success/10 text-success text-sm">{successMessage}</div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-error/10 text-error text-sm">{error}</div>
      )}

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Reset password or force password change</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input
              label="New Password"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave empty to keep current"
              helperText="At least 6 characters"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mustChangePassword}
                onChange={(e) => setMustChangePassword(e.target.checked)}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-foreground text-sm">
                Force password change at next login
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Learning Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input
              label="New cards per day"
              type="number"
              min="1"
              max="100"
              value={newCardsPerDay}
              onChange={(e) => setNewCardsPerDay(e.target.value)}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newCardsPerDayLocked}
                onChange={(e) => setNewCardsPerDayLocked(e.target.checked)}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-foreground text-sm">
                Lock value (student cannot change it)
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Groups (only for EDUCATION accounts) */}
      {user.accountType === "EDUCATION" && (
        <Card>
          <CardHeader>
            <CardTitle>Groups</CardTitle>
            <CardDescription>Manage group memberships</CardDescription>
          </CardHeader>
          <CardContent>
            {allGroups.length === 0 ? (
              <p className="text-sm text-muted">No groups created yet</p>
            ) : (
              <div className="space-y-2">
                {allGroups.map((group) => (
                  <label
                    key={group.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedGroupIds.includes(group.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(group.id)}
                      onChange={() => toggleGroup(group.id)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">{group.name}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save */}
      <Button onClick={handleSave} isLoading={isSaving}>
        Save Changes
      </Button>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>
            {progress.length > 0
              ? `Enrolled in ${progress.length} deck${progress.length !== 1 ? "s" : ""}`
              : "Not enrolled in any decks yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {progress.length > 0 ? (
            <div className="space-y-4">
              {progress.map((deck) => {
                const pct = deck.totalCards > 0
                  ? Math.round((deck.learnedCards / deck.totalCards) * 100)
                  : 0;
                return (
                  <div key={deck.deckId} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{deck.deckName}</h4>
                      <span className="text-sm text-muted">{pct}% learned</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
                      <div className="h-full flex">
                        {deck.byMastery.high > 0 && (
                          <div
                            className="bg-success h-full"
                            style={{ width: `${(deck.byMastery.high / deck.totalCards) * 100}%` }}
                          />
                        )}
                        {deck.byMastery.medium > 0 && (
                          <div
                            className="bg-warning h-full"
                            style={{ width: `${(deck.byMastery.medium / deck.totalCards) * 100}%` }}
                          />
                        )}
                        {deck.byMastery.low > 0 && (
                          <div
                            className="bg-primary h-full"
                            style={{ width: `${(deck.byMastery.low / deck.totalCards) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{deck.learnedCards}/{deck.totalCards} cards</span>
                      <span>{deck.dueCards} due</span>
                      <span>{deck.totalReviews} reviews</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No learning data yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Delete */}
      <Card variant="outlined">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="error" onClick={() => setShowDeleteModal(true)}>
            Delete User
          </Button>
        </CardContent>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        size="sm"
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{user.username}</strong>? All learning progress will be permanently removed.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="error" onClick={handleDelete} isLoading={isDeleting}>Delete</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
