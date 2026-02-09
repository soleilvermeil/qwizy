import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-6 text-center text-sm text-muted border-t border-border">
      <p className="mb-2">Open source flashcard learning platform</p>
      <div className="flex items-center justify-center gap-4">
        <Link
          href="/legal-notice"
          className="hover:text-foreground transition-colors"
        >
          Legal Notice
        </Link>
        <span className="text-border">|</span>
        <Link
          href="/privacy-policy"
          className="hover:text-foreground transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
