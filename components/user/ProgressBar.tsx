"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted">{label}</span>
          <span className="text-foreground font-medium">
            {current} / {total}
          </span>
        </div>
      )}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
