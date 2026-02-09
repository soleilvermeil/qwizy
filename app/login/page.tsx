import { LoginForm } from "@/components/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirect;

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary">Open Duolingo</h1>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>
                Sign in to your account to continue learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm redirectTo={redirectTo} />
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </main>
  );
}
