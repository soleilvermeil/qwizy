"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button, Select, Card, CardContent, Modal, ModalFooter } from "@/components/ui";
import {
  parseCSV,
  detectSeparator,
  getSeparatorLabel,
  type Separator,
  type ParseResult,
} from "@/lib/csv-parser";

interface Field {
  id: string;
  name: string;
  position: number;
}

interface CardData {
  values: { fieldId: string; value: string }[];
  tags?: string;
}

type DuplicateStrategy =
  | "keep_first_merge_tags"
  | "keep_last_merge_tags"
  | "keep_first"
  | "keep_last"
  | "keep_all";

interface CSVImporterProps {
  fields: Field[];
  onImport: (cards: CardData[]) => Promise<void>;
  onCancel: () => void;
}

export function CSVImporter({ fields, onImport, onCancel }: CSVImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [separator, setSeparator] = useState<Separator>(",");
  const [hasHeaders, setHasHeaders] = useState(true);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [tagColumns, setTagColumns] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingCards, setPendingCards] = useState<CardData[] | null>(null);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>("keep_first_merge_tags");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setError("");

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;

        // Auto-detect separator
        const detectedSeparator = detectSeparator(content);
        setSeparator(detectedSeparator);
        setHasHeaders(true);

        // Parse immediately to set up column mapping
        const result = parseCSV(content, {
          separator: detectedSeparator,
          hasHeaders: true,
        });

        // Auto-map columns to fields if headers match
        const mapping: Record<string, string> = {};
        fields.forEach((field) => {
          const matchingColumn = result.headers.findIndex(
            (h) => h.toLowerCase() === field.name.toLowerCase()
          );
          if (matchingColumn !== -1) {
            mapping[field.id] = matchingColumn.toString();
          }
        });
        setColumnMapping(mapping);

        // Set fileContent last — the useEffect will trigger the parse
        setFileContent(content);
      };
      reader.onerror = () => {
        setError("Failed to read file");
      };
      reader.readAsText(file);
    },
    [fields]
  );

  // Re-parse automatically whenever CSV settings change
  useEffect(() => {
    if (!fileContent) return;

    const result = parseCSV(fileContent, {
      separator,
      hasHeaders,
    });
    setParseResult(result);
  }, [fileContent, separator, hasHeaders]);

  // Build a dedup key from a card's field values (ignoring tags)
  const getCardKey = (card: CardData): string => {
    return card.values
      .map((v) => `${v.fieldId}:${v.value.trim().toLowerCase()}`)
      .sort()
      .join("|");
  };

  // Merge tags from two comma-separated tag strings, deduplicating
  const mergeTags = (a?: string, b?: string): string => {
    const set = new Set<string>();
    [a, b].forEach((str) => {
      if (str) {
        str.split(",").forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).join(", ");
  };

  const deduplicateCards = (cards: CardData[], strategy: DuplicateStrategy): CardData[] => {
    if (strategy === "keep_all") return cards;

    const keepLast = strategy === "keep_last" || strategy === "keep_last_merge_tags";
    const shouldMergeTags = strategy === "keep_first_merge_tags" || strategy === "keep_last_merge_tags";

    const map = new Map<string, CardData>();

    for (const card of cards) {
      const key = getCardKey(card);
      const existing = map.get(key);

      if (!existing) {
        map.set(key, { ...card });
      } else if (keepLast) {
        map.set(key, {
          ...card,
          tags: shouldMergeTags ? mergeTags(existing.tags, card.tags) : card.tags,
        });
      } else {
        // keep first
        if (shouldMergeTags) {
          map.set(key, {
            ...existing,
            tags: mergeTags(existing.tags, card.tags),
          });
        }
        // else: keep first as-is, do nothing
      }
    }

    return Array.from(map.values());
  };

  const buildCards = (): CardData[] => {
    if (!parseResult) return [];
    return parseResult.rows.map((row) => {
      const values = fields
        .filter((field) => columnMapping[field.id])
        .map((field) => ({
          fieldId: field.id,
          value: row[parseInt(columnMapping[field.id])] || "",
        }));

      const tagsArray: string[] = [];
      tagColumns.forEach((colIndex) => {
        const tagValue = row[colIndex]?.trim();
        if (tagValue) {
          tagValue.split(",").forEach((t) => {
            const trimmed = t.trim();
            if (trimmed) {
              tagsArray.push(trimmed);
            }
          });
        }
      });
      const tags = tagsArray.join(", ");

      return { values, tags };
    });
  };

  const countDuplicates = (cards: CardData[]): number => {
    const seen = new Set<string>();
    let dupes = 0;
    for (const card of cards) {
      const key = getCardKey(card);
      if (seen.has(key)) {
        dupes++;
      } else {
        seen.add(key);
      }
    }
    return dupes;
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.rows.length === 0) {
      setError("No data to import");
      return;
    }

    setError("");
    const cards = buildCards();

    // Check for duplicates
    const dupes = countDuplicates(cards);
    if (dupes > 0) {
      setPendingCards(cards);
      setDuplicateCount(dupes);
      setDuplicateStrategy("keep_first_merge_tags");
      setShowDuplicateModal(true);
      return;
    }

    // No duplicates — import directly
    setIsLoading(true);
    try {
      await onImport(cards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateConfirm = async () => {
    if (!pendingCards) return;
    setShowDuplicateModal(false);
    setIsLoading(true);
    setError("");

    try {
      const dedupedCards = deduplicateCards(pendingCards, duplicateStrategy);
      await onImport(dedupedCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsLoading(false);
      setPendingCards(null);
    }
  };

  const separatorOptions = [
    { value: ",", label: getSeparatorLabel(",") },
    { value: ";", label: getSeparatorLabel(";") },
    { value: "\t", label: getSeparatorLabel("\t") },
    { value: "|", label: getSeparatorLabel("|") },
  ];

  // Build a descriptive label for a column, sampling row values when there's no header
  const getColumnLabel = useCallback(
    (header: string, colIndex: number) => {
      // When headers are enabled, use the actual header text
      if (hasHeaders) return header || `Column ${colIndex + 1}`;

      // No headers — show sample values from the rows
      if (!parseResult || parseResult.rows.length === 0) return `Column ${colIndex + 1}`;

      const samples: string[] = [];
      for (let r = 0; r < Math.min(parseResult.rows.length, 5); r++) {
        const val = parseResult.rows[r][colIndex]?.trim();
        if (val) samples.push(val);
      }

      if (samples.length === 0) return `Column ${colIndex + 1}`;

      const preview = samples.join(", ");
      const truncated = preview.length > 40 ? preview.slice(0, 40) + "..." : preview + ", ...";
      return `Column ${colIndex + 1} (${truncated})`;
    },
    [hasHeaders, parseResult]
  );

  const columnOptions = parseResult
    ? [
        { value: "", label: "-- Skip --" },
        ...parseResult.headers.map((h, i) => ({
          value: i.toString(),
          label: getColumnLabel(h, i),
        })),
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.tsv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors"
        >
          {fileName ? (
            <div>
              <svg
                className="w-8 h-8 mx-auto mb-2 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-medium text-foreground">{fileName}</p>
              <p className="text-sm text-muted mt-1">Click to select a different file</p>
            </div>
          ) : (
            <div>
              <svg
                className="w-8 h-8 mx-auto mb-2 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="font-medium text-foreground">Click to select a CSV file</p>
              <p className="text-sm text-muted mt-1">or drag and drop</p>
            </div>
          )}
        </div>
      </div>

      {fileContent && (
        <>
          {/* Parser Settings */}
          <Card>
            <CardContent>
              <h3 className="font-medium text-foreground mb-4">CSV Settings</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Separator"
                  options={separatorOptions}
                  value={separator}
                  onChange={(e) => {
                    setSeparator(e.target.value as Separator);
                  }}
                />
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    First Row
                  </label>
                  <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHeaders}
                      onChange={(e) => {
                        setHasHeaders(e.target.checked);
                      }}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">Contains headers</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Column Mapping */}
          {parseResult && (
            <Card>
              <CardContent>
                <h3 className="font-medium text-foreground mb-4">
                  Map Columns to Fields
                </h3>
                <div className="space-y-3">
                  {fields.map((field) => (
                    <Select
                      key={field.id}
                      label={field.name}
                      options={columnOptions}
                      value={columnMapping[field.id] || ""}
                      onChange={(e) =>
                        setColumnMapping({
                          ...columnMapping,
                          [field.id]: e.target.value,
                        })
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tag Columns */}
          {parseResult && (
            <Card>
              <CardContent>
                <h3 className="font-medium text-foreground mb-2">
                  Tag Columns (Optional)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select columns to use as tags. Tags help organize and filter cards.
                </p>
                <div className="space-y-2">
                  {parseResult.headers.map((header, index) => (
                    <label key={index} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tagColumns.has(index)}
                        onChange={(e) => {
                          const newTagColumns = new Set(tagColumns);
                          if (e.target.checked) {
                            newTagColumns.add(index);
                          } else {
                            newTagColumns.delete(index);
                          }
                          setTagColumns(newTagColumns);
                        }}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-foreground">
                        {getColumnLabel(header, index)}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {parseResult && parseResult.rows.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="font-medium text-foreground mb-4">
                  Preview (first 5 rows of {parseResult.rows.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {parseResult.headers.map((header, i) => (
                          <th
                            key={i}
                            className="text-left py-2 px-3 text-muted font-medium"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-border">
                          {row.map((cell, j) => (
                            <td key={j} className="py-2 px-3 text-foreground">
                              {cell || <span className="text-muted italic">Empty</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-error/10 text-error text-sm">{error}</div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          isLoading={isLoading}
          disabled={!parseResult || parseResult.rows.length === 0}
          fullWidth
        >
          Import {parseResult?.rows.length || 0} Cards
        </Button>
      </div>

      {/* Duplicate Handling Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="Duplicates Detected"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Found <strong className="text-foreground">{duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""}</strong> out of {pendingCards?.length || 0} rows (based on field values, ignoring tags).
          </p>
          <p className="text-sm text-muted-foreground">
            How would you like to handle them?
          </p>
          <div className="space-y-2">
            {([
              { value: "keep_first_merge_tags", label: "Keep first occurrence, merge tags", desc: "Keeps the first row's values and combines tags from all duplicates." },
              { value: "keep_last_merge_tags", label: "Keep last occurrence, merge tags", desc: "Keeps the last row's values and combines tags from all duplicates." },
              { value: "keep_first", label: "Keep first occurrence only", desc: "Keeps the first row and discards later duplicates entirely." },
              { value: "keep_last", label: "Keep last occurrence only", desc: "Keeps the last row and discards earlier duplicates entirely." },
              { value: "keep_all", label: "Keep all (not recommended)", desc: "Imports every row including duplicates." },
            ] as const).map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  duplicateStrategy === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="duplicateStrategy"
                  value={option.value}
                  checked={duplicateStrategy === option.value}
                  onChange={() => setDuplicateStrategy(option.value)}
                  className="mt-0.5 w-4 h-4 text-primary focus:ring-primary"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
          {pendingCards && (
            <p className="text-sm text-muted-foreground">
              Result: <strong className="text-foreground">
                {duplicateStrategy === "keep_all"
                  ? pendingCards.length
                  : pendingCards.length - duplicateCount}
              </strong> cards will be imported.
            </p>
          )}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDuplicateModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleDuplicateConfirm}>
            Import
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
