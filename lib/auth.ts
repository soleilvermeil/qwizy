import bcrypt from "bcryptjs";
import { prisma } from "./db";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function authenticateUser(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return null;
  }

  // Allow passwordless login for admin with null password (initial setup)
  if (user.passwordHash === null) {
    // Only allow passwordless login if no password provided
    if (password === "") {
      return user;
    }
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}

export async function createUser(
  username: string,
  password: string,
  isAdmin: boolean = false
) {
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    throw new Error("Username already exists");
  }

  const hashedPassword = await hashPassword(password);

  return prisma.user.create({
    data: {
      username,
      passwordHash: hashedPassword,
      isAdmin,
    },
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      isAdmin: true,
      accountType: true,
      mustChangePassword: true,
      newCardsPerDay: true,
      newCardsPerDayLocked: true,
      createdAt: true,
    },
  });
}

export async function updateUserSettings(
  userId: string,
  settings: { newCardsPerDay?: number; password?: string }
) {
  const data: { newCardsPerDay?: number; passwordHash?: string } = {};

  if (settings.newCardsPerDay !== undefined) {
    data.newCardsPerDay = settings.newCardsPerDay;
  }

  if (settings.password) {
    data.passwordHash = await hashPassword(settings.password);
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      isAdmin: true,
      accountType: true,
      mustChangePassword: true,
      newCardsPerDay: true,
      newCardsPerDayLocked: true,
    },
  });
}
