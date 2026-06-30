import React from "react";
import Hero from "./Hero";
import Categories from "./Categories";
import CounDown from "./Countdown";
import Testimonials from "./Testimonials";
import { getStoreProducts, getStoreCategoriesWithImages } from "@/tienda/data";

const Home = async () => {
  const products = await getStoreProducts();
  const categories = await getStoreCategoriesWithImages();

  const featured = products.filter((p) => p.isHeroCarousel || p.isHeroOferta).slice(0, 6);
  const productJsonLd = featured.map((p) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    image: p.imgs?.thumbnails?.[0] || "https://www.montevida.pe/images/logo/LogoOficial-MonteVida-va.png",
    description: p.shortDescription
      ? (p.shortDescription as string).slice(0, 300)
      : `Compra ${p.title} en Monte Vida Perú.`,
    offers: {
      "@type": "Offer",
      url: `https://www.montevida.pe/producto/${p.slug}`,
      priceCurrency: "PEN",
      price: p.discountedPrice || p.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
    },
  }));

  return (
    <main>
      {productJsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <h1 className="sr-only">Monte Vida Perú — Suplementos y Productos Naturales</h1>
      <Hero products={products} />
      <Categories categories={categories} />
      <CounDown promoProduct={products.find(p => p.isPromoSection)} />
      <Testimonials />
    </main>
  );
};

export default Home;
