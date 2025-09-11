"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Head from "next/head";
import AdBlock from "@/shared/components/AdBlock";
import SocialShare from "@/shared/components/SocialShare";
import FloatingShare from "@/shared/components/FloatingShare";
import ShareStats from "@/shared/components/ShareStats";
import { conseils, getConseilBySlug, type Conseil } from "@/src/data/conseils";


export default function ConseilPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [conseil, setConseil] = useState<Conseil | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const foundConseil = getConseilBySlug(slug);
    setConseil(foundConseil || null);
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement du conseil...</p>
        </div>
      </main>
    );
  }

  if (!conseil) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Conseil introuvable</h1>
          <p className="text-slate-600 mb-8">Le conseil que vous recherchez n'existe pas.</p>
          <Link
            href="/conseils"
            className="inline-flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition-colors duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour aux conseils
          </Link>
        </div>
      </main>
    );
  }

  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold text-slate-800 mb-6 mt-8">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold text-slate-800 mb-4 mt-6">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold text-slate-800 mb-3 mt-4">{line.substring(4)}</h3>;
        }
        if (line.startsWith('- **')) {
          const text = line.substring(4);
          const parts = text.split('**');
          return (
            <li key={index} className="mb-2 text-slate-700">
              <strong>{parts[0]}</strong>{parts[1]}
            </li>
          );
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="mb-2 text-slate-700">{line.substring(2)}</li>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        if (line.includes('**')) {
          const parts = line.split('**');
          return (
            <p key={index} className="mb-4 text-slate-700 leading-relaxed">
              {parts.map((part, i) => 
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
              )}
            </p>
          );
        }
        return <p key={index} className="mb-4 text-slate-700 leading-relaxed">{line}</p>;
      });
  };

  return (
    <>
      <Head>
        <title>{conseil?.title || "Conseil - RodColoc"}</title>
        <meta name="description" content={conseil?.excerpt || "Conseil de colocation à La Réunion"} />
        <meta property="og:title" content={conseil?.title || "Conseil - RodColoc"} />
        <meta property="og:description" content={conseil?.excerpt || "Conseil de colocation à La Réunion"} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={`/api/og?title=${encodeURIComponent(conseil?.title || "")}&description=${encodeURIComponent(conseil?.excerpt || "")}&category=${encodeURIComponent(conseil?.category || "")}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={conseil?.title || "Conseil - RodColoc"} />
        <meta name="twitter:description" content={conseil?.excerpt || "Conseil de colocation à La Réunion"} />
        <meta name="twitter:image" content={`/api/og?title=${encodeURIComponent(conseil?.title || "")}&description=${encodeURIComponent(conseil?.excerpt || "")}&category=${encodeURIComponent(conseil?.category || "")}`} />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 text-white py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/conseils"
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-colors duration-300 border border-white/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour aux conseils
            </Link>
            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/30">
              {conseil.category}
            </span>
            <span className="text-sky-100 text-sm">{conseil.readTime}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent leading-tight">
            {conseil.title}
          </h1>
          <p className="text-xl text-sky-100 leading-relaxed">
            {conseil.excerpt}
          </p>
        </div>
      </section>

      {/* Publicité */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <AdBlock 
          placementKey="conseil.hero" 
          title="Nos partenaires"
          variant="featured"
        />
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8 md:p-12 border border-white/20">
          <div className="prose prose-lg max-w-none">
            {formatContent(conseil.content)}
          </div>
          
          {/* Partage social */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Cet article vous a aidé ?
                </h3>
                <p className="text-slate-600 text-sm mb-3">
                  Partagez-le avec vos amis et aidez d'autres personnes à découvrir la colocation à La Réunion !
                </p>
                <ShareStats className="mb-4" />
              </div>
              <SocialShare
                title={conseil.title}
                description={conseil.excerpt}
                hashtags={["RodColoc", "Colocation", "LaReunion", "974", conseil.category]}
                variant="default"
                showLabels={true}
                className="flex-shrink-0"
              />
            </div>
          </div>
        </article>
      </section>

      {/* Related Articles */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Autres conseils qui pourraient vous intéresser</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {conseils
            .filter(c => c.id !== conseil.id && c.category === conseil.category)
            .slice(0, 2)
            .map((relatedConseil) => (
              <Link
                key={relatedConseil.id}
                href={`/conseils/${relatedConseil.slug}`}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 px-3 py-1 rounded-full text-xs font-semibold border border-sky-200">
                    {relatedConseil.category}
                  </span>
                  <span className="text-slate-500 text-xs bg-slate-100 px-2 py-1 rounded-full">{relatedConseil.readTime}</span>
                </div>
                <h3 className="text-lg font-bold mb-3 text-slate-800 group-hover:text-sky-600 transition-colors duration-300">
                  {relatedConseil.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{relatedConseil.excerpt}</p>
              </Link>
            ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 text-white py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
            Prêt à trouver votre colocation ?
          </h2>
          <p className="text-lg text-sky-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Découvrez nos annonces et profils de colocataires à La Réunion
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="group bg-white text-sky-600 px-8 py-4 rounded-2xl font-semibold hover:bg-sky-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center gap-2">
                Voir les annonces
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
            <Link
              href="/conseils"
              className="group border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-sky-600 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              <span className="flex items-center gap-2">
                Plus de conseils
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Partage flottant */}
      <FloatingShare
        title={conseil?.title}
        description={conseil?.excerpt}
        hashtags={["RodColoc", "Colocation", "LaReunion", "974", conseil?.category || ""]}
      />
    </main>
    </>
  );
}
