"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Input, Card, CardContent, Modal, ModalFooter, Select } from "@/components/ui";

interface Group {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  accountType: string;
  mustChangePassword: boolean;
  newCardsPerDay: number;
  newCardsPerDayLocked: boolean;
  createdAt: string;
  groups: Group[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterType, setFilterType] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterGroup) params.set("groupId", filterGroup);
      if (filterType) params.set("accountType", filterType);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/admin/groups");
      const data = await response.json();
      setGroups(data.groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterGroup, filterType]);

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${deleteUserId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setUsers(users.filter((u) => u.id !== deleteUserId));
        setDeleteUserId(null);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted">Manage student and user accounts</p>
        </div>
        <Link href="/admin/users/create">
          <Button>
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Users
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          placeholder="Search by username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          options={[
            { value: "", label: "All types" },
            { value: "EDUCATION", label: "Education" },
            { value: "PERSONAL", label: "Personal" },
          ]}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        />
        <Select
          options={[
            { value: "", label: "All groups" },
            ...groups.map((g) => ({ value: g.id, label: g.name })),
          ]}
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted">No users found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted">Username</th>
                <th className="text-left py-3 px-4 font-medium text-muted">Type</th>
                <th className="text-left py-3 px-4 font-medium text-muted">Groups</th>
                <th className="text-left py-3 px-4 font-medium text-muted">Cards/Day</th>
                <th className="text-left py-3 px-4 font-medium text-muted">Created</th>
                <th className="text-right py-3 px-4 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-secondary/30">
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {user.username}
                    </Link>
                    {user.mustChangePassword && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-warning/10 text-warning rounded">
                        Must change password
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      user.accountType === "EDUCATION"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {user.accountType === "EDUCATION" ? "Education" : "Personal"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {user.groups.length > 0 ? (
                        user.groups.map((g) => (
                          <span key={g.id} className="px-2 py-0.5 text-xs bg-secondary rounded-full text-muted-foreground">
                            {g.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted text-xs">None</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {user.newCardsPerDay}
                    {user.newCardsPerDayLocked && (
                      <svg className="inline w-3.5 h-3.5 ml-1 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteUserId(user.id)}
                      >
                        <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        title="Delete User"
        size="sm"
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this user? All their learning progress will be permanently removed.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteUserId(null)}>Cancel</Button>
          <Button variant="error" onClick={handleDelete} isLoading={isDeleting}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
