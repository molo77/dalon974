import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname || "";
      // Admin uniquement pour /admin
      if (path.startsWith("/admin")) return token?.role === "admin";
      // Auth requis pour /dashboard
      if (path.startsWith("/dashboard")) return !!token;
      return true;
    },
  },
});

// Protéger uniquement les routes privées.
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};