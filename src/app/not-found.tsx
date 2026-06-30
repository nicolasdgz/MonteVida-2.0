import Link from "next/link";
import type { Metadata } from "next";
import ClientProviders from "./(site)/ClientProviders";

export const metadata: Metadata = {
  title: "Página no encontrada | Montevida",
};

export default function NotFound() {
  return (
    <ClientProviders>
      <div className="min-h-[60vh] bg-gray-2 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-primary font-semibold text-lg mb-3 tracking-wide uppercase">
          Error 404
        </p>

        <h1 className="text-dark font-bold text-4xl sm:text-5xl mb-4 leading-tight">
          Página no encontrada
        </h1>

        <p className="text-dark-4 text-lg max-w-md mb-10">
          Lo sentimos, la página que buscas no existe.
        </p>

        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 bg-primary text-white font-medium py-3 px-8 rounded-md ease-out duration-200 hover:bg-primary-dark focus:outline-2 focus:outline-offset-2 focus:outline-primary/60"
        >
          Seguir comprando
        </Link>
      </div>
    </ClientProviders>
  );
}
