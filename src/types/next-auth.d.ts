import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: "user" | "admin";
      status?: "active" | "disabled";
    };
  }

  interface User extends DefaultUser {
    role?: "user" | "admin";
    status?: "active" | "disabled";
  }
}
