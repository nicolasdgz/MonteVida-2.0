import React from "react";
import ShopWithSidebar from "@/tienda/components/ShopWithSidebar";
import { getStoreProducts, getStoreCategories } from "@/tienda/data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tienda | Monte Vida Peru",
  description: "Explora todos nuestros productos naturales",
};

const ShopWithSidebarPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) => {
  const { q } = await searchParams;
  const storeProducts = await getStoreProducts();
  const rawCategories = await getStoreCategories();

  return (
    <main>
      <ShopWithSidebar
        products={storeProducts}
        categoriesList={[...rawCategories]}
        initialQ={q ?? ""}
      />
    </main>
  );
};

export default ShopWithSidebarPage;
