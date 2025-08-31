import { auth } from "@/lib/auth";

// @ts-expect-error - NextAuth v5 export issue
export const { GET, POST } = auth;
