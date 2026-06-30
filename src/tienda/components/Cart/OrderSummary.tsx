import { selectTotalPrice } from "@/tienda/store/features/cart-slice";
import { useAppSelector } from "@/tienda/store/store";
import React from "react";
import { useSelector } from "react-redux";
import Link from "next/link";

const OrderSummary = () => {
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const totalPrice = useSelector(selectTotalPrice);

  return (
    <div className="lg:max-w-[455px] w-full">
      {/* <!-- order list box --> */}
      <div className="bg-white shadow-1 rounded-[10px]">
        <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
          <h3 className="font-medium text-xl text-dark">Resumen de Compra</h3>
        </div>

        <div className="pt-2.5 pb-8.5 px-4 sm:px-8.5">
          {/* <!-- title --> */}
          <div className="flex items-center justify-between py-5 border-b border-gray-3">
            <div>
              <h4 className="font-medium text-dark">Producto</h4>
            </div>
            <div>
              <h4 className="font-medium text-dark text-right">Subtotal</h4>
            </div>
          </div>

          {/* <!-- product item --> */}
          {cartItems.map((item, key) => (
            <div key={key} className="flex items-center justify-between py-5 border-b border-gray-3">
              <div>
                <p className="text-dark">
                  {item.title} <span className="text-dark-5 font-semibold text-sm">x {item.quantity}</span>
                </p>
              </div>
              <div>
                <p className="text-dark text-right">
                  S/. {(item.discountedPrice * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          {/* <!-- total --> */}
          <div className="flex items-center justify-between pt-5">
            <div>
              <p className="font-medium text-lg text-dark">Total</p>
            </div>
            <div>
              <p className="font-medium text-lg text-dark text-right">
                S/. {totalPrice}
              </p>
            </div>
          </div>

          {/* <!-- checkout button --> */}
          <Link
            href="/checkout"
            className="w-full flex justify-center font-medium text-white bg-accent py-3 px-6 rounded-md ease-out duration-200 hover:bg-accent-dark focus:outline-2 focus:outline-offset-2 focus:outline-accent/60 mt-7.5"
          >
            Ir a comprar
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
