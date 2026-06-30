"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Breadcrumb from "@/tienda/components/Common/Breadcrumb";
import { WHATSAPP_URL } from "@/lib/constants";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/tienda/store/store";
import {
  removeItemFromCart,
  updateCartItemQuantity,
  removeAllItemsFromCart,
} from "@/tienda/store/features/cart-slice";

const Checkout = () => {
  const { items: cartItems } = useSelector((state: RootState) => state.cartReducer);
  const dispatch: AppDispatch = useDispatch();

  const orderTotal = cartItems.reduce(
    (acc, item) => acc + (item.discountedPrice || item.price) * item.quantity,
    0
  );

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [sent, setSent] = useState(false);

  const isFormValid =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.address.trim() !== "" &&
    formData.city.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.email.includes("@");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  function handleConfirm() {
    if (!isFormValid || cartItems.length === 0) return;

    const productList = cartItems
      .map((item) => `• ${item.title} x${item.quantity} — S/. ${((item.discountedPrice || item.price) * item.quantity).toFixed(2)}`)
      .join("\n");

    const parts = [
      `Hola, Monte Vida 🌿`,
      ``,
      `Me gustaría realizar el siguiente pedido:`,
      ``,
      `📦 Productos:`,
      productList,
      ``,
      `📍 Dirección: ${formData.address}, ${formData.city}`,
      `📞 Teléfono: ${formData.phone}`,
      `📧 Correo: ${formData.email}`,
    ];

    if (formData.notes.trim()) parts.push(``, `📝 Notas: ${formData.notes}`);

    parts.push(``, `💰 Total estimado: S/. ${orderTotal.toFixed(2)}`);

    window.open(
      `${WHATSAPP_URL}?text=${encodeURIComponent(parts.join("\n"))}`,
      "_blank"
    );

    dispatch(removeAllItemsFromCart());
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <Breadcrumb title={"Pedido enviado"} pages={["checkout"]} />
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[600px] mx-auto px-4 text-center">
            <div className="bg-white shadow-1 rounded-[10px] p-10 flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-2xl text-dark mb-2">¡Mensaje enviado!</h2>
                <p className="text-dark-4 text-sm">Se abrió WhatsApp con el resumen de tu pedido.</p>
              </div>
              <p className="text-dark-4 text-sm leading-relaxed max-w-sm">
                Enviá el mensaje para que nuestro equipo te contacte, confirme disponibilidad y coordine la entrega.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Link
                  href="/tienda"
                  className="flex-1 py-3 px-6 rounded-md border border-gray-3 text-dark font-medium text-sm hover:border-primary hover:text-primary transition-colors text-center"
                >
                  Seguir comprando
                </Link>
                <Link
                  href="/"
                  className="flex-1 py-3 px-6 rounded-md bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors text-center"
                >
                  Ir al inicio
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb title={"Checkout"} pages={["checkout"]} />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-11">
            {/* Formulario de datos */}
            <div className="lg:max-w-[670px] w-full">
              <div className="mt-9">
                <h2 className="font-medium text-dark text-xl sm:text-2xl mb-5.5">
                  Necesitamos algunos datos para continuar
                </h2>
                <div className="bg-white shadow-1 rounded-[10px] p-4 sm:p-8.5">
                  <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5">
                    <div className="w-full">
                      <label className="block mb-2.5">Nombres <span className="text-red">*</span></label>
                      <input
                        type="text" name="firstName" value={formData.firstName}
                        onChange={handleInputChange} required
                        className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block mb-2.5">Apellidos <span className="text-red">*</span></label>
                      <input
                        type="text" name="lastName" value={formData.lastName}
                        onChange={handleInputChange} required
                        className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div className="mb-5">
                    <label className="block mb-2.5">Dirección <span className="text-red">*</span></label>
                    <input
                      type="text" name="address" value={formData.address}
                      onChange={handleInputChange} required placeholder="Av, Calle, Nro"
                      className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="mb-5">
                    <label className="block mb-2.5">Ciudad / Distrito <span className="text-red">*</span></label>
                    <input
                      type="text" name="city" value={formData.city}
                      onChange={handleInputChange} required
                      className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5">
                    <div className="w-full">
                      <label className="block mb-2.5">Teléfono <span className="text-red">*</span></label>
                      <input
                        type="text" name="phone" value={formData.phone}
                        onChange={handleInputChange} required
                        className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block mb-2.5">Correo Electrónico <span className="text-red">*</span></label>
                      <input
                        type="email" name="email" value={formData.email}
                        onChange={handleInputChange} required
                        className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-1 rounded-[10px] p-4 sm:p-8.5 mt-7.5">
                <label htmlFor="notes" className="block mb-2.5">Notas adicionales <span className="text-dark-4 text-sm">(opcional)</span></label>
                <textarea
                  name="notes" id="notes" rows={3} value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Ej. Dejar en conserjería, llamar al llegar..."
                  className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full p-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Resumen de pedido */}
            <div className="max-w-[455px] w-full">
              <div className="bg-white shadow-1 rounded-[10px]">
                <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
                  <h3 className="font-medium text-xl text-dark">Resumen de pedido</h3>
                </div>
                <div className="pt-2.5 pb-8.5 px-4 sm:px-8.5">
                  <div className="flex items-center justify-between py-5 border-b border-gray-3">
                    <h4 className="font-medium text-dark">Producto</h4>
                    <h4 className="font-medium text-dark text-right">Subtotal</h4>
                  </div>

                  {cartItems.length === 0 ? (
                    <p className="text-dark-4 text-sm py-8 text-center">Tu carrito está vacío.</p>
                  ) : (
                    cartItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-5 border-b border-gray-3 gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {item.imgs?.thumbnails?.[0] && (
                            <Image
                              src={item.imgs.thumbnails[0]} alt={item.title}
                              width={40} height={40}
                              className="rounded-md object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-dark truncate" title={item.title}>{item.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  item.quantity > 1
                                    ? dispatch(updateCartItemQuantity({ id: item.id, quantity: item.quantity - 1 }))
                                    : dispatch(removeItemFromCart(item.id))
                                }
                                className="flex items-center justify-center w-6 h-6 rounded bg-gray-2 text-dark hover:bg-gray-3 font-bold text-sm"
                              >−</button>
                              <span className="text-sm font-semibold text-dark w-5 text-center">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => dispatch(updateCartItemQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                                className="flex items-center justify-center w-6 h-6 rounded bg-gray-2 text-dark hover:bg-gray-3 font-bold text-sm"
                              >+</button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-dark text-right">
                            S/. {((item.discountedPrice || item.price) * item.quantity).toFixed(2)}
                          </p>
                          <button
                            type="button"
                            onClick={() => dispatch(removeItemFromCart(item.id))}
                            className="flex items-center justify-center w-7 h-7 rounded bg-gray-2 text-dark hover:bg-red-light-6 hover:text-red ease-out duration-200"
                            title="Eliminar producto"
                          >
                            <svg className="fill-current" width="14" height="14" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M9.45017 2.06252H12.5498C12.7482 2.06239 12.921 2.06228 13.0842 2.08834C13.7289 2.19129 14.2868 2.59338 14.5883 3.17244C14.6646 3.319 14.7192 3.48298 14.7818 3.6712L14.8841 3.97819C14.9014 4.03015 14.9064 4.04486 14.9105 4.05645C15.0711 4.50022 15.4873 4.80021 15.959 4.81217C15.9714 4.81248 15.9866 4.81254 16.0417 4.81254H18.7917C19.1714 4.81254 19.4792 5.12034 19.4792 5.50004C19.4792 5.87973 19.1714 6.18754 18.7917 6.18754H3.20825C2.82856 6.18754 2.52075 5.87973 2.52075 5.50004C2.52075 5.12034 2.82856 4.81254 3.20825 4.81254H5.95833C6.01337 4.81254 6.02856 4.81248 6.04097 4.81217C6.51273 4.80021 6.92892 4.50024 7.08944 4.05647C7.09366 4.0448 7.09852 4.03041 7.11592 3.97819L7.21823 3.67122C7.28083 3.48301 7.33538 3.319 7.41171 3.17244C7.71324 2.59339 8.27112 2.19129 8.91581 2.08834C9.079 2.06228 9.25181 2.06239 9.45017 2.06252ZM8.25739 4.81254C8.30461 4.71993 8.34645 4.6237 8.38245 4.52419C8.39338 4.49397 8.4041 4.4618 8.41787 4.42048L8.50936 4.14601C8.59293 3.8953 8.61217 3.84416 8.63126 3.8075C8.73177 3.61448 8.91773 3.48045 9.13263 3.44614C9.17345 3.43962 9.22803 3.43754 9.49232 3.43754H12.5077C12.772 3.43754 12.8265 3.43962 12.8674 3.44614C13.0823 3.48045 13.2682 3.61449 13.3687 3.8075C13.3878 3.84416 13.4071 3.89529 13.4906 4.14601L13.5821 4.42031L13.5821 4.42031L13.6176 4.52421C13.6535 4.62372 13.6954 4.71994 13.7426 4.81254H8.25739Z" fill="" />
                              <path d="M5.42208 7.74597C5.39683 7.36711 5.06923 7.08047 4.69038 7.10572C4.31152 7.13098 4.02487 7.45858 4.05013 7.83743L4.47496 14.2099C4.55333 15.3857 4.61663 16.3355 4.76511 17.0808C4.91947 17.8557 5.18203 18.5029 5.72432 19.0103C6.26662 19.5176 6.92987 19.7365 7.7133 19.839C8.46682 19.9376 9.41871 19.9376 10.5971 19.9375H11.4028C12.5812 19.9376 13.5332 19.9376 14.2867 19.839C15.0701 19.7365 15.7334 19.5176 16.2757 19.0103C16.818 18.5029 17.0805 17.8557 17.2349 17.0808C17.3834 16.3355 17.4467 15.3857 17.525 14.2099L17.9499 7.83743C17.9751 7.45858 17.6885 7.13098 17.3096 7.10572C16.9308 7.08047 16.6032 7.36711 16.5779 7.74597L16.1563 14.0702C16.0739 15.3057 16.0152 16.1654 15.8864 16.8122C15.7614 17.4396 15.5869 17.7717 15.3363 18.0062C15.0857 18.2406 14.7427 18.3926 14.1084 18.4756C13.4544 18.5612 12.5927 18.5625 11.3545 18.5625H10.6455C9.40727 18.5625 8.54559 18.5612 7.89164 18.4756C7.25731 18.3926 6.91433 18.2406 6.6637 18.0062C6.41307 17.7717 6.2386 17.4396 6.11361 16.8122C5.98476 16.1654 5.92607 15.3057 5.8437 14.0702L5.42208 7.74597Z" fill="" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="flex items-center justify-between pt-5">
                    <p className="font-semibold text-xl text-dark">Total</p>
                    <p className="font-semibold text-xl text-primary text-right">S/. {orderTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!isFormValid || cartItems.length === 0}
                onClick={handleConfirm}
                className={`w-full flex justify-center items-center gap-2 font-medium py-3 px-6 rounded-md transition-colors duration-200 mt-7.5 focus:outline-2 focus:outline-offset-2 ${
                  isFormValid && cartItems.length > 0
                    ? "text-white bg-accent hover:bg-accent-dark cursor-pointer focus:outline-accent/60"
                    : "text-gray-400 bg-gray-3 cursor-not-allowed opacity-60"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Completar la orden por WhatsApp
              </button>

              <p className="text-xs text-dark-4 text-center mt-4">
                Se abrirá WhatsApp con el resumen de tu pedido para coordinar la entrega con nuestro equipo.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Checkout;
