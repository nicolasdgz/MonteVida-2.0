"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import Dropdown from "./Dropdown";
import { useAppSelector } from "@/tienda/store/store";
import Marquee from "react-fast-marquee";
import { Outfit } from "next/font/google";
import { menuData } from "./menuData";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const Header = () => {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [stickyMenu, setStickyMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const pathUrl = usePathname();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { openCartModal } = useCartModalContext();
  const product = useAppSelector((state) => state.cartReducer.items);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.length >= 2) {
        router.push(`/tienda?q=${encodeURIComponent(val)}`);
      } else if (val.length === 0) {
        router.push("/tienda");
      }
    }, 300);
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchValue("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  useEffect(() => {
    let total = 0;
    product.forEach((item) => {
      total += (item.discountedPrice || item.price) * item.quantity;
    });
    setTotalPrice(total);
  }, [product]);

  const handleStickyMenu = () => {
    if (window.scrollY >= 80) {
      setStickyMenu(true);
    } else {
      setStickyMenu(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleStickyMenu);
    return () => {
      window.removeEventListener("scroll", handleStickyMenu);
    };
  });

  return (
    <header
      className={`fixed left-0 top-0 w-full z-9999 bg-surface transition-all ease-in-out duration-300 ${stickyMenu && "shadow-[0_4px_14px_rgba(163,181,161,0.45)]"}`}
    >
      <div className="bg-primary text-white text-sm font-medium py-1.5 flex items-center">
        <Marquee speed={40} gradient={false} autoFill={true}>
          <span className="mx-8">PEDIDOS GRATIS DESDE 100 SOLES</span>
        </Marquee>
      </div>
      <div className="max-w-[1170px] mx-auto px-4 sm:px-7.5 xl:px-0">
        <div className={`flex items-center justify-between ease-out duration-200 ${stickyMenu ? "py-2" : "py-3"}`}>
          {/* Logo */}
          <Link className="flex flex-row items-center gap-2 md:gap-3 flex-shrink-0" href="/">
            <div className="relative w-[50px] h-[50px] md:w-[60px] md:h-[60px] block">
              <Image
                src="/images/logo/LogoOficial-MonteVida-va.png"
                alt="Logo Montevida"
                fill
                quality={100}
                priority
                style={{ objectFit: "contain", objectPosition: "left center" }}
              />
            </div>
            <span className={`${outfit.className} text-xl md:text-2xl font-bold tracking-normal whitespace-nowrap mt-1`}>
              <span className="text-[#164226]">Monte</span>
              <span className="text-[#73ab48]">Vida</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center justify-center flex-grow pl-10 pr-10">
            <nav>
              <ul className="flex items-center gap-5 xl:gap-8">
                {menuData.map((menuItem, i) =>
                  menuItem.submenu ? (
                    <Dropdown key={i} menuItem={menuItem} stickyMenu={stickyMenu} />
                  ) : (
                    <li
                      key={i}
                      className="group relative before:w-0 before:h-[3px] before:bg-primary before:absolute before:left-0 before:-bottom-1 before:rounded-b-[3px] before:ease-out before:duration-200 hover:before:w-full"
                    >
                      <Link href={menuItem.path ?? "/"} className="hover:text-primary text-custom-sm font-medium text-dark">
                        {menuItem.title}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </nav>
          </div>

          {/* Nav Right */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Desktop Search */}
            <div className="hidden xl:flex items-center gap-1.5">
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${searchOpen ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"}`}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === "Escape" && handleSearchClose()}
                  placeholder="Buscar productos..."
                  className="h-8 w-[190px] pl-3 pr-2 rounded-xl shadow-neu-sm bg-surface text-sm text-dark placeholder:text-gray-4 focus:outline-none"
                />
              </div>
              <button
                onClick={searchOpen ? handleSearchClose : handleSearchOpen}
                aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar productos"}
                className="flex items-center justify-center w-8 h-8 rounded-xl text-dark hover:text-primary ease-out duration-200"
              >
                {searchOpen ? <X size={16} /> : <Search size={16} />}
              </button>
            </div>


            <button onClick={openCartModal} className="flex items-center gap-1.5 focus:outline-none">
              <span className="inline-block relative">
                <svg className="text-primary" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5433 9.5172C15.829 9.21725 15.8174 8.74252 15.5174 8.45686C15.2175 8.17119 14.7428 8.18277 14.4571 8.48272L12.1431 10.9125L11.5433 10.2827C11.2576 9.98277 10.7829 9.97119 10.483 10.2569C10.183 10.5425 10.1714 11.0173 10.4571 11.3172L11.6 12.5172C11.7415 12.6658 11.9378 12.75 12.1431 12.75C12.3483 12.75 12.5446 12.6658 12.6862 12.5172L15.5433 9.5172Z" fill="currentColor"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M1.29266 2.7512C1.43005 2.36044 1.8582 2.15503 2.24896 2.29242L2.55036 2.39838C3.16689 2.61511 3.69052 2.79919 4.10261 3.00139C4.54324 3.21759 4.92109 3.48393 5.20527 3.89979C5.48725 4.31243 5.60367 4.76515 5.6574 5.26153C5.66124 5.29706 5.6648 5.33321 5.66809 5.36996L17.1203 5.36996C17.9389 5.36995 18.7735 5.36993 19.4606 5.44674C19.8103 5.48584 20.1569 5.54814 20.4634 5.65583C20.7639 5.76141 21.0942 5.93432 21.3292 6.23974C21.711 6.73613 21.7777 7.31414 21.7416 7.90034C21.7071 8.45845 21.5686 9.15234 21.4039 9.97723L21.3935 10.0295L21.3925 10.0341L20.8836 12.5033C20.7339 13.2298 20.6079 13.841 20.4455 14.3231C20.2731 14.8346 20.0341 15.2842 19.6076 15.6318C19.1811 15.9793 18.6925 16.1226 18.1568 16.1882C17.6518 16.25 17.0278 16.25 16.2862 16.25L10.8804 16.25C9.53464 16.25 8.44479 16.25 7.58656 16.1283C6.69032 16.0012 5.93752 15.7285 5.34366 15.1022C4.79742 14.526 4.50529 13.9144 4.35897 13.0601C4.22191 12.2598 4.20828 11.2125 4.20828 9.75996V7.03832C4.20828 6.29837 4.20726 5.80316 4.16611 5.42295C4.12678 5.0596 4.05708 4.87818 3.96682 4.74609C3.87876 4.61723 3.74509 4.4968 3.44186 4.34802C3.11902 4.18961 2.68026 4.03406 2.01266 3.79934L1.75145 3.7075C1.36068 3.57012 1.15527 3.14197 1.29266 2.7512ZM5.70828 6.86996L5.70828 9.75996C5.70828 11.249 5.72628 12.1578 5.83744 12.8068C5.93933 13.4018 6.11202 13.7324 6.43219 14.0701C6.70473 14.3576 7.08235 14.5418 7.79716 14.6432C8.53783 14.7482 9.5209 14.75 10.9377 14.75H16.2406C17.0399 14.75 17.5714 14.7487 17.9746 14.6993C18.3573 14.6525 18.5348 14.571 18.66 14.469C18.7853 14.3669 18.9009 14.2095 19.024 13.8441C19.1537 13.4592 19.2623 12.9389 19.4237 12.156L19.9225 9.73591L19.9229 9.73369C20.1005 8.84376 20.217 8.2515 20.2444 7.80793C20.2704 7.38648 20.2043 7.23927 20.1429 7.15786C20.1367 7.15259 20.0931 7.11565 19.9661 7.07101C19.8107 7.01639 19.5895 6.97049 19.2939 6.93745C18.6991 6.87096 17.9454 6.86996 17.089 6.86996H5.70828Z" fill="currentColor"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M5.2502 19.5C5.2502 20.7426 6.25756 21.75 7.5002 21.75C8.74285 21.75 9.7502 20.7426 9.7502 19.5C9.7502 18.2573 8.74285 17.25 7.5002 17.25C6.25756 17.25 5.2502 18.2573 5.2502 19.5ZM7.5002 20.25C7.08599 20.25 6.7502 19.9142 6.7502 19.5C6.7502 19.0857 7.08599 18.75 7.5002 18.75C7.91442 18.75 8.2502 19.0857 8.2502 19.5C8.2502 19.9142 7.91442 20.25 7.5002 20.25Z" fill="currentColor"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M14.25 19.5001C14.25 20.7427 15.2574 21.7501 16.5 21.7501C17.7426 21.7501 18.75 20.7427 18.75 19.5001C18.75 18.2574 17.7426 17.2501 16.5 17.2501C15.2574 17.2501 14.25 18.2574 14.25 19.5001ZM16.5 20.2501C16.0858 20.2501 15.75 19.9143 15.75 19.5001C15.75 19.0859 16.0858 18.7501 16.5 18.7501C16.9142 18.7501 17.25 19.0859 17.25 19.5001C17.25 19.9143 16.9142 20.2501 16.5 20.2501Z" fill="currentColor"/>
                </svg>
                <span suppressHydrationWarning className="flex items-center justify-center font-medium text-[10px] absolute -right-1.5 -top-1.5 bg-primary w-4 h-4 rounded-full text-white">
                  {product.length}
                </span>
              </span>
              <span suppressHydrationWarning className="font-medium text-custom-sm text-dark hidden sm:inline-block pl-0.5">
                S/. {totalPrice.toFixed(2)}
              </span>
            </button>

            {/* Hamburger Toggle BTN Mobile */}
            <button
              id="Toggle"
              aria-label="Toggler"
              className="xl:hidden block ml-2"
              onClick={() => setNavigationOpen(!navigationOpen)}
            >
              <span className="block relative cursor-pointer w-5.5 h-5.5">
                <span className="du-block absolute right-0 w-full h-full">
                  <span className={`block relative top-0 left-0 bg-dark rounded-sm w-0 h-0.5 my-1 ease-in-out duration-200 delay-[0] ${!navigationOpen && "!w-full delay-300"}`}></span>
                  <span className={`block relative top-0 left-0 bg-dark rounded-sm w-0 h-0.5 my-1 ease-in-out duration-200 delay-150 ${!navigationOpen && "!w-full delay-400"}`}></span>
                  <span className={`block relative top-0 left-0 bg-dark rounded-sm w-0 h-0.5 my-1 ease-in-out duration-200 delay-200 ${!navigationOpen && "!w-full delay-500"}`}></span>
                </span>
                <span className="block absolute right-0 w-full h-full rotate-45">
                  <span className={`block bg-dark rounded-sm ease-in-out duration-200 delay-300 absolute left-2.5 top-0 w-0.5 h-full ${!navigationOpen && "!h-0 delay-[0]"}`}></span>
                  <span className={`block bg-dark rounded-sm ease-in-out duration-200 delay-400 absolute left-0 top-2.5 w-full h-0.5 ${!navigationOpen && "!h-0 dealy-200"}`}></span>
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`w-full absolute left-0 top-full xl:hidden bg-surface shadow-neu border-t border-gray-3 overflow-hidden transition-all duration-300 ease-in-out ${navigationOpen ? "max-h-[500px] visible py-4" : "max-h-0 invisible py-0"}`}>
          {/* Mobile Search */}
          <div className="px-4 sm:px-7.5 mb-3">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={(e) => e.key === "Enter" && setNavigationOpen(false)}
                placeholder="Buscar productos..."
                className="w-full h-9 pl-3 pr-9 rounded-xl shadow-neu-sm bg-surface text-sm text-dark placeholder:text-gray-4 focus:outline-none"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-4 w-4 h-4 pointer-events-none" />
            </div>
          </div>
          <nav className="px-4 sm:px-7.5">
            <ul className="flex flex-col gap-4">
              {menuData.map((menuItem, i) =>
                menuItem.submenu ? (
                  <Dropdown key={i} menuItem={menuItem} stickyMenu={stickyMenu} />
                ) : (
                  <li key={i}>
                    <Link
                      href={menuItem.path ?? "/"}
                      className="text-custom-sm font-medium text-dark hover:text-primary"
                      onClick={() => setNavigationOpen(false)}
                    >
                      {menuItem.title}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
