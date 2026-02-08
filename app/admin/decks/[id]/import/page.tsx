"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { CSVImporter } from "@/components/admin/CSVImporter";

interface Field {
  id: string;
  name: string;
  position: number;
}

interface Deck {
  id: string;
  name: string;
  fields: Field[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ImportPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const response = await fetch(`/api/decks/${id}`);
        if (!response.ok) throw new Error("Deck not found");
        const data = await response.json();
        setDeck(data.deck);
      } catch (error) {
        console.error("Error fetching deck:", error);
        router.push("/admin/decks");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeck();
  }, [id, router]);

  const handleImport = async (cards: { values: { fieldId: string; value: string }[]; tags?: string }[]) => {
    const response = await fetch(`/api/decks/${id}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Import failed");
    }

    router.push(`/admin/decks/${id}`);
  };

  if (isLoading || !deck) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/decks/${id}`}>
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
          <CardTitle>Import Cards to &quot;{deck.name}&quot;</CardTitle>
        </CardHeader>
        <CardContent>
          <CSVImporter
            fields={deck.fields}
            onImport={handleImport}
            onCancel={() => router.push(`/admin/decks/${id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
