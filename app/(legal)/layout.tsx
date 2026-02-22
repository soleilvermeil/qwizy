import Link from "next/link";
import { Footer } from "@/components/layout/Footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary hover:text-primary-hover transition-colors font-medium"
          >
            &larr; Back to Qwizy!
          </Link>
        </div>
        <article className="prose-legal space-y-8">{children}</article>
      </div>
      <Footer />
    </main>
  );
}
