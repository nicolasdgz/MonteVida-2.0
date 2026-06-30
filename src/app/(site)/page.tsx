import Home from "@/tienda/components/Home";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monte Vida Perú | Suplementos y Productos Naturales",
  description: "Tienda oficial Monte Vida Perú: gomitas de colágeno, omega 3, vitaminas y suplementos naturales con envío a todo el país y calidad certificada.",
  alternates: {
    canonical: "https://www.montevida.pe",
  },
  icons: {
    icon: "/images/logo/favicon-montevidaperu.webp",
  },
};

export default function HomePage() {
  return (
    <>
      <Home />
    </>
  );
}
