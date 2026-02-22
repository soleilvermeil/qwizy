import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { RegisterPageClient } from "./RegisterPageClient";

export default async function RegisterPage() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
  });
  const personalAllowed = settings?.allowSelfRegistration ?? true;
  const teacherAllowed = settings?.allowTeacherRegistration ?? false;
  const anyAllowed = personalAllowed || teacherAllowed;

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
                {anyAllowed ? "Create an account" : "Registration Disabled"}
              </CardTitle>
              <CardDescription>
                {anyAllowed
                  ? "Start your learning journey today"
                  : "Registration is currently disabled. Please contact your administrator."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {anyAllowed ? (
                <RegisterPageClient
                  personalAllowed={personalAllowed}
                  teacherAllowed={teacherAllowed}
                />
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
