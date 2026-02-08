import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui";

export default async function Home() {
  const session = await getSession();
  
  if (session) {
    redirect(session.isAdmin ? "/admin/decks" : "/decks");
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Open Duolingo
            </h1>
            <p className="text-lg text-muted">
              Master anything with spaced repetition flashcards
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/register" className="block">
              <Button fullWidth size="lg">
                Get Started
              </Button>
            </Link>
            <Link href="/login" className="block">
              <Button fullWidth size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-secondary">
              <div className="text-2xl font-bold text-primary">SM-2</div>
              <div className="text-xs text-muted mt-1">Algorithm</div>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <div className="text-2xl font-bold text-primary">Custom</div>
              <div className="text-xs text-muted mt-1">Decks</div>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <div className="text-2xl font-bold text-primary">CSV</div>
              <div className="text-xs text-muted mt-1">Import</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted border-t border-border">
        <p>Open source flashcard learning platform</p>
      </footer>
    </main>
  );
}
