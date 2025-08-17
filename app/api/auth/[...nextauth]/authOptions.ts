import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prismaClient";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AzureADProvider from "next-auth/providers/azure-ad";
import { compare } from "bcrypt";

// Limiteur bruteforce en mémoire (par IP+email) – TTL simple
type Attempt = { count: number; firstAt: number };
const attempts = new Map<string, Attempt>();
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 5; // avant lock
function keyFor(ip: string, email: string) {
  return `${ip}|${email}`;
}
function getIpFromHeaders(h: Record<string, string | string[] | undefined>) {
  const xf = (h["x-forwarded-for"] || h["X-Forwarded-For"]) as string | string[] | undefined;
  const raw = Array.isArray(xf) ? xf[0] : xf;
  return (raw?.split(",")[0] || "unknown").trim();
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "database" },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const emailInput = credentials?.email || "";
        const password = credentials?.password || "";
        const email = emailInput.toLowerCase().trim();
        if (!email || !password) return null;

        // Rate limit par IP+email
        const ip = getIpFromHeaders((req?.headers as any) || {});
        const k = keyFor(ip, email);
        const now = Date.now();
        const a = attempts.get(k);
        if (a) {
          if (now - a.firstAt > WINDOW_MS) {
            attempts.delete(k);
          } else if (a.count >= MAX_ATTEMPTS) {
            // Petite latence pour ralentir
            await new Promise(r => setTimeout(r, 500));
            return null;
          }
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
          // échec: incrémente compteur
          const cur = attempts.get(k);
          if (!cur) attempts.set(k, { count: 1, firstAt: now });
          else cur.count += 1;
          await new Promise(r => setTimeout(r, 300)); // tarpit léger
          return null;
        }
        const ok = await compare(password, user.password);
        if (!ok) {
          const cur = attempts.get(k);
          if (!cur) attempts.set(k, { count: 1, firstAt: now });
          else cur.count += 1;
          await new Promise(r => setTimeout(r, 300));
          return null;
        }
        // succès: reset compteur
        attempts.delete(k);
        return { id: user.id, email: user.email, name: user.name, role: user.role } as any;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Exige un email pour toute connexion
      const email = (user?.email || (profile as any)?.email || "").toLowerCase().trim();
      if (!email) return false;

      // Pour Google, n'autorise que si email vérifié
      if (account?.provider === "google") {
        const verified = (profile as any)?.email_verified;
        if (verified !== true) return false;
      }

      return true;
    },
    async session({ session, user, token }) {
      if (session.user) {
        (session.user as any).id = user?.id || (token as any)?.sub;
        (session.user as any).role = (user as any)?.role || (token as any)?.role || null;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role || null;
      return token as any;
    },
  },
  debug: process.env.NODE_ENV !== "production" ? false : false,
};
