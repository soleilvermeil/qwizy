"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Textarea,
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

interface CreatedUser {
  username: string;
  password: string;
}

interface CreationError {
  username: string;
  error: string;
}

export default function CreateUsersPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"EDUCATION" | "TEACHER">("EDUCATION");
  const [usernamesText, setUsernamesText] = useState("");
  const [passwordMode, setPasswordMode] = useState<"unique" | "random">("random");
  const [uniquePassword, setUniquePassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [newCardsPerDay, setNewCardsPerDay] = useState("");
  const [newCardsPerDayLocked, setNewCardsPerDayLocked] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isTeacherSession, setIsTeacherSession] = useState(false);

  // Result state
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[] | null>(null);
  const [creationErrors, setCreationErrors] = useState<CreationError[]>([]);

  // Warning modal
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    fetch("/api/admin/groups")
      .then((r) => r.json())
      .then((data) => setGroups(data.groups))
      .catch(() => {});
    // Check if current user is a teacher (can't access settings endpoint)
    fetch("/api/admin/settings")
      .then((r) => {
        if (r.status === 401) setIsTeacherSession(true);
      })
      .catch(() => {});
  }, []);

  const doCreate = useCallback(async () => {
    setIsSubmitting(true);
    setError("");

    const usernames = usernamesText
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (usernames.length === 0) {
      setError("Please enter at least one username");
      setIsSubmitting(false);
      return;
    }

    if (passwordMode === "unique" && (!uniquePassword || uniquePassword.length < 6)) {
      setError("Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames,
          passwordMode,
          uniquePassword: passwordMode === "unique" ? uniquePassword : undefined,
          mustChangePassword,
          newCardsPerDay: accountType === "EDUCATION" && newCardsPerDay ? parseInt(newCardsPerDay) : undefined,
          newCardsPerDayLocked: accountType === "EDUCATION" ? newCardsPerDayLocked : undefined,
          groupIds: accountType === "EDUCATION" ? selectedGroupIds : [],
          accountType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create users");
      }

      setCreatedUsers(data.created);
      setCreationErrors(data.errors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create users");
    } finally {
      setIsSubmitting(false);
    }
  }, [usernamesText, passwordMode, uniquePassword, mustChangePassword, newCardsPerDay, newCardsPerDayLocked, selectedGroupIds, accountType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Show warning if same password for all and no mustChangePassword
    if (passwordMode === "unique" && !mustChangePassword) {
      setShowWarning(true);
      return;
    }

    doCreate();
  };

  const handleExportCSV = () => {
    if (!createdUsers) return;
    const csv = "username,password\n" + createdUsers.map((u) => `${u.username},${u.password}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "created-users.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  // Result screen
  if (createdUsers !== null) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users Created</h1>
          <p className="text-muted">
            {createdUsers.length} account{createdUsers.length !== 1 ? "s" : ""} created successfully
            {creationErrors.length > 0 && `, ${creationErrors.length} error${creationErrors.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {creationErrors.length > 0 && (
          <Card>
            <CardContent>
              <h3 className="font-medium text-error mb-2">Errors</h3>
              <div className="space-y-1">
                {creationErrors.map((err, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    <span className="font-medium">{err.username}</span>: {err.error}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {createdUsers.length > 0 && (
          <>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Credentials</h3>
                  <Button onClick={handleExportCSV} variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-medium text-muted">Username</th>
                        <th className="text-left py-2 px-3 font-medium text-muted">Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createdUsers.map((user, i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="py-2 px-3 text-foreground">{user.username}</td>
                          <td className="py-2 px-3 font-mono text-foreground">{user.password}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="p-3 rounded-lg bg-warning/10 text-warning text-sm">
              Make sure to save these credentials now. Passwords cannot be recovered later.
            </div>
          </>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/users")}>
            Back to Users
          </Button>
          <Button onClick={() => {
            setCreatedUsers(null);
            setCreationErrors([]);
            setUsernamesText("");
          }}>
            Create More
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Users</h1>
        <p className="text-muted">
          {accountType === "TEACHER" ? "Mass-create teacher accounts" : "Mass-create education accounts"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm">{error}</div>
        )}

        {/* Account Type (only visible to admins, not to teachers) */}
        {!isTeacherSession && (
          <Card>
            <CardHeader>
              <CardTitle>Account Type</CardTitle>
              <CardDescription>Choose the type of accounts to create</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  accountType === "EDUCATION" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                }`}>
                  <input
                    type="radio"
                    name="accountType"
                    value="EDUCATION"
                    checked={accountType === "EDUCATION"}
                    onChange={() => setAccountType("EDUCATION")}
                    className="mt-0.5 accent-[var(--color-primary)]"
                  />
                  <div>
                    <p className="font-medium text-foreground">Education accounts</p>
                    <p className="text-sm text-muted">Student accounts that can be assigned to groups and decks</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  accountType === "TEACHER" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                }`}>
                  <input
                    type="radio"
                    name="accountType"
                    value="TEACHER"
                    checked={accountType === "TEACHER"}
                    onChange={() => setAccountType("TEACHER")}
                    className="mt-0.5 accent-[var(--color-primary)]"
                  />
                  <div>
                    <p className="font-medium text-foreground">Teacher accounts</p>
                    <p className="text-sm text-muted">Teachers can create and manage their own students, groups, and education-only decks</p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Usernames */}
        <Card>
          <CardHeader>
            <CardTitle>Usernames</CardTitle>
            <CardDescription>Enter one username per line</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={usernamesText}
              onChange={(e) => setUsernamesText(e.target.value)}
              placeholder={"student1\nstudent2\nstudent3"}
              rows={6}
            />
            <p className="text-xs text-muted mt-2">
              {usernamesText.split("\n").filter((u) => u.trim()).length} username(s)
            </p>
          </CardContent>
        </Card>

        {/* Password Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Choose how passwords are generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                passwordMode === "random" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}>
                <input
                  type="radio"
                  name="passwordMode"
                  value="random"
                  checked={passwordMode === "random"}
                  onChange={() => setPasswordMode("random")}
                  className="mt-0.5 accent-[var(--color-primary)]"
                />
                <div>
                  <p className="font-medium text-foreground">Random password for each student</p>
                  <p className="text-sm text-muted">
                    Apple-style format: <span className="font-mono">xxxxxx-xxxxxx-xxxxxx</span>
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                passwordMode === "unique" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}>
                <input
                  type="radio"
                  name="passwordMode"
                  value="unique"
                  checked={passwordMode === "unique"}
                  onChange={() => setPasswordMode("unique")}
                  className="mt-0.5 accent-[var(--color-primary)]"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Same password for all</p>
                  <p className="text-sm text-muted mb-2">All students will share one password</p>
                  {passwordMode === "unique" && (
                    <Input
                      type="text"
                      value={uniquePassword}
                      onChange={(e) => setUniquePassword(e.target.value)}
                      placeholder="Enter shared password"
                      helperText="At least 6 characters"
                    />
                  )}
                </div>
              </label>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mustChangePassword}
                  onChange={(e) => setMustChangePassword(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-foreground text-sm">
                  Force password change at first login
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Learning Settings (only for education accounts) */}
        {accountType === "EDUCATION" && <Card>
          <CardHeader>
            <CardTitle>Learning Settings</CardTitle>
            <CardDescription>Optional: set cards per day for these accounts</CardDescription>
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
                placeholder="Default: 10"
                helperText="Leave empty to use the default (10)"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCardsPerDayLocked}
                  onChange={(e) => setNewCardsPerDayLocked(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-foreground text-sm">
                  Lock this value (students cannot change it)
                </span>
              </label>
            </div>
          </CardContent>
        </Card>}

        {/* Groups (only for education accounts) */}
        {accountType === "EDUCATION" && groups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Groups</CardTitle>
              <CardDescription>Assign students to groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groups.map((group) => (
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
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/users")}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create {usernamesText.split("\n").filter((u) => u.trim()).length} Users
          </Button>
        </div>
      </form>

      {/* Warning modal for shared password without forced change */}
      <Modal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
        title="Security Warning"
        size="sm"
      >
        <p className="text-sm text-muted-foreground">
          All students will share the same password and won&apos;t be prompted to change it.
          This is not recommended for security reasons.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowWarning(false)}>Cancel</Button>
          <Button
            variant="error"
            onClick={() => {
              setShowWarning(false);
              doCreate();
            }}
          >
            Create Anyway
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
