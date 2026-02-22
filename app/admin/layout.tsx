import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { getUserNavItems } from "@/lib/user-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.isAdmin && session.accountType !== "TEACHER") {
    redirect("/decks");
  }

  const navItems = getUserNavItems(session.isAdmin, session.accountType);

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <Header user={{ username: session.username, isAdmin: session.isAdmin, accountType: session.accountType }} />
      <Navigation items={navItems} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Footer />
      <MobileNav items={navItems} />
    </div>
  );
}
