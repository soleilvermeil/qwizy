"use client";

export type QuizChoiceState =
  | "neutral"
  | "correct-selected"
  | "distractor-avoided"
  | "distractor-clicked"
  | "correct-missed";

interface QuizChoiceButtonProps {
  label: string;
  state: QuizChoiceState;
  onClick: () => void;
  disabled: boolean;
}

const stateStyles: Record<QuizChoiceState, string> = {
  neutral:
    "border-2 border-border bg-card-bg text-foreground hover:border-primary hover:bg-primary/5 active:bg-primary/10",
  "correct-selected":
    "border-2 border-success bg-success/15 text-success font-semibold",
  "distractor-avoided":
    "border-2 border-border bg-secondary text-muted opacity-60",
  "distractor-clicked":
    "border-2 border-error bg-error/15 text-error font-semibold",
  "correct-missed":
    "border-2 border-success bg-success/10 text-success ring-2 ring-success/30",
};

export function QuizChoiceButton({
  label,
  state,
  onClick,
  disabled,
}: QuizChoiceButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2.5 rounded-lg text-base
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring
        disabled:cursor-not-allowed
        ${stateStyles[state]}
      `}
    >
      {label}
    </button>
  );
}
