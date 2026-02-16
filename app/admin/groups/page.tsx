"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Input, Card, CardContent, Modal, ModalFooter } from "@/components/ui";

interface Group {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    members: number;
    deckAssignments: number;
  };
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/admin/groups");
      const data = await response.json();
      setGroups(data.groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
        }),
      });
      if (response.ok) {
        setIsCreateOpen(false);
        setNewGroupName("");
        fetchGroups();
      }
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteGroupId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/groups/${deleteGroupId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setGroups(groups.filter((g) => g.id !== deleteGroupId));
        setDeleteGroupId(null);
      }
    } catch (error) {
      console.error("Error deleting group:", error);
    } finally {
      setIsDeleting(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Groups</h1>
          <p className="text-muted">Manage student groups</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No groups yet</h3>
              <p className="text-muted mb-4">Create your first group to organize students</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} hover>
              <CardContent>
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{group.name}</h3>
                    <div className="space-y-1 text-sm text-muted mb-3">
                      <p>{group._count.members} member{group._count.members !== 1 ? "s" : ""}</p>
                      <p>{group._count.deckAssignments} deck{group._count.deckAssignments !== 1 ? "s" : ""} assigned</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Link href={`/admin/groups/${group.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" fullWidth>Manage</Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteGroupId(group.id)}
                    >
                      <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Group" size="sm">
        <div className="space-y-4">
          <Input
            label="Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="e.g., Class 3A"
            autoFocus
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} isLoading={isSubmitting} disabled={!newGroupName.trim()}>Create</Button>
        </ModalFooter>
      </Modal>

      {/* Delete modal */}
      <Modal isOpen={!!deleteGroupId} onClose={() => setDeleteGroupId(null)} title="Delete Group" size="sm">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this group? Members will not be deleted, only removed from the group.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteGroupId(null)}>Cancel</Button>
          <Button variant="error" onClick={handleDelete} isLoading={isDeleting}>Delete</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
