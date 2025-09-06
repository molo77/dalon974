import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/infrastructure/database/prismaClient";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import AzureAD from "next-auth/providers/azure-ad";
import Email from "next-auth/providers/email";
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

const config = {
  // Adaptateur Prisma pour le provider Email
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" as const },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const emailInput = credentials?.email || "";
        const password = credentials?.password || "";
        const email = (emailInput as string).toLowerCase().trim();
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

        const user = await prisma.user.findUnique({ where: { email: email as string } });
        if (!user || !user.password) {
          // échec: incrémente compteur
          const cur = attempts.get(k);
          if (!cur) attempts.set(k, { count: 1, firstAt: now });
          else cur.count += 1;
          await new Promise(r => setTimeout(r, 300)); // tarpit léger
          return null;
        }
        // @ts-expect-error - password type issue
        const ok = await compare(password, user.password || '');
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
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
    })] : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? [Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
    })] : []),
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET ? [AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
    })] : []),
    ...(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_HOST !== "disabled" ? [Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT ? parseInt(process.env.EMAIL_SERVER_PORT) : 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
        // Options SSL pour éviter les erreurs de certificats auto-signés
        secure: process.env.EMAIL_SERVER_PORT === "465", // true pour 465, false pour 587
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === "production", // Ignorer les certificats auto-signés en dev
          ciphers: "SSLv3",
        },
        ignoreTLS: process.env.NODE_ENV !== "production", // Ignorer TLS en dev si nécessaire
      },
      from: process.env.EMAIL_FROM,
    })] : []),
  ],
  pages: { 
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      // Exige un email pour toute connexion
      const email = (user?.email || (profile as any)?.email || "").toLowerCase().trim();
      if (!email) return false;

      // Pour Google, n'autorise que si email vérifié
      if (account?.provider === "google") {
        const verified = (profile as any)?.email_verified;
        if (verified !== true) return false;
      }

      // Option: promouvoir automatiquement certains emails en admin (liste séparée par des virgules)
      try {
        const admins = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
        const emailLower = email.toLowerCase();
        if (admins.includes(emailLower)) {
          await prisma.user.update({ where: { email: emailLower }, data: { role: "admin" } });
          (user as any).role = "admin";
        }
      } catch {}
      return true;
    },
    async session({ session, token, user }: any) {
      if (session.user) {
        (session.user as any).id = (token as any)?.sub || user?.id;
        (session.user as any).role = (token as any)?.role || (user as any)?.role || null;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      // Toujours resynchroniser le rôle depuis la DB pour refléter les changements récents
      if (token.sub) {
        try {
          const u = await prisma.user.findUnique({ where: { id: token.sub }, select: { role: true } });
          token.role = (u?.role as any) ?? ((user as any)?.role ?? token.role ?? null);
        } catch {
          token.role = (user as any)?.role ?? token.role ?? null;
        }
      } else if (user) {
        token.role = (user as any)?.role ?? token.role ?? null;
      }
      return token as any;
    },
  },
  debug: process.env.NODE_ENV !== "production" ? false : false,
  secret: process.env.NEXTAUTH_SECRET,
};

export const { auth, signIn, signOut, handlers } = NextAuth(config);
