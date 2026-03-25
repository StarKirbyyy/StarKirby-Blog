import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

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
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? "user";
        session.user.status = user.status ?? "active";
      }
      return session;
    },
  },
};
