import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const key = new TextEncoder().encode(SECRET_KEY);

const COOKIE_NAME = "session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export interface SessionPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
  expiresAt: Date;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload, expiresAt: payload.expiresAt.toISOString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });

    return {
      userId: payload.userId as string,
      username: payload.username as string,
      isAdmin: payload.isAdmin as boolean,
      expiresAt: new Date(payload.expiresAt as string),
    };
  } catch {
    return null;
  }
}

export async function createSession(user: {
  id: string;
  username: string;
  isAdmin: boolean;
}): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session: SessionPayload = {
    userId: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
    expiresAt,
  };

  const token = await encrypt(session);
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return decrypt(token);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function updateSession(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await decrypt(token);
  if (!session) {
    return null;
  }

  // Refresh the session if it's about to expire (less than 1 day left)
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  if (expiresAt < oneDayFromNow) {
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newToken = await encrypt(session);
    
    const response = NextResponse.next();
    response.cookies.set(COOKIE_NAME, newToken, COOKIE_OPTIONS);
    return response;
  }

  return null;
}

export function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return Promise.resolve(null);
  }
  return decrypt(token);
}
