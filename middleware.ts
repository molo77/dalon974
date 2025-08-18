export { default } from "next-auth/middleware";

// Ne protège que les routes privées. Laisser /login et les pages publiques accessibles.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};