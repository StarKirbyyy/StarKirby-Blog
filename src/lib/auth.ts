import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getAdminEmailSet() {
  const raw = process.env.ADMIN_EMAILS ?? process.env.AUTH_ADMIN_EMAILS ?? "";
  if (!raw.trim()) return new Set<string>();
  return new Set(
    raw
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map(normalizeEmail),
  );
}

const adminEmailSet = getAdminEmailSet();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "database",
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? process.env.AUTH_GITHUB_ID ?? "",
      clientSecret:
        process.env.GITHUB_SECRET ?? process.env.AUTH_GITHUB_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email ? normalizeEmail(user.email) : "";
      if (!email) return true;

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { status: true },
      });

      if (existing?.status === "disabled") {
        return false;
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? "user";
        session.user.status = user.status ?? "active";
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      const email = user.email ? normalizeEmail(user.email) : "";
      if (!email || !user.id) return;
      if (!adminEmailSet.has(email)) return;

      await prisma.user.update({
        where: { id: user.id },
        data: { role: "admin" },
      });
    },
  },
};
