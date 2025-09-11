import Head from "next/head";

interface OpenGraphMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  siteName?: string;
  locale?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

export default function OpenGraphMeta({
  title = "RodColoc - Colocation à La Réunion",
  description = "Trouvez votre colocataire idéal à La Réunion. Une plateforme simple et sécurisée pour connecter les personnes qui cherchent à partager un logement dans cette magnifique île.",
  image = "/images/og-default.jpg",
  url = typeof window !== "undefined" ? window.location.href : "",
  type = "website",
  siteName = "RodColoc",
  locale = "fr_FR",
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = []
}: OpenGraphMetaProps) {
  const fullImageUrl = image.startsWith("http") ? image : `${process.env.NEXT_PUBLIC_BASE_URL || "https://rodcoloc.re"}${image}`;
  const fullUrl = url.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_BASE_URL || "https://rodcoloc.re"}${url}`;

  return (
    <Head>
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Article specific meta tags */}
      {type === "article" && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
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
      <meta name="description" content={description} />
      <meta name="keywords" content={tags.join(", ")} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
    </Head>
  );
}
