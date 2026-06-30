import Contact from "@/tienda/components/Contact";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Contact Page | Monte Vida Peru",
  description: "This is Contact Page",
  // other metadata
};

const ContactPage = () => {
  return (
    <main>
      <Contact />
    </main>
  );
};

export default ContactPage;
