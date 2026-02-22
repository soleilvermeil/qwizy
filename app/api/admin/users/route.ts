import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { generateAppleStylePassword } from "@/lib/password-generator";

// GET /api/admin/users - List users with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const accountType = searchParams.get("accountType");
    const groupId = searchParams.get("groupId");

    const where: Record<string, unknown> = {
      isAdmin: false,
    };

    if (search) {
      where.username = { contains: search };
    }

    if (accountType) {
      where.accountType = accountType;
    }

    if (groupId) {
      where.groupMemberships = {
        some: { groupId },
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        accountType: true,
        mustChangePassword: true,
        newCardsPerDay: true,
        newCardsPerDayLocked: true,
        createdAt: true,
        groupMemberships: {
          select: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { username: "asc" },
    });

    const formatted = users.map((u) => ({
      ...u,
      groups: u.groupMemberships.map((m) => m.group),
      groupMemberships: undefined,
    }));

    return NextResponse.json({ users: formatted });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Mass create education users
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      usernames,
      passwordMode,
      uniquePassword,
      mustChangePassword = true,
      newCardsPerDay,
      newCardsPerDayLocked = false,
      groupIds = [],
    } = body as {
      usernames: string[];
      passwordMode: "unique" | "random";
      uniquePassword?: string;
      mustChangePassword: boolean;
      newCardsPerDay?: number;
      newCardsPerDayLocked?: boolean;
      groupIds?: string[];
    };

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json(
        { error: "At least one username is required" },
        { status: 400 }
      );
    }

    if (passwordMode === "unique" && (!uniquePassword || uniquePassword.length < 6)) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const created: { username: string; password: string }[] = [];
    const errors: { username: string; error: string }[] = [];

    for (const rawUsername of usernames) {
      const username = rawUsername.trim();
      if (!username || username.length < 3) {
        errors.push({ username: rawUsername, error: "Username must be at least 3 characters" });
        continue;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push({ username, error: "Invalid characters in username" });
        continue;
      }

      const existing = await prisma.user.findFirst({ where: { username: { equals: username, mode: "insensitive" } } });
      if (existing) {
        errors.push({ username, error: "Username already exists" });
        continue;
      }

      const password =
        passwordMode === "random"
          ? generateAppleStylePassword()
          : uniquePassword!;

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          username,
          passwordHash,
          accountType: "EDUCATION",
          mustChangePassword,
          newCardsPerDay: newCardsPerDay ?? 10,
          newCardsPerDayLocked,
        },
      });

      // Assign to groups and auto-enroll in mandatory decks
      for (const groupId of groupIds) {
        try {
          await prisma.studentGroupMember.create({
            data: {
              userId: user.id,
              groupId,
            },
          });

          // Auto-enroll in mandatory decks for this group
          const mandatoryDecks = await prisma.deckGroupAssignment.findMany({
            where: { groupId, mandatory: true },
            select: { deckId: true },
          });
          for (const { deckId } of mandatoryDecks) {
            await prisma.userDeck.upsert({
              where: { userId_deckId: { userId: user.id, deckId } },
              update: {},
              create: { userId: user.id, deckId },
            });
          }
        } catch {
          // Ignore if group doesn't exist or duplicate
        }
      }

      created.push({ username, password });
    }

    return NextResponse.json({ created, errors }, { status: 201 });
  } catch (error) {
    console.error("Error creating users:", error);
    return NextResponse.json(
      { error: "Failed to create users" },
      { status: 500 }
    );
  }
}
