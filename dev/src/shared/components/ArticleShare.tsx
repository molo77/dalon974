"use client";

import { useState } from "react";
import SocialShare from "./SocialShare";

interface ArticleShareProps {
  url?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  className?: string;
}

export default function ArticleShare({
  url = typeof window !== "undefined" ? window.location.href : "",
  title = "Actualité - RodColoc",
  description = "Actualité sur la colocation à La Réunion",
  hashtags = ["RodColoc", "Colocation", "LaReunion", "974", "Actualité"],
  className = ""
}: ArticleShareProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/50 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Partager cet article</h3>
            <p className="text-xs text-slate-600">Aidez d'autres personnes à le découvrir</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors duration-200"
          aria-label={isExpanded ? "Fermer" : "Ouvrir le partage"}
        >
          <svg 
            className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200">
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
      )}
    </div>
  );
}
