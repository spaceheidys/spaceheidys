import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "profile";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_URL = "https://spaceheidys.com";
const DEFAULT_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/24f655b5-389b-48f2-965b-eeda8796f1ae/id-preview-f753c41d--d8c1b358-becd-452b-b334-7c16c2a940de.lovable.app-1772504167337.png";

const SEO = ({
  title = "BIKO KU — Creative Portfolio",
  description = "Illustration portfolio by Viktor Ku. Black & white manga-inspired creative work.",
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  jsonLd,
}: SEOProps) => {
  const canonical = `${SITE_URL}${path}`;
  const finalTitle = title.length > 60 ? title.slice(0, 57) + "…" : title;
  const finalDesc = description.length > 160 ? description.slice(0, 157) + "…" : description;

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDesc} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;