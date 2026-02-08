import { RegisterForm } from "@/components/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-2xl font-bold text-primary">Open Duolingo</h1>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>
              Start your learning journey today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
