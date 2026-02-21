import { RegisterForm } from "@/components/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function RegisterPage() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
  });
  const registrationAllowed = settings?.allowSelfRegistration ?? true;

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary">Qwizy!</h1>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {registrationAllowed ? "Create an account" : "Registration Disabled"}
              </CardTitle>
              <CardDescription>
                {registrationAllowed
                  ? "Start your learning journey today"
                  : "Registration is currently disabled. Please contact your administrator."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {registrationAllowed ? (
                <RegisterForm />
              ) : (
                <div className="text-center py-4">
                  <Link href="/login" className="text-primary hover:underline">
                    Go to Login
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </main>
  );
}
