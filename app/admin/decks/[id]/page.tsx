"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Modal,
  Input,
  Select,
  TokenFieldSelect,
} from "@/components/ui";
import { DeckForm } from "@/components/admin";
import { TTS_LANGUAGES, getTtsLanguageLabel } from "@/lib/tts-languages";

interface Field {
  id: string;
  name: string;
  position: number;
}

interface CardValue {
  id: string;
  fieldId: string;
  value: string;
}

interface CardItem {
  id: string;
  position: number;
  tags: string;
  values: CardValue[];
  createdAt: string;
}

interface QuestionType {
  id: string;
  deckId: string;
  showFieldId: string;
  askFieldId: string;
  position: number;
  useAsQuestion: boolean;
  useAsExplanation: boolean;
  showTtsLang: string | null;
  showTtsFieldId: string | null;
  showTtsStopAt: string | null;
  askTtsLang: string | null;
  askTtsFieldId: string | null;
  askTtsStopAt: string | null;
  showHintFieldIds: string | null;
  askHintFieldIds: string | null;
}

interface GroupAssignment {
  mandatory: boolean;
  group: { id: string; name: string };
}

interface Deck {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  fields: Field[];
  questionTypes: QuestionType[];
  groupAssignments: GroupAssignment[];
  _count: {
    cards: number;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditDeckPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardFormValues, setCardFormValues] = useState<Record<string, string>>({});
  const [tagFilter, setTagFilter] = useState<string>("");
  const [isAddingQuestionType, setIsAddingQuestionType] = useState(false);
  const [newShowFieldId, setNewShowFieldId] = useState("");
  const [newAskFieldId, setNewAskFieldId] = useState("");
  const [questionTypeError, setQuestionTypeError] = useState("");
  const [newShowTtsLang, setNewShowTtsLang] = useState("");
  const [newShowTtsFieldId, setNewShowTtsFieldId] = useState("");
  const [newShowTtsStopAt, setNewShowTtsStopAt] = useState("");
  const [newAskTtsLang, setNewAskTtsLang] = useState("");
  const [newAskTtsFieldId, setNewAskTtsFieldId] = useState("");
  const [newAskTtsStopAt, setNewAskTtsStopAt] = useState("");
  const [newUseAsQuestion, setNewUseAsQuestion] = useState(true);
  const [newUseAsExplanation, setNewUseAsExplanation] = useState(false);
  const [newShowHintFieldIds, setNewShowHintFieldIds] = useState<string[]>([]);
  const [newAskHintFieldIds, setNewAskHintFieldIds] = useState<string[]>([]);
  const [editingQuestionTypeId, setEditingQuestionTypeId] = useState<string | null>(null);
  const [editShowTtsLang, setEditShowTtsLang] = useState("");
  const [editShowTtsFieldId, setEditShowTtsFieldId] = useState("");
  const [editShowTtsStopAt, setEditShowTtsStopAt] = useState("");
  const [editAskTtsLang, setEditAskTtsLang] = useState("");
  const [editAskTtsFieldId, setEditAskTtsFieldId] = useState("");
  const [editAskTtsStopAt, setEditAskTtsStopAt] = useState("");
  const [editShowHintFieldIds, setEditShowHintFieldIds] = useState<string[]>([]);
  const [editAskHintFieldIds, setEditAskHintFieldIds] = useState<string[]>([]);
  const [editQuestionTypeError, setEditQuestionTypeError] = useState("");
  // Visibility state
  const [visibility, setVisibility] = useState("PUBLIC");
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);
  const [visibilitySuccess, setVisibilitySuccess] = useState("");

  const fetchDeck = useCallback(async () => {
    try {
      const response = await fetch(`/api/decks/${id}`);
      if (!response.ok) throw new Error("Deck not found");
      const data = await response.json();
      setDeck(data.deck);
      setVisibility(data.deck.visibility || "PUBLIC");
    } catch (error) {
      console.error("Error fetching deck:", error);
      router.push("/admin/decks");
    }
  }, [id, router]);

  const fetchCards = useCallback(async () => {
    try {
      const response = await fetch(`/api/decks/${id}/cards`);
      if (!response.ok) throw new Error("Failed to fetch cards");
      const data = await response.json();
      setCards(data.cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDeck();
    fetchCards();
  }, [fetchDeck, fetchCards]);

  const handleUpdateDeck = async (data: {
    name: string;
    description: string;
    fields: { id?: string; name: string }[];
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/decks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update deck");
      }

      setIsEditModalOpen(false);
      fetchDeck();
      fetchCards();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deck) return;

    setIsSubmitting(true);
    try {
      const values = deck.fields.map((field) => ({
        fieldId: field.id,
        value: cardFormValues[field.id] || "",
      }));
      const tags = cardFormValues["_tags"] || "";

      const response = await fetch(`/api/decks/${id}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values, tags }),
      });

      if (!response.ok) {
        throw new Error("Failed to add card");
      }

      setIsAddCardModalOpen(false);
      setCardFormValues({});
      fetchCards();
      fetchDeck();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this card?")) return;

    try {
      const response = await fetch(`/api/decks/${id}/cards/${cardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete card");
      }

      setCards(cards.filter((c) => c.id !== cardId));
      fetchDeck();
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Failed to delete card");
    }
  };

  const handleReorderCard = async (cardId: string, direction: "up" | "down") => {
    try {
      const response = await fetch(`/api/decks/${id}/cards/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, direction }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder card");
      }

      fetchCards();
    } catch (error) {
      console.error("Error reordering card:", error);
    }
  };

  const handleAddQuestionType = async () => {
    if (!newShowFieldId || !newAskFieldId) {
      setQuestionTypeError("Please select both fields");
      return;
    }
    if (newShowFieldId === newAskFieldId) {
      setQuestionTypeError("Show and ask fields must be different");
      return;
    }

    setQuestionTypeError("");
    try {
      const response = await fetch(`/api/decks/${id}/question-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showFieldId: newShowFieldId,
          askFieldId: newAskFieldId,
          useAsQuestion: newUseAsQuestion,
          useAsExplanation: newUseAsExplanation,
          showTtsLang: newShowTtsLang || undefined,
          showTtsFieldId: newShowTtsFieldId || undefined,
          showTtsStopAt: newShowTtsStopAt || undefined,
          askTtsLang: newAskTtsLang || undefined,
          askTtsFieldId: newAskTtsFieldId || undefined,
          askTtsStopAt: newAskTtsStopAt || undefined,
          showHintFieldIds: newShowHintFieldIds.length > 0 ? newShowHintFieldIds : undefined,
          askHintFieldIds: newAskHintFieldIds.length > 0 ? newAskHintFieldIds : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setQuestionTypeError(data.error || "Failed to add question type");
        return;
      }

      setIsAddingQuestionType(false);
      setNewShowFieldId("");
      setNewAskFieldId("");
      setNewShowTtsLang("");
      setNewShowTtsFieldId("");
      setNewShowTtsStopAt("");
      setNewAskTtsLang("");
      setNewAskTtsFieldId("");
      setNewAskTtsStopAt("");
      setNewUseAsQuestion(true);
      setNewUseAsExplanation(false);
      setNewShowHintFieldIds([]);
      setNewAskHintFieldIds([]);
      fetchDeck();
    } catch (error) {
      console.error("Error adding question type:", error);
      setQuestionTypeError("Failed to add question type");
    }
  };

  const handleDeleteQuestionType = async (questionTypeId: string) => {
    if (!confirm("Are you sure you want to delete this question type?")) return;

    try {
      const response = await fetch(
        `/api/decks/${id}/question-types?questionTypeId=${questionTypeId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete question type");
      }

      fetchDeck();
    } catch (error) {
      console.error("Error deleting question type:", error);
    }
  };

  const startEditingQuestionType = (qt: QuestionType) => {
    setEditingQuestionTypeId(qt.id);
    setEditShowTtsLang(qt.showTtsLang || "");
    setEditShowTtsFieldId(qt.showTtsFieldId || "");
    setEditShowTtsStopAt(qt.showTtsStopAt || "");
    setEditAskTtsLang(qt.askTtsLang || "");
    setEditAskTtsFieldId(qt.askTtsFieldId || "");
    setEditAskTtsStopAt(qt.askTtsStopAt || "");
    setEditShowHintFieldIds(qt.showHintFieldIds ? qt.showHintFieldIds.split(",").filter(Boolean) : []);
    setEditAskHintFieldIds(qt.askHintFieldIds ? qt.askHintFieldIds.split(",").filter(Boolean) : []);
    setEditQuestionTypeError("");
  };

  const handleUpdateQuestionType = async () => {
    if (!editingQuestionTypeId) return;

    try {
      const response = await fetch(`/api/decks/${id}/question-types`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionTypeId: editingQuestionTypeId,
          showTtsLang: editShowTtsLang || undefined,
          showTtsFieldId: editShowTtsFieldId || undefined,
          showTtsStopAt: editShowTtsStopAt || undefined,
          askTtsLang: editAskTtsLang || undefined,
          askTtsFieldId: editAskTtsFieldId || undefined,
          askTtsStopAt: editAskTtsStopAt || undefined,
          showHintFieldIds: editShowHintFieldIds.length > 0 ? editShowHintFieldIds : [],
          askHintFieldIds: editAskHintFieldIds.length > 0 ? editAskHintFieldIds : [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setEditQuestionTypeError(data.error || "Failed to update question type");
        return;
      }

      setEditingQuestionTypeId(null);
      fetchDeck();
    } catch (error) {
      console.error("Error updating question type:", error);
      setEditQuestionTypeError("Failed to update question type");
    }
  };

  const handleSaveVisibility = async () => {
    if (!deck) return;
    setIsSavingVisibility(true);
    setVisibilitySuccess("");
    try {
      const response = await fetch(`/api/decks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deck.name,
          description: deck.description || "",
          visibility,
        }),
      });
      if (!response.ok) throw new Error("Failed to save");
      setVisibilitySuccess("Visibility settings saved");
      fetchDeck();
    } catch {
      // ignore
    } finally {
      setIsSavingVisibility(false);
    }
  };

  const getFieldName = (fieldId: string) => {
    return deck?.fields.find((f) => f.id === fieldId)?.name || "Unknown";
  };

  if (isLoading || !deck) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const getFieldValue = (card: CardItem, fieldId: string) => {
    return card.values.find((v) => v.fieldId === fieldId)?.value || "";
  };

  // Get all unique tags from cards
  const allTags = Array.from(
    new Set(
      cards
        .flatMap((card) => card.tags.split(",").map((t) => t.trim()))
        .filter((t) => t.length > 0)
    )
  ).sort();

  // Filter cards based on tag filter
  const filteredCards = tagFilter
    ? cards.filter((card) =>
        card.tags.split(",").map((t) => t.trim()).includes(tagFilter)
      )
    : cards;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/decks">
          <Button variant="ghost" size="sm">
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{deck.name}</CardTitle>
              {deck.description && (
                <p className="text-muted mt-1">{deck.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {deck.fields.map((field) => (
                  <span
                    key={field.id}
                    className="px-2 py-0.5 text-xs bg-secondary rounded-full text-muted-foreground"
                  >
                    {field.name}
                  </span>
                ))}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
              Edit Deck
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Visibility Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                visibility === "PUBLIC" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  value="PUBLIC"
                  checked={visibility === "PUBLIC"}
                  onChange={() => setVisibility("PUBLIC")}
                  className="mt-0.5 accent-[var(--color-primary)]"
                />
                <div>
                  <p className="font-medium text-foreground">Public</p>
                  <p className="text-sm text-muted">Visible to all personal accounts</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                visibility === "EDUCATION_ONLY" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  value="EDUCATION_ONLY"
                  checked={visibility === "EDUCATION_ONLY"}
                  onChange={() => setVisibility("EDUCATION_ONLY")}
                  className="mt-0.5 accent-[var(--color-primary)]"
                />
                <div>
                  <p className="font-medium text-foreground">Education only</p>
                  <p className="text-sm text-muted">Only visible to education accounts via group assignments</p>
                </div>
              </label>
            </div>

            {visibilitySuccess && (
              <p className="text-sm text-success">{visibilitySuccess}</p>
            )}

            <Button size="sm" onClick={handleSaveVisibility} isLoading={isSavingVisibility}>
              Save Visibility
            </Button>

            {/* Read-only: groups that have this deck assigned */}
            {deck.groupAssignments && deck.groupAssignments.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Assigned to groups
                </p>
                <div className="space-y-1.5">
                  {deck.groupAssignments.map((assignment) => (
                    <div key={assignment.group.id} className="flex items-center gap-2">
                      <Link
                        href={`/admin/groups/${assignment.group.id}`}
                        className="text-sm text-foreground hover:text-primary"
                      >
                        {assignment.group.name}
                      </Link>
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                        assignment.mandatory
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {assignment.mandatory ? "Mandatory" : "Visible"}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted mt-2">
                  Group assignments are managed from each group&apos;s detail page.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Types Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Question Types</CardTitle>
            {!isAddingQuestionType && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAddingQuestionType(true);
                  setQuestionTypeError("");
                  setNewShowFieldId("");
                  setNewAskFieldId("");
                  setNewShowTtsLang("");
                  setNewShowTtsFieldId("");
                  setNewShowTtsStopAt("");
                  setNewAskTtsLang("");
                  setNewAskTtsFieldId("");
                  setNewAskTtsStopAt("");
                  setNewUseAsQuestion(true);
                  setNewUseAsExplanation(false);
                  setNewShowHintFieldIds([]);
                  setNewAskHintFieldIds([]);
                }}
                disabled={deck.fields.length < 2}
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
                Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {deck.fields.length < 2 ? (
            <p className="text-sm text-muted">
              Add at least 2 fields to configure question types.
            </p>
          ) : (
            <div className="space-y-3">
              {deck.questionTypes.length === 0 && !isAddingQuestionType && (
                <p className="text-sm text-muted">
                  No question types configured. The default (first field → second field) will be used.
                </p>
              )}

              {/* Existing question types */}
              {deck.questionTypes.map((qt) => (
                <div key={qt.id} className="bg-secondary/50 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">
                          {getFieldName(qt.showFieldId)}
                        </span>
                        {qt.showTtsLang && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs" title={`TTS: ${getTtsLanguageLabel(qt.showTtsLang)} - ${getFieldName(qt.showTtsFieldId || qt.showFieldId)}${qt.showTtsStopAt ? ` (stop at "${qt.showTtsStopAt}")` : ""}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            {qt.showTtsLang.split("-")[0]}
                          </span>
                        )}
                      </div>
                      <svg
                        className="w-4 h-4 text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">
                          {getFieldName(qt.askFieldId)}
                        </span>
                        {qt.askTtsLang && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs" title={`TTS: ${getTtsLanguageLabel(qt.askTtsLang)} - ${getFieldName(qt.askTtsFieldId || qt.askFieldId)}${qt.askTtsStopAt ? ` (stop at "${qt.askTtsStopAt}")` : ""}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            {qt.askTtsLang.split("-")[0]}
                          </span>
                        )}
                      </div>
                      {qt.useAsQuestion && (
                        <span className="px-1.5 py-0.5 bg-warning/10 text-warning rounded text-xs font-medium">Q</span>
                      )}
                      {qt.useAsExplanation && (
                        <span className="px-1.5 py-0.5 bg-success/10 text-success rounded text-xs font-medium">E</span>
                      )}
                      {(qt.showHintFieldIds || qt.askHintFieldIds) && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-secondary text-muted-foreground rounded text-xs" title={`Hints: ${[qt.showHintFieldIds, qt.askHintFieldIds].filter(Boolean).join(", ")}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          hints
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingQuestionType(qt)}
                        disabled={editingQuestionTypeId === qt.id}
                      >
                        <svg
                          className="w-4 h-4 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestionType(qt.id)}
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  {/* Inline edit form for TTS settings */}
                  {editingQuestionTypeId === qt.id && (
                    <div className="border-t border-border px-3 py-3 space-y-4">
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start">
                        {/* Show TTS column */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Show TTS</p>
                          <Select
                            label="Language"
                            value={editShowTtsLang}
                            onChange={(e) => {
                              setEditShowTtsLang(e.target.value);
                              if (!e.target.value) {
                                setEditShowTtsFieldId("");
                                setEditShowTtsStopAt("");
                              }
                            }}
                            placeholder="None"
                            options={TTS_LANGUAGES.map((l) => ({
                              value: l.code,
                              label: l.label,
                            }))}
                          />
                          {editShowTtsLang && (
                            <>
                              <Select
                                label="Read field"
                                value={editShowTtsFieldId}
                                onChange={(e) => setEditShowTtsFieldId(e.target.value)}
                                placeholder="Select field..."
                                options={deck.fields.map((f) => ({
                                  value: f.id,
                                  label: f.name,
                                }))}
                              />
                              <Input
                                label="Stop at"
                                value={editShowTtsStopAt}
                                onChange={(e) => setEditShowTtsStopAt(e.target.value)}
                                placeholder="e.g. ,"
                              />
                            </>
                          )}
                        </div>

                        {/* Spacer */}
                        <div className="flex items-center pt-6">
                          <div className="w-5" />
                        </div>

                        {/* Ask TTS column */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Answer TTS</p>
                          <Select
                            label="Language"
                            value={editAskTtsLang}
                            onChange={(e) => {
                              setEditAskTtsLang(e.target.value);
                              if (!e.target.value) {
                                setEditAskTtsFieldId("");
                                setEditAskTtsStopAt("");
                              }
                            }}
                            placeholder="None"
                            options={TTS_LANGUAGES.map((l) => ({
                              value: l.code,
                              label: l.label,
                            }))}
                          />
                          {editAskTtsLang && (
                            <>
                              <Select
                                label="Read field"
                                value={editAskTtsFieldId}
                                onChange={(e) => setEditAskTtsFieldId(e.target.value)}
                                placeholder="Select field..."
                                options={deck.fields.map((f) => ({
                                  value: f.id,
                                  label: f.name,
                                }))}
                              />
                              <Input
                                label="Stop at"
                                value={editAskTtsStopAt}
                                onChange={(e) => setEditAskTtsStopAt(e.target.value)}
                                placeholder="e.g. ,"
                              />
                            </>
                          )}
                        </div>
                      </div>
                      {/* Hints */}
                      <div className="border-t border-border pt-3">
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start">
                          <TokenFieldSelect
                            label="Show hints"
                            placeholder="Add field..."
                            options={deck.fields.map((f) => ({ value: f.id, label: f.name }))}
                            value={editShowHintFieldIds}
                            onChange={setEditShowHintFieldIds}
                          />
                          <div className="flex items-center pt-6">
                            <div className="w-5" />
                          </div>
                          <TokenFieldSelect
                            label="Answer hints"
                            placeholder="Add field..."
                            options={deck.fields.map((f) => ({ value: f.id, label: f.name }))}
                            value={editAskHintFieldIds}
                            onChange={setEditAskHintFieldIds}
                          />
                        </div>
                      </div>
                      {editQuestionTypeError && (
                        <p className="text-sm text-error">{editQuestionTypeError}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingQuestionTypeId(null);
                            setEditQuestionTypeError("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleUpdateQuestionType}>
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add new question type form */}
              {isAddingQuestionType && (
                <div className="border border-border rounded-lg p-3 space-y-4">
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start">
                    {/* Show field column */}
                    <div className="space-y-3">
                      <Select
                        label="Show field"
                        value={newShowFieldId}
                        onChange={(e) => setNewShowFieldId(e.target.value)}
                        placeholder="Select field..."
                        options={deck.fields.map((f) => ({
                          value: f.id,
                          label: f.name,
                        }))}
                      />
                      <div className="border-t border-border pt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Show TTS (optional)</p>
                        <Select
                          label="Language"
                          value={newShowTtsLang}
                          onChange={(e) => {
                            setNewShowTtsLang(e.target.value);
                            if (!e.target.value) {
                              setNewShowTtsFieldId("");
                              setNewShowTtsStopAt("");
                            }
                          }}
                          placeholder="None"
                          options={TTS_LANGUAGES.map((l) => ({
                            value: l.code,
                            label: l.label,
                          }))}
                        />
                        {newShowTtsLang && (
                          <>
                            <Select
                              label="Read field"
                              value={newShowTtsFieldId}
                              onChange={(e) => setNewShowTtsFieldId(e.target.value)}
                              placeholder="Select field..."
                              options={deck.fields.map((f) => ({
                                value: f.id,
                                label: f.name,
                              }))}
                            />
                            <Input
                              label="Stop at"
                              value={newShowTtsStopAt}
                              onChange={(e) => setNewShowTtsStopAt(e.target.value)}
                              placeholder="e.g. ,"
                            />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center pt-8">
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
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>

                    {/* Ask field column */}
                    <div className="space-y-3">
                      <Select
                        label="Ask field"
                        value={newAskFieldId}
                        onChange={(e) => setNewAskFieldId(e.target.value)}
                        placeholder="Select field..."
                        options={deck.fields.map((f) => ({
                          value: f.id,
                          label: f.name,
                        }))}
                      />
                      <div className="border-t border-border pt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Answer TTS (optional)</p>
                        <Select
                          label="Language"
                          value={newAskTtsLang}
                          onChange={(e) => {
                            setNewAskTtsLang(e.target.value);
                            if (!e.target.value) {
                              setNewAskTtsFieldId("");
                              setNewAskTtsStopAt("");
                            }
                          }}
                          placeholder="None"
                          options={TTS_LANGUAGES.map((l) => ({
                            value: l.code,
                            label: l.label,
                          }))}
                        />
                        {newAskTtsLang && (
                          <>
                            <Select
                              label="Read field"
                              value={newAskTtsFieldId}
                              onChange={(e) => setNewAskTtsFieldId(e.target.value)}
                              placeholder="Select field..."
                              options={deck.fields.map((f) => ({
                                value: f.id,
                                label: f.name,
                              }))}
                            />
                            <Input
                              label="Stop at"
                              value={newAskTtsStopAt}
                              onChange={(e) => setNewAskTtsStopAt(e.target.value)}
                              placeholder="e.g. ,"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Hints */}
                  <div className="border-t border-border pt-3">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start">
                      <TokenFieldSelect
                        label="Show hints (optional)"
                        placeholder="Add field..."
                        options={deck.fields.map((f) => ({ value: f.id, label: f.name }))}
                        value={newShowHintFieldIds}
                        onChange={setNewShowHintFieldIds}
                      />
                      <div className="flex items-center pt-6">
                        <div className="w-5" />
                      </div>
                      <TokenFieldSelect
                        label="Answer hints (optional)"
                        placeholder="Add field..."
                        options={deck.fields.map((f) => ({ value: f.id, label: f.name }))}
                        value={newAskHintFieldIds}
                        onChange={setNewAskHintFieldIds}
                      />
                    </div>
                  </div>
                  {/* Use as question / explanation checkboxes */}
                  <div className="border-t border-border pt-3 flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newUseAsQuestion}
                        onChange={(e) => setNewUseAsQuestion(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-foreground">Use as question</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newUseAsExplanation}
                        onChange={(e) => setNewUseAsExplanation(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-foreground">Use as explanation</span>
                    </label>
                  </div>
                  {questionTypeError && (
                    <p className="text-sm text-error">{questionTypeError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingQuestionType(false);
                        setQuestionTypeError("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddQuestionType}>
                      Add Question Type
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            Cards ({filteredCards.length}{tagFilter ? ` of ${deck._count.cards}` : ""})
          </h2>
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="text-sm border border-border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/decks/${id}/import`}>
            <Button variant="secondary">
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import CSV
            </Button>
          </Link>
          <Button onClick={() => setIsAddCardModalOpen(true)}>
            <svg
              className="w-5 h-5 mr-1"
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
            Add Card
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted mb-4">No cards in this deck yet</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => setIsAddCardModalOpen(true)}>
                  Add Card Manually
                </Button>
                <Link href={`/admin/decks/${id}/import`}>
                  <Button variant="secondary">Import from CSV</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredCards.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted mb-4">No cards match the selected tag</p>
              <Button variant="outline" onClick={() => setTagFilter("")}>
                Clear filter
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted w-16">
                  #
                </th>
                {deck.fields.map((field) => (
                  <th
                    key={field.id}
                    className="text-left py-3 px-4 text-sm font-medium text-muted"
                  >
                    {field.name}
                  </th>
                ))}
                <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                  Tags
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card, index) => (
                <tr
                  key={card.id}
                  className="border-b border-border hover:bg-secondary/50"
                >
                  <td className="py-3 px-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="w-6 text-center">{card.position + 1}</span>
                      <div className="flex flex-row">
                        <button
                          onClick={() => handleReorderCard(card.id, "up")}
                          disabled={index === 0 || !!tagFilter}
                          className="p-0.5 hover:bg-secondary rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title={tagFilter ? "Clear filter to reorder" : "Move up"}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleReorderCard(card.id, "down")}
                          disabled={index === filteredCards.length - 1 || !!tagFilter}
                          className="p-0.5 hover:bg-secondary rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title={tagFilter ? "Clear filter to reorder" : "Move down"}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                  {deck.fields.map((field) => (
                    <td
                      key={field.id}
                      className="py-3 px-4 text-sm text-foreground"
                    >
                      {getFieldValue(card, field.id) || (
                        <span className="text-muted italic">Empty</span>
                      )}
                    </td>
                  ))}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {card.tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t.length > 0)
                        .map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-0.5 text-xs bg-secondary rounded-full text-muted-foreground cursor-pointer hover:bg-primary/20"
                            onClick={() => setTagFilter(tag)}
                          >
                            {tag}
                          </span>
                        ))}
                      {!card.tags.trim() && (
                        <span className="text-muted italic text-sm">-</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCard(card.id)}
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Deck"
        size="lg"
      >
        <DeckForm
          initialData={{
            name: deck.name,
            description: deck.description,
            fields: deck.fields,
          }}
          onSubmit={handleUpdateDeck}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        title="Add Card"
        size="md"
      >
        <form onSubmit={handleAddCard} className="space-y-4">
          {deck.fields.map((field) => (
            <Input
              key={field.id}
              label={field.name}
              value={cardFormValues[field.id] || ""}
              onChange={(e) =>
                setCardFormValues({
                  ...cardFormValues,
                  [field.id]: e.target.value,
                })
              }
              placeholder={`Enter ${field.name.toLowerCase()}...`}
            />
          ))}
          <Input
            label="Tags"
            value={cardFormValues["_tags"] || ""}
            onChange={(e) =>
              setCardFormValues({
                ...cardFormValues,
                ["_tags"]: e.target.value,
              })
            }
            placeholder="Comma-separated tags (e.g., verbs, chapter1)"
            helperText="Tags are for organizing and filtering cards"
          />
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddCardModalOpen(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} fullWidth>
              Add Card
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
