"use client";

import { useState, useCallback } from "react";

interface ShareOptions {
  url?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
}

export function useSocialShare(defaultOptions: ShareOptions = {}) {
  const [isSharing, setIsSharing] = useState(false);
  const [lastShared, setLastShared] = useState<string | null>(null);

  const share = useCallback(async (platform: string, options: ShareOptions = {}) => {
    const shareOptions = { ...defaultOptions, ...options };
    const { url, title, description, hashtags = [] } = shareOptions;

    setIsSharing(true);
    setLastShared(platform);

    try {
      const encodedUrl = encodeURIComponent(url || window.location.href);
      const encodedTitle = encodeURIComponent(title || "RodColoc - Colocation à La Réunion");
      const encodedDescription = encodeURIComponent(description || "Trouvez votre colocataire idéal à La Réunion");
      const encodedHashtags = hashtags.map(tag => `%23${tag}`).join("");

      let shareUrl = "";

      switch (platform) {
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
          break;
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=${encodedHashtags}`;
          break;
        case "linkedin":
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
          break;
        case "whatsapp":
          shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
          break;
        case "telegram":
          shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
          break;
        case "email":
          shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
          break;
        default:
          throw new Error(`Plateforme non supportée: ${platform}`);
      }

      if (platform === "email") {
        window.location.href = shareUrl;
      } else {
        const width = 600;
        const height = 400;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        window.open(
          shareUrl,
          `share-${platform}`,
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );
      }

      // Analytics tracking (à implémenter si nécessaire)
      // trackEvent('social_share', { platform, url, title });

    } catch (error) {
      console.error("Erreur lors du partage:", error);
    } finally {
      setIsSharing(false);
      setTimeout(() => setLastShared(null), 2000);
    }
  }, [defaultOptions]);

  const copyToClipboard = useCallback(async (options: ShareOptions = {}) => {
    const shareOptions = { ...defaultOptions, ...options };
    const { url } = shareOptions;
    
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      setLastShared("clipboard");
      setTimeout(() => setLastShared(null), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
    }
  }, [defaultOptions]);

  const shareToNative = useCallback(async (options: ShareOptions = {}) => {
    const shareOptions = { ...defaultOptions, ...options };
    const { title, description, url } = shareOptions;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "RodColoc - Colocation à La Réunion",
          text: description || "Trouvez votre colocataire idéal à La Réunion",
          url: url || window.location.href,
        });
        setLastShared("native");
        setTimeout(() => setLastShared(null), 2000);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Erreur lors du partage natif:", error);
        }
      }
    } else {
      // Fallback vers le partage par email
      share("email", options);
    }
  }, [defaultOptions, share]);

  return {
    share,
    copyToClipboard,
    shareToNative,
    isSharing,
    lastShared,
  };
}
