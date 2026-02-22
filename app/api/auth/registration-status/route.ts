import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/auth/registration-status - Check if registration is allowed (public)
export async function GET() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });
    return NextResponse.json({
      allowed: settings?.allowSelfRegistration ?? true,
      teacherAllowed: settings?.allowTeacherRegistration ?? false,
    });
  } catch {
    return NextResponse.json({ allowed: true, teacherAllowed: false });
  }
}
