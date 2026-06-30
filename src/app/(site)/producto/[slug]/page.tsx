import React from "react";
import { cache } from "react";
import ShopDetails from "@/tienda/components/ShopDetails";
import { getStoreProductBySlug, getProductReviews } from "@/tienda/data";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const LOGO_FALLBACK = "https://www.montevida.pe/images/logo/LogoOficial-MonteVida-va.png";

// cache() memoiza por request — generateMetadata y ProductDetailsPage comparten el mismo fetch
const getProductData = cache(async (slug: string) => {
    const product = await getStoreProductBySlug(slug);
    if (!product) return null;
    const defaultImg = product.imgs?.thumbnails?.[0] ?? LOGO_FALLBACK;
    const reviews = await getProductReviews(String(product.id));
    return { product, defaultImg, reviews };
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const data = await getProductData(slug);

    if (!data) {
        return { title: { absolute: "Producto no encontrado | Montevida" } };
    }

    const { product, defaultImg } = data;

    const titleAbsolute = product.title.length > 65
        ? product.title.slice(0, 62).trimEnd() + "..."
        : product.title;
    const rawDescription = product.shortDescription
        ? product.shortDescription
        : "Descubre más detalles sobre nuestro producto en Montevida.";
    const description = rawDescription.length > 160
        ? rawDescription.slice(0, 157).trimEnd() + "..."
        : rawDescription;
    const productUrl = `https://montevida.pe/producto/${slug}`;

    return {
        title: { absolute: titleAbsolute },
        description,
        alternates: { canonical: productUrl },
        openGraph: {
            title: titleAbsolute,
            description,
            url: productUrl,
            images: [{ url: defaultImg, width: 800, height: 800, alt: product.title }],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: titleAbsolute,
            description,
            images: [defaultImg],
        },
    };
}

const ProductDetailsPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    const data = await getProductData(slug);

    if (!data) return notFound();

    const { product, defaultImg, reviews } = data;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        image: defaultImg,
        description: product.shortDescription ?? '',
        offers: {
            "@type": "Offer",
            url: `https://www.montevida.pe/producto/${slug}`,
            priceCurrency: "PEN",
            price: product.discountedPrice || product.price,
            itemCondition: "https://schema.org/NewCondition",
            availability: product.stock === 0
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
        },
    };

    return (
        <main className="pt-10 lg:pt-16 xl:pt-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ShopDetails currentProduct={product} reviews={reviews} />
        </main>
    );
};

export default ProductDetailsPage;
