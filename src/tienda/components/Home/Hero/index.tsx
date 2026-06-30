import React from "react";
import HeroCarousel from "./HeroCarousel";
import HeroFeature from "./HeroFeature";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/tienda/types/product";

const Hero = ({ products }: { products: Product[] }) => {
  const carouselProducts = products.filter((p) => p.isHeroCarousel);
  const offerProducts = products.filter((p) => p.isHeroOferta).slice(0, 2);

  // Fallback defaults just in case no products are marked in Sanity
  const fallbackOffer1 = {
    title: "iPhone 14 Plus & 14 Pro Max",
    slug: "#",
    price: 699,
    discountedPrice: 999,
    image: "/images/hero/hero-02.png"
  };

  const fallbackOffer2 = {
    title: "Wireless Headphone",
    slug: "#",
    price: 699,
    discountedPrice: 999,
    image: "/images/hero/hero-01.png"
  };

  const offer1 = offerProducts.length > 0 ? {
    title: offerProducts[0].title,
    slug: `/producto/${offerProducts[0].slug}`,
    price: offerProducts[0].price,
    discountedPrice: offerProducts[0].discountedPrice,
    image: offerProducts[0].imgs?.thumbnails[0] || "/images/hero/hero-02.png"
  } : fallbackOffer1;

  const offer2 = offerProducts.length > 1 ? {
    title: offerProducts[1].title,
    slug: `/producto/${offerProducts[1].slug}`,
    price: offerProducts[1].price,
    discountedPrice: offerProducts[1].discountedPrice,
    image: offerProducts[1].imgs?.thumbnails[0] || "/images/hero/hero-01.png"
  } : fallbackOffer2;

  return (
    <section className="overflow-hidden pb-10 lg:pb-12.5 xl:pb-15 pt-[110px] sm:pt-[120px] lg:pt-[120px] xl:pt-[130px] bg-surface">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="flex flex-wrap gap-5">
          <div className="w-full">
            <div className="relative z-1 rounded-3xl bg-surface overflow-hidden shadow-neu">
              {/* <!-- bg shapes --> */}
              <Image
                src="/images/hero/hero-bg.png"
                alt="hero bg shapes"
                className="absolute right-0 bottom-0 -z-1"
                width={534}
                height={520}
              />

              <HeroCarousel products={carouselProducts} />
            </div>
          </div>
        </div>
      </div>

      {/* <!-- Hero features --> */}
      <HeroFeature />
    </section>
  );
};

export default Hero;
