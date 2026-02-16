import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/auth/registration-status - Check if self-registration is allowed (public)
export async function GET() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });
    const allowed = settings?.allowSelfRegistration ?? true;
    return NextResponse.json({ allowed });
  } catch {
    return NextResponse.json({ allowed: true });
  }
}
