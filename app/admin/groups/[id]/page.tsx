"use client";

import { useState, useEffect, use } from "react";
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
  Select,
} from "@/components/ui";

interface Member {
  id: string;
  username: string;
  accountType: string;
  newCardsPerDay: number;
  newCardsPerDayLocked: boolean;
  createdAt: string;
}

interface DeckInfo {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  mandatory: boolean;
  assignmentId: string;
  _count: { cards: number };
}

interface Group {
  id: string;
  name: string;
  members: Member[];
  decks: DeckInfo[];
}

interface DeckStat {
  deckId: string;
  deckName: string;
  totalCards: number;
  totalStudents: number;
  studentsStarted: number;
  studentsCompleted: number;
  avgCardsLearned: number;
}

export default function AdminGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [deckStats, setDeckStats] = useState<DeckStat[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; username: string; accountType: string }[]>([]);
  const [allDecks, setAllDecks] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit states
  const [groupName, setGroupName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // Add member
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Add deck
  const [showAddDeck, setShowAddDeck] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [newDeckMandatory, setNewDeckMandatory] = useState(false);

  const fetchAll = async () => {
    try {
      const [groupRes, progressRes, usersRes, decksRes] = await Promise.all([
        fetch(`/api/admin/groups/${id}`).then((r) => r.json()),
        fetch(`/api/admin/groups/${id}/progress`).then((r) => r.json()),
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/decks").then((r) => r.json()),
      ]);

      setGroup(groupRes.group);
      setDeckStats(progressRes.deckStats || []);
      setAllUsers(usersRes.users || []);
      setAllDecks(decksRes.decks || []);

      setGroupName(groupRes.group.name);
    } catch (err) {
      console.error("Error loading group:", err);
      setError("Failed to load group");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /** Build the deckAssignments payload from current group decks */
  const buildDeckAssignments = (decks: DeckInfo[]) =>
    decks.map((d) => ({ deckId: d.id, mandatory: d.mandatory }));

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await fetch(`/api/admin/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
        }),
      });
      if (!response.ok) throw new Error("Failed to update group");
      setSuccessMessage("Group updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    try {
      await fetch(`/api/admin/groups/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [selectedUserId] }),
      });
      setShowAddMember(false);
      setSelectedUserId("");
      fetchAll();
    } catch (err) {
      console.error("Error adding member:", err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await fetch(`/api/admin/groups/${id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [userId] }),
      });
      fetchAll();
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const handleAddDeck = async () => {
    if (!selectedDeckId || !group) return;
    const updatedAssignments = [
      ...buildDeckAssignments(group.decks),
      { deckId: selectedDeckId, mandatory: newDeckMandatory },
    ];
    try {
      await fetch(`/api/admin/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckAssignments: updatedAssignments }),
      });
      setShowAddDeck(false);
      setSelectedDeckId("");
      setNewDeckMandatory(false);
      fetchAll();
    } catch (err) {
      console.error("Error adding deck:", err);
    }
  };

  const handleRemoveDeck = async (deckId: string) => {
    if (!group) return;
    const updatedAssignments = buildDeckAssignments(
      group.decks.filter((d) => d.id !== deckId)
    );
    try {
      await fetch(`/api/admin/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckAssignments: updatedAssignments }),
      });
      fetchAll();
    } catch (err) {
      console.error("Error removing deck:", err);
    }
  };

  const handleToggleMandatory = async (deckId: string, currentMandatory: boolean) => {
    if (!group) return;
    const updatedAssignments = group.decks.map((d) =>
      d.id === deckId
        ? { deckId: d.id, mandatory: !currentMandatory }
        : { deckId: d.id, mandatory: d.mandatory }
    );
    try {
      await fetch(`/api/admin/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckAssignments: updatedAssignments }),
      });
      fetchAll();
    } catch (err) {
      console.error("Error toggling mandatory:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!group) {
    return <p className="text-muted">Group not found</p>;
  }

  const memberIds = new Set(group.members.map((m) => m.id));
  const availableUsers = allUsers.filter(
    (u) => !memberIds.has(u.id) && u.accountType === "EDUCATION"
  );

  const assignedDeckIds = new Set(group.decks.map((d) => d.id));
  const availableDecks = allDecks.filter((d) => !assignedDeckIds.has(d.id));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
          <p className="text-muted">{group.members.length} members</p>
        </div>
        <Link href="/admin/groups">
          <Button variant="outline" size="sm">Back to Groups</Button>
        </Link>
      </div>

      {successMessage && (
        <div className="p-3 rounded-lg bg-success/10 text-success text-sm">{successMessage}</div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-error/10 text-error text-sm">{error}</div>
      )}

      {/* Group Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Group Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input
              label="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <Button onClick={handleSave} isLoading={isSaving} size="sm">
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>{group.members.length} student{group.members.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {group.members.length > 0 ? (
            <div className="space-y-2 mb-4">
              {group.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30"
                >
                  <Link
                    href={`/admin/users/${member.id}`}
                    className="font-medium text-foreground hover:text-primary text-sm"
                  >
                    {member.username}
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted mb-4">No members yet</p>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowAddMember(true)}>
            Add Member
          </Button>
        </CardContent>
      </Card>

      {/* Assigned Decks */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Decks</CardTitle>
          <CardDescription>
            Mandatory decks are auto-added and cannot be removed by students.
            Visible decks can be added optionally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {group.decks.length > 0 ? (
            <div className="space-y-2 mb-4">
              {group.decks.map((deck) => (
                <div
                  key={deck.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-foreground text-sm">{deck.name}</span>
                      <span className="ml-2 text-xs text-muted">{deck._count.cards} cards</span>
                    </div>
                    <button
                      onClick={() => handleToggleMandatory(deck.id, deck.mandatory)}
                      className={`shrink-0 px-2.5 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                        deck.mandatory
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                      title={deck.mandatory
                        ? "Click to make visible only (students can add/remove)"
                        : "Click to make mandatory (auto-added, cannot be removed)"}
                    >
                      {deck.mandatory ? "Mandatory" : "Visible"}
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDeck(deck.id)}
                    className="ml-2"
                  >
                    <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted mb-4">No decks assigned yet</p>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowAddDeck(true)}>
            Assign Deck
          </Button>
        </CardContent>
      </Card>

      {/* Group Progress */}
      {deckStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Group Progress</CardTitle>
            <CardDescription>Aggregate statistics per deck</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deckStats.map((stat) => (
                <div key={stat.deckId} className="p-4 rounded-lg border border-border">
                  <h4 className="font-medium text-foreground mb-2">{stat.deckName}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-muted">Total Cards</p>
                      <p className="font-medium text-foreground">{stat.totalCards}</p>
                    </div>
                    <div>
                      <p className="text-muted">Students Started</p>
                      <p className="font-medium text-foreground">{stat.studentsStarted}/{stat.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-muted">Completed</p>
                      <p className="font-medium text-foreground">{stat.studentsCompleted}/{stat.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-muted">Avg Cards Learned</p>
                      <p className="font-medium text-foreground">{stat.avgCardsLearned}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add member modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member" size="sm">
        <Select
          label="Select User"
          options={[
            { value: "", label: "-- Select a user --" },
            ...availableUsers.map((u) => ({ value: u.id, label: u.username })),
          ]}
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        />
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowAddMember(false)}>Cancel</Button>
          <Button onClick={handleAddMember} disabled={!selectedUserId}>Add</Button>
        </ModalFooter>
      </Modal>

      {/* Add deck modal */}
      <Modal
        isOpen={showAddDeck}
        onClose={() => { setShowAddDeck(false); setNewDeckMandatory(false); }}
        title="Assign Deck to Group"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Select Deck"
            options={[
              { value: "", label: "-- Select a deck --" },
              ...availableDecks.map((d) => ({ value: d.id, label: d.name })),
            ]}
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
          />
          <div className="space-y-2">
            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              !newDeckMandatory ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
            }`}>
              <input
                type="radio"
                name="deckMode"
                checked={!newDeckMandatory}
                onChange={() => setNewDeckMandatory(false)}
                className="mt-0.5 accent-[var(--color-primary)]"
              />
              <div>
                <p className="font-medium text-foreground text-sm">Visible</p>
                <p className="text-xs text-muted">
                  Students can see and optionally add this deck
                </p>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              newDeckMandatory ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
            }`}>
              <input
                type="radio"
                name="deckMode"
                checked={newDeckMandatory}
                onChange={() => setNewDeckMandatory(true)}
                className="mt-0.5 accent-[var(--color-primary)]"
              />
              <div>
                <p className="font-medium text-foreground text-sm">Mandatory</p>
                <p className="text-xs text-muted">
                  Automatically added to all students and cannot be removed
                </p>
              </div>
            </label>
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setShowAddDeck(false); setNewDeckMandatory(false); }}>Cancel</Button>
          <Button onClick={handleAddDeck} disabled={!selectedDeckId}>Assign</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
