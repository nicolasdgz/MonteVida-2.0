"use client";
import { useState, useEffect } from "react";
import Header from "@/tienda/components/Header";
import Footer from "@/tienda/components/Footer";

import { ModalProvider } from "../context/QuickViewModalContext";
import { CartModalProvider } from "../context/CartSidebarModalContext";
import { ReduxProvider } from "@/tienda/store/provider";
import QuickViewModal from "@/tienda/components/Common/QuickViewModal";
import dynamic from "next/dynamic";
const CartSidebarModal = dynamic(() => import("@/tienda/components/Common/CartSidebarModal"), { ssr: false });
import { PreviewSliderProvider } from "../context/PreviewSliderContext";
import PreviewSliderModal from "@/tienda/components/Common/PreviewSlider";
import PageTransition from "@/tienda/components/Common/PageTransition";

import ScrollToTop from "@/tienda/components/Common/ScrollToTop";
import WhatsAppButton from "@/tienda/components/WhatsAppButton";
import PreLoader from "@/tienda/components/Common/PreLoader";
import ContentProtection from "@/tienda/components/Common/ContentProtection";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <>
      <ReduxProvider>
        <CartModalProvider>
          <ModalProvider>
            <PreviewSliderProvider>

              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    name: "Montevida",
                    url: "https://www.montevida.pe",
                    logo: "https://www.montevida.pe/images/logo/LogoOficial-MonteVida-va.png",
                    contactPoint: {
                      "@type": "ContactPoint",
                      telephone: "+51-999-999-999",
                      contactType: "customer service",
                      areaServed: "PE",
                      availableLanguage: "es"
                    }
                  })
                }}
              />

              <Header />
              <main className="pt-[68px]">
                <PageTransition>{children}</PageTransition>
              </main>

              <QuickViewModal />
              <CartSidebarModal />
              <PreviewSliderModal />
            </PreviewSliderProvider>
          </ModalProvider>
        </CartModalProvider>
      </ReduxProvider>
      <ContentProtection />
      <ScrollToTop />
      <WhatsAppButton />
      <Footer />
      {loading && <PreLoader />}
    </>
  );
}
