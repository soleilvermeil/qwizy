"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

interface Field {
  id?: string;
  name: string;
}

interface FieldEditorProps {
  fields: Field[];
  onChange: (fields: Field[]) => void;
  disabled?: boolean;
}

export function FieldEditor({ fields, onChange, disabled }: FieldEditorProps) {
  const [error, setError] = useState("");

  const handleAddField = () => {
    onChange([...fields, { name: "" }]);
  };

  const handleRemoveField = (index: number) => {
    if (fields.length <= 2) {
      setError("A deck must have at least 2 fields");
      return;
    }
    setError("");
    onChange(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], name: value };
    onChange(newFields);
    setError("");
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    onChange(newFields);
  };

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-sm text-muted w-6 text-center">{index + 1}</span>
          <Input
            value={field.name}
            onChange={(e) => handleFieldChange(index, e.target.value)}
            placeholder={`Field ${index + 1}`}
            disabled={disabled}
            className="flex-1"
          />
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => moveField(index, "up")}
              disabled={disabled || index === 0}
              className="px-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => moveField(index, "down")}
              disabled={disabled || index === fields.length - 1}
              className="px-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveField(index)}
              disabled={disabled || fields.length <= 2}
              className="px-2"
            >
              <svg
                className="w-4 h-4 text-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleAddField}
        disabled={disabled}
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Field
      </Button>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  );
}
