import type { Metadata } from "next";
import { WHATSAPP_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Política de Envíos",
};

export default function PoliticaDeEnvios() {
  return (
    <section className="overflow-hidden py-20 bg-gray-2">
      <div className="max-w-[860px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="bg-white rounded-[10px] shadow-1 p-8 sm:p-12">
          <h1 className="font-bold text-dark text-3xl sm:text-4xl mb-3">
            Política de Envíos
          </h1>
          <p className="text-dark-4 text-sm mb-10">
            Última actualización: {new Date().getFullYear()}
          </p>

          <div className="flex flex-col gap-8 text-dark-4 leading-relaxed">

            <div>
              <p>
                En <strong className="text-dark">Montevida</strong> realizamos envíos gratis
                a todo el Perú 🇵🇪. Queremos que recibas tus productos de forma rápida,
                segura y sin costos adicionales.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">1. Cobertura</h2>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2">
                <li><strong className="text-dark">Lima Metropolitana:</strong> Entregas realizadas con motorizados propios.</li>
                <li><strong className="text-dark">Provincias:</strong> Envíos a través de Shalom, Olva Courier, Marvisur u otra agencia según la ubicación del cliente.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">2. Tiempo de entrega</h2>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2">
                <li><strong className="text-dark">Lima:</strong> Pedidos realizados antes de las 12:00 pm llegan el mismo día entre 2:00 pm y 7:00 pm. Pedidos posteriores a las 12:00 pm se entregan al día siguiente.</li>
                <li><strong className="text-dark">Provincias:</strong> De 1 a 2 días hábiles según la agencia de envío.</li>
              </ul>
              <p className="mt-3">
                Los tiempos de entrega pueden variar por condiciones climáticas, feriados nacionales u otros factores externos fuera de nuestro control.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">3. Costo de envío</h2>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2">
                <li><strong className="text-dark">Lima:</strong> Envío gratuito. Opción de envío Express disponible desde S/. 80.</li>
                <li><strong className="text-dark">Provincias:</strong> Envío gratuito desde S/. 80 según destino.</li>
              </ul>
              <p className="mt-3">El monto exacto del envío, si aplica, será confirmado antes del despacho de tu pedido.</p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">4. Confirmación del pedido</h2>
              <p>
                Todos los pedidos son confirmados por llamada o WhatsApp antes de ser enviados.
                Si no obtenemos respuesta en un plazo de 24 horas, el pedido será pausado hasta
                poder coordinar la entrega contigo.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">5. Recepción del pedido</h2>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2">
                <li>El cliente debe estar disponible en la dirección indicada para recibir el pedido.</li>
                <li>Direcciones incorrectas o reprogramaciones de entrega pueden generar un costo adicional.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">6. Métodos de pago contra entrega (Lima)</h2>
              <p>Para pedidos en Lima, aceptamos los siguientes métodos de pago al momento de la entrega:</p>
              <ul className="list-disc list-inside flex flex-col gap-2 pl-2 mt-3">
                <li>Efectivo</li>
                <li>Yape, Plin, Transferencia bancaria o Tarjeta de débito</li>
                <li>Tarjeta de crédito (con recargo de S/. 5)</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">7. Seguimiento del pedido</h2>
              <p>
                Una vez despachado tu pedido, te proporcionaremos el número de guía o constancia
                correspondiente para que puedas rastrear tu envío con la agencia de transporte.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-dark text-xl mb-3">8. Retrasos en la entrega</h2>
              <p>
                Montevida hace seguimiento de cada pedido hasta su entrega. Sin embargo, no nos
                responsabilizamos por demoras ocasionadas por las agencias de transporte externas,
                condiciones climáticas u otros factores ajenos a nuestra operación.
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
