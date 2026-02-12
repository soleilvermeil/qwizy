"use client";

import { useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";

interface Field {
  id?: string;
  name: string;
}

interface DeckFormProps {
  initialData?: {
    name: string;
    description: string | null;
    fields: Field[];
  };
  onSubmit: (data: {
    name: string;
    description: string;
    fields: Field[];
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeckForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: DeckFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [fields, setFields] = useState<Field[]>(
    initialData?.fields || [{ name: "Front" }, { name: "Back" }]
  );
  const [error, setError] = useState("");

  const handleAddField = () => {
    setFields([...fields, { name: "" }]);
  };

  const handleRemoveField = (index: number) => {
    if (fields.length <= 2) {
      setError("A deck must have at least 2 fields");
      return;
    }
    if (fields[index].id && !confirm("Are you sure you want to remove this field? This will delete all card values for this field when you save.")) {
      return;
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], name: value };
    setFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Deck name is required");
      return;
    }

    if (fields.some((f) => !f.name.trim())) {
      setError("All fields must have a name");
      return;
    }

    if (fields.length < 2) {
      setError("A deck must have at least 2 fields");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        fields: fields.map((f) => ({ ...f, name: f.name.trim() })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Deck Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Spanish Vocabulary"
        required
        autoFocus
      />

      <Textarea
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe what this deck is about..."
        rows={3}
      />

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Fields
        </label>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={field.name}
                onChange={(e) => handleFieldChange(index, e.target.value)}
                placeholder={`Field ${index + 1}`}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleRemoveField(index)}
                disabled={fields.length <= 2}
              >
                <svg
                  className="w-5 h-5 text-muted"
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
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddField}
          className="mt-2"
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
        <p className="text-sm text-muted mt-2">
          Each card will have these fields. Minimum 2 fields required.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} fullWidth>
          {initialData ? "Save Changes" : "Create Deck"}
        </Button>
      </div>
    </form>
  );
}
