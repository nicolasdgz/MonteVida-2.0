"use client";
import React, { useState } from "react";
import { Product } from "@/tienda/types/product";
import ReviewForm from "./ReviewForm";
import type { ProductReview } from "@/types/database";

interface ProductTabsProps {
  product: Product;
  reviews: ProductReview[];
  isLoggedIn: boolean;
}

const ProductTabs = ({ product, reviews, isLoggedIn }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useState("tabOne");

  const tabs = [
    { id: "tabOne",   title: "Descripción" },
    { id: "tabTwo",   title: "Información Adicional" },
    { id: "tabThree", title: `Reseñas (${reviews.length})` },
  ];

  return (
    <section className="overflow-hidden bg-surface py-20">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* <!--== tab header start ==--> */}
        <div className="flex flex-wrap items-center bg-surface rounded-3xl shadow-neu gap-5 xl:gap-12.5 py-4.5 px-4 sm:px-6">
          {tabs.map((item, key) => (
            <button
              key={key}
              onClick={() => setActiveTab(item.id)}
              className={`font-medium lg:text-lg ease-out duration-200 hover:text-primary relative before:h-0.5 before:bg-primary before:absolute before:left-0 before:bottom-0 before:ease-out before:duration-200 hover:before:w-full ${activeTab === item.id
                ? "text-primary before:w-full"
                : "text-dark before:w-0"
                }`}
            >
              {item.title}
            </button>
          ))}
        </div>
        {/* <!--== tab header end ==--> */}

        {/* <!--== tab content start ==--> */}
        {/* <!-- tab content one start --> */}
        <div>
          <div
            className={`flex-col sm:flex-row gap-7.5 xl:gap-12.5 mt-12.5 ${activeTab === "tabOne" ? "flex" : "hidden"
              }`}
          >
            <div className="max-w-[1000px] w-full">
              <h2 className="font-medium text-2xl text-dark mb-7">
                Detalles del Producto
              </h2>

              <div className="mb-6 text-dark max-w-none flex flex-col gap-4">
                <p>{product.shortDescription || 'Este producto no tiene una descripción detallada en este momento.'}</p>
              </div>

              {product.presentation && (
                <>
                  <h2 className="font-medium text-2xl text-dark mb-7 mt-10">
                    Presentación
                  </h2>
                  <div className="mb-6 text-dark max-w-none flex flex-col gap-4">
                    <p>{product.presentation as string}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {/* <!-- tab content one end --> */}

        {/* <!-- tab content two start --> */}
        <div>
          <div
            className={`rounded-3xl bg-surface shadow-neu p-4 sm:p-6 mt-10 ${activeTab === "tabTwo" ? "block" : "hidden"
              }`}
          >
            {/* <!-- info item --> */}
            <div className="rounded-md even:bg-gray-1 flex py-4 px-4 sm:px-5">
              <div className="max-w-[450px] min-w-[140px] w-full">
                <p className="text-sm sm:text-base text-dark">Categoría(s)</p>
              </div>
              <div className="w-full">
                <p className="text-sm sm:text-base text-dark">
                  {product.categories?.join(', ') || "General"}
                </p>
              </div>
            </div>

            {/* <!-- info item --> */}
            <div className="rounded-md even:bg-gray-1 flex py-4 px-4 sm:px-5">
              <div className="max-w-[450px] min-w-[140px] w-full">
                <p className="text-sm sm:text-base text-dark">Disponibilidad</p>
              </div>
              <div className="w-full">
                <p className="text-sm sm:text-base text-dark">
                  {product.stock === 0
                    ? 'Sin stock'
                    : product.stock !== undefined && product.stockMinimo !== undefined && product.stock <= product.stockMinimo
                      ? `Últimas ${product.stock} unidades`
                      : 'En Stock'}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* <!-- tab content two end --> */}

        {/* <!-- tab content three start --> */}
        <div>
          <div
            className={`flex-col sm:flex-row gap-7.5 xl:gap-12.5 mt-12.5 ${activeTab === "tabThree" ? "flex" : "hidden"}`}
          >
            <div className="max-w-[570px] w-full">
              <h2 className="font-medium text-2xl text-dark mb-9">
                {reviews.length} {reviews.length === 1 ? 'Reseña' : 'Reseñas'} para este producto
              </h2>

              {reviews.length === 0 ? (
                <p className="text-dark-4">Sé el primero en dejar una reseña.</p>
              ) : (
              <div className="flex flex-col gap-6">
                {reviews.map((review) => (
                <div key={review.id} className="rounded-3xl bg-surface shadow-neu p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-dark">{review.profiles?.full_name ?? 'Cliente'}</p>
                      <p className="text-custom-sm text-dark-4">
                        {new Date(review.created_at).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <svg key={s} width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                            fill={s <= review.rating ? '#FBB040' : '#E0E0E0'} />
                        </svg>
                      ))}
                    </div>
                  </div>
                  {review.titulo && <p className="font-medium text-dark mb-2">{review.titulo}</p>}
                  <p className="text-dark">{review.contenido}</p>
                </div>
                ))}
              </div>
              )}
            </div>

            <div className="max-w-[550px] w-full">
              <ReviewForm
                productId={String(product.id)}
                productSlug={product.slug ?? String(product.id)}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </div>
        </div>
        {/* <!-- tab content three end --> */}
        {/* <!--== tab content end ==--> */}
      </div>
    </section>
  );
};

export default ProductTabs;
