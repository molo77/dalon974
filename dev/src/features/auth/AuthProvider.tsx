"use client";
import { SessionProvider } from "next-auth/react";
import React from "react";

function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={0} 
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}

export default AuthProvider;
export { AuthProvider };
