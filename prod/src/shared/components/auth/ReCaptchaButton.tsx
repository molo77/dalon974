"use client";

import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useState, useCallback } from "react";

interface ReCaptchaButtonProps {
  children: React.ReactNode;
  onClick: (token: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

export default function ReCaptchaButton({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: ReCaptchaButtonProps) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (!executeRecaptcha) {
      console.warn("reCAPTCHA n'est pas disponible");
      return;
    }

    setIsLoading(true);
    try {
      const token = await executeRecaptcha("login");
      await onClick(token);
    } catch (error) {
      console.error("Erreur reCAPTCHA:", error);
    } finally {
      setIsLoading(false);
    }
  }, [executeRecaptcha, onClick]);

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? "Vérification..." : children}
    </button>
  );
}

