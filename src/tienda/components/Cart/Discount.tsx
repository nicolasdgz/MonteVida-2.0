"use client";
import React, { useState } from "react";

const Discount = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) setError(true);
  };

  return (
    <div className="lg:max-w-[670px] w-full">
      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow-1 rounded-[10px]">
          <div className="border-b border-gray-3 py-5 px-4 sm:px-5.5">
            <h3 className="">¿Tienes un código de descuento?</h3>
          </div>

          <div className="py-8 px-4 sm:px-8.5">
            <div className="flex flex-wrap gap-4 xl:gap-5.5">
              <div className="max-w-[426px] w-full">
                <input
                  type="text"
                  name="coupon"
                  id="coupon"
                  placeholder="Ingresa tu código"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(false); }}
                  className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-primary/20"
                />
                {error && (
                  <p className="mt-2 text-sm text-red">No existe código promocional</p>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex font-medium text-white bg-primary py-3 px-8 rounded-md ease-out duration-200 hover:bg-primary-dark"
              >
                Aplicar Código
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Discount;
