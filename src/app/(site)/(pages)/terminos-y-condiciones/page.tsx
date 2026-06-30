import type { Metadata } from "next";
import { WHATSAPP_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
};

export default function TerminosYServicios() {
  return (
    <section className="overflow-hidden py-20 bg-gray-2">
      <div className="max-w-[860px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="bg-white rounded-[10px] shadow-1 p-8 sm:p-12">
          <h1 className="font-bold text-dark text-3xl sm:text-4xl mb-3">
            Términos y Condiciones
          </h1>
          <p className="text-dark-4 text-sm mb-10">
            Última actualización: {new Date().getFullYear()}
          </p>

          <div className="flex flex-col gap-8 text-dark-4 leading-relaxed">

            <div>
              <p>
                Bienvenido a <strong className="text-dark">MonteVida.Pe</strong>. Al acceder y utilizar
                nuestra tienda on-line o realizar una compra, aceptas los siguientes Términos y Condiciones.
                Te recomendamos leerlos detenidamente antes de continuar.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">1. Objeto</h2>
              <p>
                Estos Términos regulan el acceso, uso y compras realizadas en nuestra tienda en línea
                <strong className="text-dark"> montevida.pe</strong>. Al utilizar nuestros servicios,
                confirmas que has leído, entendido y aceptado estos términos en su totalidad.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">2. Información del cliente</h2>
              <p>
                Al realizar una compra, el cliente debe proporcionar información verídica, completa y
                actualizada. Montevida no se responsabiliza por errores en la entrega ocasionados por
                datos incorrectos proporcionados por el cliente.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">3. Precios y pagos</h2>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2">
                <li>Todos los precios incluyen los impuestos legales aplicables en el Perú.</li>
                <li>Métodos de pago aceptados: Yape, Plin, transferencias bancarias y pago contra entrega en Lima.</li>
                <li>Para envíos a provincias se solicita un adelanto mínimo según el monto del pedido.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">4. Envíos</h2>
              <p className="mb-3">Trabajamos con las principales agencias de envíos del país:</p>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2">
                <li><strong className="text-dark">Lima:</strong> Entrega en 24 horas aproximadamente.</li>
                <li><strong className="text-dark">Provincias:</strong> De 1 a 2 días hábiles a través de Shalom, Olva Courier u otras agencias según ubicación.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">5. Cambios y devoluciones</h2>
              <p>
                Solo se aceptarán cambios o devoluciones en caso de defectos de fábrica o error
                en el envío por parte de Montevida. El cliente debe reportar el inconveniente dentro
                de las 24 horas posteriores a la recepción del producto, adjuntando el comprobante
                de compra y evidencia del problema.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">6. Responsabilidad</h2>
              <p>
                Montevida no se responsabiliza por retrasos en la entrega ocasionados por las agencias
                de mensajería, condiciones climáticas, feriados nacionales u otros eventos de fuerza
                mayor ajenos a nuestra operación.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">7. Propiedad intelectual</h2>
              <p>
                Todo el contenido de este sitio web, incluyendo logotipos, imágenes, textos y diseños,
                es propiedad de <strong className="text-dark">Montevida</strong>. Queda prohibida su
                reproducción, distribución o uso sin autorización previa y por escrito.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">8. Modificaciones</h2>
              <p>
                Montevida se reserva el derecho de actualizar o modificar estos Términos y Condiciones
                en cualquier momento. Los cambios entrarán en vigor desde su publicación en el sitio web.
                Te recomendamos revisarlos periódicamente.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">9. Ley aplicable</h2>
              <p>
                Estos Términos y Condiciones se rigen por la legislación peruana vigente. Cualquier
                controversia derivada del uso de nuestros servicios será resuelta conforme a las
                leyes de la República del Perú.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">¿Tienes alguna consulta?</h2>
              <p>Puedes contactarnos por cualquiera de nuestros canales de atención:</p>
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
