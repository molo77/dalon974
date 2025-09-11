import Head from "next/head";

interface PageMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
}

export default function PageMeta({
  title = "RodColoc - Colocation à La Réunion",
  description = "Trouvez votre colocataire idéal à La Réunion. Une plateforme simple et sécurisée pour connecter les personnes qui cherchent à partager un logement dans cette magnifique île.",
  image,
  url = typeof window !== "undefined" ? window.location.href : "",
  type = "website",
  keywords = ["colocation", "La Réunion", "974", "logement", "partage"],
  author = "RodColoc",
  publishedTime,
  modifiedTime,
  section
}: PageMetaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://rodcoloc.re";
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
  
  // Générer l'image Open Graph si non fournie
  const ogImage = image || `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&category=${encodeURIComponent(section || "")}`;
  const fullImageUrl = ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`;

  return (
    <Head>
      {/* Meta tags de base */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(", ")} />
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="RodColoc" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Article specific meta tags */}
      {type === "article" && (
        <>
          <meta property="article:author" content={author} />
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {keywords.map((keyword, index) => (
            <meta key={index} property="article:tag" content={keyword} />
          ))}
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@RodColoc974" />
      <meta name="twitter:creator" content="@RodColoc974" />

      {/* Additional meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
  );
}
