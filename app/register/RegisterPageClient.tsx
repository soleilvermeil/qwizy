"use client";

import { useState } from "react";
import { RegisterForm } from "@/components/auth";

interface RegisterPageClientProps {
  personalAllowed: boolean;
  teacherAllowed: boolean;
}

export function RegisterPageClient({ personalAllowed, teacherAllowed }: RegisterPageClientProps) {
  const bothAllowed = personalAllowed && teacherAllowed;

  const defaultType = personalAllowed ? "PERSONAL" : "TEACHER";
  const [accountType, setAccountType] = useState(defaultType);

  return (
    <div className="space-y-4">
      {bothAllowed && (
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setAccountType("PERSONAL")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              accountType === "PERSONAL"
                ? "bg-primary text-white"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => setAccountType("TEACHER")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              accountType === "TEACHER"
                ? "bg-primary text-white"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            Teacher
          </button>
        </div>
      )}

      {accountType === "TEACHER" && (
        <p className="text-xs text-muted">
          Teacher accounts can create and manage students, groups, and education-only decks.
        </p>
      )}

      <RegisterForm accountType={accountType} />
    </div>
  );
}
