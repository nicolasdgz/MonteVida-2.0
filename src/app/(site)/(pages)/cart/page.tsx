import React from "react";
import Cart from "@/tienda/components/Cart";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Cart Page | Monte Vida Peru",
  description: "This is Cart Page",
  // other metadata
};

const CartPage = () => {
  return (
    <>
      <Cart />
    </>
  );
};

export default CartPage;
