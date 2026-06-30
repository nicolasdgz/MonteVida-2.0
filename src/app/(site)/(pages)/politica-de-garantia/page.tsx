import type { Metadata } from "next";
import { WHATSAPP_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Política de Garantía",
};

export default function PoliticaDeGarantia() {
  return (
    <section className="overflow-hidden py-20 bg-gray-2">
      <div className="max-w-[860px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="bg-white rounded-[10px] shadow-1 p-8 sm:p-12">
          <h1 className="font-bold text-dark text-3xl sm:text-4xl mb-3">
            Política de Garantía
          </h1>
          <p className="text-dark-4 text-sm mb-10">
            Última actualización: {new Date().getFullYear()}
          </p>

          <div className="flex flex-col gap-8 text-dark-4 leading-relaxed">

            <div>
              <p>
                En <strong className="text-dark">Montevida</strong> nos comprometemos a ofrecerte
                productos de calidad. Por ello, todos nuestros productos incluyen una garantía
                válida por <strong className="text-dark">1 día posterior al momento de recepción</strong>.
                Te pedimos verificar el estado del producto en el instante en que lo recibas.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">Condiciones de la garantía</h2>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2">
                <li>La garantía aplica únicamente durante las 24 horas siguientes a la recepción del producto.</li>
                <li>El cliente debe verificar el producto al momento de recibirlo.</li>
                <li>Cualquier problema, defecto o inconformidad debe ser reportado dentro de ese plazo.</li>
                <li>El reclamo debe estar acompañado del comprobante de compra correspondiente.</li>
                <li>Pasado el plazo de 24 horas, no se aceptarán cambios ni reclamos.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">Cómo reportar un problema</h2>
              <p>
                Si detectas algún inconveniente con tu pedido dentro del plazo indicado, comunícate
                de inmediato con nuestro equipo de soporte adjuntando tu comprobante de compra y
                una descripción o fotografía del problema:
              </p>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2 mt-3">
                <li>
                  <strong className="text-dark">WhatsApp:</strong>{" "}
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Escríbenos por WhatsApp
                  </a>
                </li>
                <li>
                  <strong className="text-dark">Correo:</strong>{" "}
                  <a href="mailto:soporte@montevida.pe" className="text-primary hover:underline">
                    soporte@montevida.pe
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">Casos no cubiertos por la garantía</h2>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2">
                <li>Reclamos realizados después de las 24 horas de recepción del producto.</li>
                <li>Daños ocasionados por mal uso o manipulación inadecuada del producto.</li>
                <li>Productos sin comprobante de compra.</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
