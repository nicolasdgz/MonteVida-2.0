"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

// Import Swiper styles
import "swiper/css/pagination";
import "swiper/css";

import { Product } from "@/tienda/types/product";
import Link from "next/link";
import Image from "next/image";

const HeroCarousal = ({ products }: { products: Product[] }) => {
  return (
    <Swiper
      spaceBetween={30}
      centeredSlides={true}
      autoplay={{
        delay: 2500,
        disableOnInteraction: false,
      }}
      pagination={{
        clickable: true,
      }}
      modules={[Autoplay, Pagination]}
      className="hero-carousel"
    >
      {products && products.length > 0 ? (
        products.map((product, key) => (
          <SwiperSlide key={key}>
            <div className="flex items-center pt-6 sm:pt-0 flex-col-reverse sm:flex-row">
              <div className="max-w-[394px] py-10 sm:py-15 lg:py-24.5 pl-4 sm:pl-7.5 lg:pl-12.5">


                <h2 className="font-semibold text-dark text-xl sm:text-3xl mb-3">
                  <Link href={`/producto/${product.slug}`}>{product.title}</Link>
                </h2>



                <Link
                  href={`/producto/${product.slug}`}
                  className="inline-flex font-medium text-white text-custom-sm rounded-xl bg-accent py-3 px-9 ease-out duration-200 hover:bg-accent-dark active:shadow-neu-inset shadow-neu-sm focus:outline-2 focus:outline-offset-2 focus:outline-accent/60 mt-10"
                >
                  Ver Producto
                </Link>
              </div>

              <div>
                <Image
                  src={product.imgs?.thumbnails[0] || "/images/hero/hero-01.png"}
                  alt={product.title}
                  width={351}
                  height={358}
                  className="object-contain"
                />
              </div>
            </div>
          </SwiperSlide>
        ))
      ) : (
        <>
          <SwiperSlide>
            <div className="flex items-center pt-6 sm:pt-0 flex-col-reverse sm:flex-row">
              <div className="max-w-[394px] py-10 sm:py-15 lg:py-24.5 pl-4 sm:pl-7.5 lg:pl-12.5">
                <div className="flex items-center gap-4 mb-7.5 sm:mb-10">
                  <span className="block font-semibold text-heading-3 sm:text-heading-1 text-primary">
                    30%
                  </span>
                  <span className="block text-dark text-sm sm:text-custom-1 sm:leading-[24px]">
                    Sale
                    <br />
                    Off
                  </span>
                </div>

                <h2 className="font-semibold text-dark text-xl sm:text-3xl mb-3">
                  <a href="#">True Wireless Noise Cancelling Headphone</a>
                </h2>

                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi at ipsum at risus euismod lobortis in
                </p>

                <a
                  href="#"
                  className="inline-flex font-medium text-white text-custom-sm rounded-xl bg-accent py-3 px-9 ease-out duration-200 hover:bg-accent-dark active:shadow-neu-inset shadow-neu-sm focus:outline-2 focus:outline-offset-2 focus:outline-accent/60 mt-10"
                >
                  Shop Now
                </a>
              </div>

              <div>
                <Image
                  src="/images/hero/hero-01.png"
                  alt="headphone"
                  width={351}
                  height={358}
                />
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            {" "}
            <div className="flex items-center pt-6 sm:pt-0 flex-col-reverse sm:flex-row">
              <div className="max-w-[394px] py-10 sm:py-15 lg:py-26 pl-4 sm:pl-7.5 lg:pl-12.5">
                <div className="flex items-center gap-4 mb-7.5 sm:mb-10">
                  <span className="block font-semibold text-heading-3 sm:text-heading-1 text-primary">
                    30%
                  </span>
                  <span className="block text-dark text-sm sm:text-custom-1 sm:leading-[24px]">
                    Sale
                    <br />
                    Off
                  </span>
                </div>

                <h2 className="font-semibold text-dark text-xl sm:text-3xl mb-3">
                  <a href="#">True Wireless Noise Cancelling Headphone</a>
                </h2>

                <p>
                  Lorem ipsum dolor sit, consectetur elit nunc suscipit non ipsum
                  nec suscipit.
                </p>

                <a
                  href="#"
                  className="inline-flex font-medium text-white text-custom-sm rounded-xl bg-accent py-3 px-9 ease-out duration-200 hover:bg-accent-dark active:shadow-neu-inset shadow-neu-sm focus:outline-2 focus:outline-offset-2 focus:outline-accent/60 mt-10"
                >
                  Shop Now
                </a>
              </div>

              <div>
                <Image
                  src="/images/hero/hero-01.png"
                  alt="headphone"
                  width={351}
                  height={358}
                />
              </div>
            </div>
          </SwiperSlide>
        </>
      )}
    </Swiper>
  );
};

export default HeroCarousal;
