import type { Metadata } from "next";
import { WHATSAPP_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Política de Privacidad",
};

export default function PoliticaDePrivacidad() {
  return (
    <section className="overflow-hidden py-20 bg-gray-2">
      <div className="max-w-[860px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="bg-white rounded-[10px] shadow-1 p-8 sm:p-12">
          <h1 className="font-bold text-dark text-3xl sm:text-4xl mb-3">
            Política de Privacidad
          </h1>
          <p className="text-dark-4 text-sm mb-10">
            Última actualización: {new Date().getFullYear()}
          </p>

          <div className="flex flex-col gap-8 text-dark-4 leading-relaxed">

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">Introducción</h2>
              <p>
                En <strong className="text-dark">Montevida</strong> valoramos y respetamos tu privacidad.
                Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos tu información
                cuando visitas nuestra tienda en línea o realizas una compra a través de nuestros canales.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">1. Información que recopilamos</h2>
              <p className="mb-3">Al momento de realizar una compra o navegar por nuestra tienda on-line, podemos recopilar los siguientes datos:</p>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2">
                <li>Nombre completo</li>
                <li>Número de teléfono o WhatsApp</li>
                <li>Correo electrónico</li>
                <li>Dirección de entrega</li>
                <li>Documento de identidad DNI o RUC (cuando sea necesario para la emisión de comprobantes)</li>
                <li>Dirección IP, tipo de navegador y actividad de navegación en nuestra tienda on-line</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">2. Uso de la información</h2>
              <p className="mb-3">Los datos que nos proporcionas los utilizamos para:</p>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2">
                <li>Procesar tus pedidos y coordinar la entrega de tus productos</li>
                <li>Comunicarnos contigo a través de WhatsApp, correo electrónico o llamada telefónica</li>
                <li>Enviarte promociones, novedades y ofertas exclusivas (solo si nos lo autorizas)</li>
                <li>Mejorar la experiencia de compra en nuestra plataforma</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">3. Protección de tus datos</h2>
              <p>
                Aplicamos medidas de seguridad tecnológicas y administrativas para proteger tu
                información personal contra accesos no autorizados, pérdida, alteración o mal uso.
                Tu información es tratada con total confidencialidad por nuestro equipo.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">4. Compartición de información</h2>
              <p>
                <strong className="text-dark">No vendemos tu información personal a terceros.</strong> Solo
                compartimos los datos estrictamente necesarios con:
              </p>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2 mt-3">
                <li>Empresas logísticas y de mensajería encargadas de realizar las entregas como Shalom, Olva Courier, entre otras.</li>
                <li>Plataformas de pago autorizadas para procesar transacciones de forma segura como Yape, Plin, BCP, Interbank, etc.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">5. Tus derechos</h2>
              <p>
                Tienes derecho a acceder, modificar o solicitar la eliminación de tu información personal
                en cualquier momento. Para ejercer estos derechos, puedes contactarnos directamente a
                través de nuestro WhatsApp o correo de soporte y atenderemos tu solicitud.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">6. Cookies</h2>
              <p>
                Nuestro sitio web puede utilizar tecnologías de almacenamiento local (como localStorage)
                para recordar tu carrito de compras entre sesiones. No utilizamos cookies de rastreo de
                terceros con fines publicitarios. Puedes limpiar el almacenamiento local desde la
                configuración de tu navegador en cualquier momento.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">7. Actualizaciones de esta política</h2>
              <p>
                Esta Política de Privacidad puede ser actualizada periódicamente para reflejar cambios
                en nuestras prácticas o en la legislación aplicable. Te notificaremos cualquier cambio
                relevante a través de nuestros canales de comunicación habituales.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">8. Contacto</h2>
              <p>
                Si tienes preguntas, dudas o solicitudes relacionadas con esta política, puedes
                comunicarte con nosotros por los siguientes medios:
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

          </div>
        </div>
      </div>
    </section>
  );
}
