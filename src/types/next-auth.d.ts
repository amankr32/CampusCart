import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    isAdmin: boolean;
    studentStatus?: string;
    trustScore?: number;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      isAdmin: boolean;
      studentStatus?: string;
      trustScore?: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    isAdmin: boolean;
    studentStatus?: string;
    trustScore?: number;
  }
}
