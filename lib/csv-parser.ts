export type Separator = "," | ";" | "\t" | "|";

export interface ParseOptions {
  separator: Separator;
  hasHeaders: boolean;
}

export interface ParseResult {
  headers: string[];
  rows: string[][];
  columnCount: number;
}

export function parseCSV(content: string, options: ParseOptions): ParseResult {
  const { separator, hasHeaders } = options;
  
  // Split into lines and filter empty lines
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], columnCount: 0 };
  }

  // Parse each line into columns
  const allRows = lines.map((line) => parseLine(line, separator));
  
  // Determine column count (max columns in any row)
  const columnCount = Math.max(...allRows.map((row) => row.length));

  // Normalize rows to have the same number of columns
  const normalizedRows = allRows.map((row) => {
    while (row.length < columnCount) {
      row.push("");
    }
    return row;
  });

  // Extract headers if present
  let headers: string[];
  let rows: string[][];

  if (hasHeaders && normalizedRows.length > 0) {
    headers = normalizedRows[0];
    rows = normalizedRows.slice(1);
  } else {
    // Generate default headers (Column 1, Column 2, etc.)
    headers = Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`);
    rows = normalizedRows;
  }

  return { headers, rows, columnCount };
}

function parseLine(line: string, separator: Separator): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === separator) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  // Don't forget the last field
  result.push(current.trim());

  return result;
}

export function detectSeparator(content: string): Separator {
  const firstLine = content.split(/\r?\n/)[0] || "";
  
  const counts: Record<Separator, number> = {
    ",": 0,
    ";": 0,
    "\t": 0,
    "|": 0,
  };

  for (const char of firstLine) {
    if (char in counts) {
      counts[char as Separator]++;
    }
  }

  // Return the separator with the highest count
  let maxSeparator: Separator = ",";
  let maxCount = counts[","];

  for (const [sep, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxSeparator = sep as Separator;
      maxCount = count;
    }
  }

  return maxSeparator;
}

export function getSeparatorLabel(separator: Separator): string {
  switch (separator) {
    case ",":
      return "Comma (,)";
    case ";":
      return "Semicolon (;)";
    case "\t":
      return "Tab";
    case "|":
      return "Pipe (|)";
  }
}
