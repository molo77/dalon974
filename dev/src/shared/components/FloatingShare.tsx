"use client";

import { useState, useEffect } from "react";
import SocialShare from "./SocialShare";

interface FloatingShareProps {
  url?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  showAfterScroll?: number;
}

export default function FloatingShare({
  url = typeof window !== "undefined" ? window.location.href : "",
  title = "RodColoc - Colocation à La Réunion",
  description = "Trouvez votre colocataire idéal à La Réunion",
  hashtags = ["RodColoc", "Colocation", "LaReunion", "974"],
  showAfterScroll = 300
}: FloatingShareProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollTop > showAfterScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showAfterScroll]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded ? (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Partager</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <SocialShare
            url={url}
            title={title}
            description={description}
            hashtags={hashtags}
            variant="compact"
            showLabels={false}
            className="gap-2"
          />
        </div>
      ) : null}
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110"
        aria-label="Partager"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      </button>
    </div>
  );
}
