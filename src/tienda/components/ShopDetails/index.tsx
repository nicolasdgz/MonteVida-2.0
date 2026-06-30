"use client";
import React, { useEffect, useState } from "react";
import Breadcrumb from "@/tienda/components/Common/Breadcrumb";
import Image from "next/image";
import RecentlyViewdItems from "./RecentlyViewd";
import { usePreviewSlider } from "@/app/context/PreviewSliderContext";
import { useAppSelector } from "@/tienda/store/store";
import { Product } from "@/tienda/types/product";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/tienda/store/store";
import { addItemToCart, updateCartItemQuantity } from "@/tienda/store/features/cart-slice";
import { useRouter } from "next/navigation";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import ProductTabs from "./ProductTabs";
import { useAuthStore } from "@/store/auth";
import type { ProductReview } from "@/types/database";

const ShopDetails = ({ currentProduct, reviews = [] }: { currentProduct?: Product; reviews?: ProductReview[] }) => {
  const { openPreviewModal } = usePreviewSlider();
  const [previewImg, setPreviewImg] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const { openCartModal } = useCartModalContext();
  const profile = useAuthStore((s) => s.profile);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(addItemToCart({ ...product, quantity }));
    openCartModal();
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    const alreadyInCart = cartItems.find((item) => item.id === product.id);
    if (alreadyInCart) {
      dispatch(updateCartItemQuantity({ id: product.id, quantity }));
    } else {
      dispatch(addItemToCart({ ...product, quantity }));
    }
    router.push("/checkout");
  };

  const productFromStorage = useAppSelector(
    (state) => state.productDetailsReducer.value
  );

  const [storedProduct, setStoredProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (currentProduct) {
      localStorage.setItem("productDetails", JSON.stringify(currentProduct));
      return;
    }
    const alreadyExist = localStorage.getItem("productDetails");
    if (alreadyExist) {
      setStoredProduct(JSON.parse(alreadyExist));
    }
  }, [currentProduct]);

  const product = currentProduct || storedProduct || productFromStorage;

  // pass the product here when you get the real data.
  const handlePreviewSlider = () => {
    openPreviewModal();
  };

  return (
    <>
      <Breadcrumb title={"Shop Details"} pages={["shop details"]} />

      {product.title === "" ? (
        "Please add product"
      ) : (
        <>
          <section className="overflow-hidden relative pb-20">
            <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
              <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-17.5">
                <div className="lg:max-w-[570px] w-full flex flex-col items-center">
                  <div className="lg:min-h-[512px] w-full rounded-3xl shadow-neu bg-surface p-4 sm:p-7.5 relative flex flex-col items-center justify-center">
                    <div>
                      <button
                        onClick={handlePreviewSlider}
                        aria-label="button for zoom"
                        className="gallery__Image w-11 h-11 rounded-xl bg-surface shadow-neu-sm flex items-center justify-center ease-out duration-200 text-dark hover:text-primary absolute top-4 lg:top-6 right-4 lg:right-6 z-50"
                      >
                        <svg
                          className="fill-current"
                          width="22"
                          height="22"
                          viewBox="0 0 22 22"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9.11493 1.14581L9.16665 1.14581C9.54634 1.14581 9.85415 1.45362 9.85415 1.83331C9.85415 2.21301 9.54634 2.52081 9.16665 2.52081C7.41873 2.52081 6.17695 2.52227 5.23492 2.64893C4.31268 2.77292 3.78133 3.00545 3.39339 3.39339C3.00545 3.78133 2.77292 4.31268 2.64893 5.23492C2.52227 6.17695 2.52081 7.41873 2.52081 9.16665C2.52081 9.54634 2.21301 9.85415 1.83331 9.85415C1.45362 9.85415 1.14581 9.54634 1.14581 9.16665L1.14581 9.11493C1.1458 7.43032 1.14579 6.09599 1.28619 5.05171C1.43068 3.97699 1.73512 3.10712 2.42112 2.42112C3.10712 1.73512 3.97699 1.43068 5.05171 1.28619C6.09599 1.14579 7.43032 1.1458 9.11493 1.14581ZM16.765 2.64893C15.823 2.52227 14.5812 2.52081 12.8333 2.52081C12.4536 2.52081 12.1458 2.21301 12.1458 1.83331C12.1458 1.45362 12.4536 1.14581 12.8333 1.14581L12.885 1.14581C14.5696 1.1458 15.904 1.14579 16.9483 1.28619C18.023 1.43068 18.8928 1.73512 19.5788 2.42112C20.2648 3.10712 20.5693 3.97699 20.7138 5.05171C20.8542 6.09599 20.8542 7.43032 20.8541 9.11494V9.16665C20.8541 9.54634 20.5463 9.85415 20.1666 9.85415C19.787 9.85415 19.4791 9.54634 19.4791 9.16665C19.4791 7.41873 19.4777 6.17695 19.351 5.23492C19.227 4.31268 18.9945 3.78133 18.6066 3.39339C18.2186 3.00545 17.6873 2.77292 16.765 2.64893ZM1.83331 12.1458C2.21301 12.1458 2.52081 12.4536 2.52081 12.8333C2.52081 14.5812 2.52227 15.823 2.64893 16.765C2.77292 17.6873 3.00545 18.2186 3.39339 18.6066C3.78133 18.9945 4.31268 19.227 5.23492 19.351C6.17695 19.4777 7.41873 19.4791 9.16665 19.4791C9.54634 19.4791 9.85415 19.787 9.85415 20.1666C9.85415 20.5463 9.54634 20.8541 9.16665 20.8541H9.11494C7.43032 20.8542 6.09599 20.8542 5.05171 20.7138C3.97699 20.5693 3.10712 20.2648 2.42112 19.5788C1.73512 18.8928 1.43068 18.023 1.28619 16.9483C1.14579 15.904 1.1458 14.5696 1.14581 12.885L1.14581 12.8333C1.14581 12.4536 1.45362 12.1458 1.83331 12.1458ZM20.1666 12.1458C20.5463 12.1458 20.8541 12.4536 20.8541 12.8333V12.885C20.8542 14.5696 20.8542 15.904 20.7138 16.9483C20.5693 18.023 20.2648 18.8928 19.5788 19.5788C18.8928 20.2648 18.023 20.5693 16.9483 20.7138C15.904 20.8542 14.5696 20.8542 12.885 20.8541H12.8333C12.4536 20.8541 12.1458 20.5463 12.1458 20.1666C12.1458 19.787 12.4536 19.4791 12.8333 19.4791C14.5812 19.4791 15.823 19.4777 16.765 19.351C17.6873 19.227 18.2186 18.9945 18.6066 18.6066C18.9945 18.2186 19.227 17.6873 19.351 16.765C19.4777 15.823 19.4791 14.5812 19.4791 12.8333C19.4791 12.4536 19.787 12.1458 20.1666 12.1458Z"
                            fill=""
                          />
                        </svg>
                      </button>

                      {product.imgs?.previews?.[previewImg] && (
                        <Image
                          src={product.imgs.previews[previewImg]}
                          alt="products-details"
                          width={400}
                          height={400}
                        />
                      )}
                    </div>

                    {/* <!-- Additional Gallery Images --> */}
                    {product.imgs?.previews && product.imgs.previews.length > 1 && (
                      <div className="flex gap-3 mt-4 overflow-x-auto pb-2 custom-scrollbar w-full max-w-[400px]">
                        {product.imgs.previews.map((img: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => setPreviewImg(index)}
                            className={`flex flex-shrink-0 items-center justify-center w-20 h-20 rounded-xl overflow-hidden ease-out duration-200 shadow-neu-sm hover:ring-2 hover:ring-primary/60 ${
                              previewImg === index ? "ring-2 ring-primary" : ""
                            }`}
                          >
                            <Image
                              src={img}
                              alt={`gallery-image-${index}`}
                              width={80}
                              height={80}
                              className="object-cover w-full h-full"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                  </div>
                </div>

                {/* <!-- product content --> */}
                <div className="max-w-[539px] w-full">
                  <div className="flex items-center justify-between mb-3">
                    <h1 className="font-semibold text-xl sm:text-2xl xl:text-custom-3 text-dark">
                      {product.title}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-5.5 mb-4.5">
                    {product.stock === 0 ? (
                      <span className="text-sm font-medium text-red-500">Sin stock</span>
                    ) : product.stock !== undefined && product.stockMinimo !== undefined && product.stock <= product.stockMinimo ? (
                      <span className="text-sm font-medium text-amber-600">Últimas {product.stock} unidades</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_375_9221)">
                            <path d="M10 0.5625C4.78125 0.5625 0.5625 4.78125 0.5625 10C0.5625 15.2188 4.78125 19.4688 10 19.4688C15.2188 19.4688 19.4688 15.2188 19.4688 10C19.4688 4.78125 15.2188 0.5625 10 0.5625ZM10 18.0625C5.5625 18.0625 1.96875 14.4375 1.96875 10C1.96875 5.5625 5.5625 1.96875 10 1.96875C14.4375 1.96875 18.0625 5.59375 18.0625 10.0312C18.0625 14.4375 14.4375 18.0625 10 18.0625Z" fill="#22AD5C" />
                            <path d="M12.6875 7.09374L8.9688 10.7187L7.2813 9.06249C7.00005 8.78124 6.56255 8.81249 6.2813 9.06249C6.00005 9.34374 6.0313 9.78124 6.2813 10.0625L8.2813 12C8.4688 12.1875 8.7188 12.2812 8.9688 12.2812C9.2188 12.2812 9.4688 12.1875 9.6563 12L13.6875 8.12499C13.9688 7.84374 13.9688 7.40624 13.6875 7.12499C13.4063 6.84374 12.9688 6.84374 12.6875 7.09374Z" fill="#22AD5C" />
                          </g>
                          <defs><clipPath id="clip0_375_9221"><rect width="20" height="20" fill="white" /></clipPath></defs>
                        </svg>
                        <span className="text-green">En Stock</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 mb-4.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-dark-4">Precio Regular:</span>
                      <span className="text-sm text-dark-4 line-through">S/. {product.price}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-dark">Precio Promocional:</span>
                      <span className="text-xl font-bold text-primary">S/. {product.discountedPrice || product.price}</span>
                    </div>
                  </div>

                  <ul className="flex flex-col gap-2">
                    <li className="flex items-center gap-2.5">
                      <svg
                        className="text-primary"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.3589 8.35863C13.603 8.11455 13.603 7.71882 13.3589 7.47475C13.1149 7.23067 12.7191 7.23067 12.4751 7.47475L8.75033 11.1995L7.5256 9.97474C7.28152 9.73067 6.8858 9.73067 6.64172 9.97474C6.39764 10.2188 6.39764 10.6146 6.64172 10.8586L8.30838 12.5253C8.55246 12.7694 8.94819 12.7694 9.19227 12.5253L13.3589 8.35863Z"
                          fill="currentColor"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10.0003 1.04169C5.05277 1.04169 1.04199 5.05247 1.04199 10C1.04199 14.9476 5.05277 18.9584 10.0003 18.9584C14.9479 18.9584 18.9587 14.9476 18.9587 10C18.9587 5.05247 14.9479 1.04169 10.0003 1.04169ZM2.29199 10C2.29199 5.74283 5.74313 2.29169 10.0003 2.29169C14.2575 2.29169 17.7087 5.74283 17.7087 10C17.7087 14.2572 14.2575 17.7084 10.0003 17.7084C5.74313 17.7084 2.29199 14.2572 2.29199 10Z"
                          fill="currentColor"
                        />
                      </svg>
                      Entrega gratuita disponible
                    </li>
                  </ul>

                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="flex flex-wrap items-center gap-4.5">
                      <div className="flex items-center rounded-xl shadow-neu-inset">
                        <button
                          aria-label="button for remove product"
                          className="flex items-center justify-center w-12 h-12 ease-out duration-200 hover:text-primary"
                          onClick={() =>
                            quantity > 1 && setQuantity(quantity - 1)
                          }
                        >
                          <svg
                            className="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3.33301 10.0001C3.33301 9.53984 3.7061 9.16675 4.16634 9.16675H15.833C16.2932 9.16675 16.6663 9.53984 16.6663 10.0001C16.6663 10.4603 16.2932 10.8334 15.833 10.8334H4.16634C3.7061 10.8334 3.33301 10.4603 3.33301 10.0001Z"
                              fill=""
                            />
                          </svg>
                        </button>

                        <span className="flex items-center justify-center w-16 h-12 border-x border-gray-4/40">
                          {quantity}
                        </span>

                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          aria-label="button for add product"
                          className="flex items-center justify-center w-12 h-12 ease-out duration-200 hover:text-primary"
                        >
                          <svg
                            className="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3.33301 10C3.33301 9.5398 3.7061 9.16671 4.16634 9.16671H15.833C16.2932 9.16671 16.6663 9.5398 16.6663 10C16.6663 10.4603 16.2932 10.8334 15.833 10.8334H4.16634C3.7061 10.8334 3.33301 10.4603 3.33301 10Z"
                              fill=""
                            />
                            <path
                              d="M9.99967 16.6667C9.53944 16.6667 9.16634 16.2936 9.16634 15.8334L9.16634 4.16671C9.16634 3.70647 9.53944 3.33337 9.99967 3.33337C10.4599 3.33337 10.833 3.70647 10.833 4.16671L10.833 15.8334C10.833 16.2936 10.4599 16.6667 9.99967 16.6667Z"
                              fill=""
                            />
                          </svg>
                        </button>
                      </div>

                      <button
                        onClick={handleBuyNow}
                        disabled={product.stock === 0}
                        className="inline-flex font-medium text-white bg-dark py-3 px-7 rounded-xl shadow-neu-sm ease-out duration-200 hover:opacity-80 active:shadow-neu-inset disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Comprar ahora
                      </button>

                      <button
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        className="inline-flex font-medium text-white bg-accent py-3 px-7 rounded-xl shadow-neu-sm ease-out duration-200 hover:bg-accent-dark active:shadow-neu-inset focus:outline-2 focus:outline-offset-2 focus:outline-accent/60 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Añadir al carrito
                      </button>

                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>

          <ProductTabs product={product} reviews={reviews} isLoggedIn={!!profile} />

          <RecentlyViewdItems />
        </>
      )}
    </>
  );
};

export default ShopDetails;
