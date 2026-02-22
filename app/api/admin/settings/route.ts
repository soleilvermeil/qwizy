import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

async function getAppSettings() {
  let settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
  });
  if (!settings) {
    settings = await prisma.appSettings.create({
      data: { id: "singleton" },
    });
  }
  return settings;
}

// GET /api/admin/settings - Get app settings
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getAppSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update app settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { allowSelfRegistration, allowTeacherRegistration } = body;

    const data: { allowSelfRegistration?: boolean; allowTeacherRegistration?: boolean } = {};
    if (typeof allowSelfRegistration === "boolean") {
      data.allowSelfRegistration = allowSelfRegistration;
    }
    if (typeof allowTeacherRegistration === "boolean") {
      data.allowTeacherRegistration = allowTeacherRegistration;
    }

    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
