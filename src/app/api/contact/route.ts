import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Resend } from "resend";
import { rateLimit } from "@/lib/rateLimit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(ip, 5, 60_000)) {
    return new NextResponse("Demasiadas solicitudes. Intenta más tarde.", { status: 429 });
  }
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY no configurada");
    return NextResponse.json({ error: "Servicio de correo no disponible." }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body = await request.json();
    const { entityType, firstName, lastName, email, ruc, subject, phone, message } = body;

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "Nombre, apellido, correo y mensaje son requeridos." },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "El correo electrónico no es válido." },
        { status: 400 }
      );
    }

    const isEmpresa = entityType === "Empresa";
    const safe = {
      entityType: escapeHtml(entityType || "Persona Natural"),
      ruc: escapeHtml(ruc || "No proporcionado"),
      firstName: escapeHtml(firstName),
      lastName: escapeHtml(lastName),
      email: escapeHtml(email),
      subject: escapeHtml(subject || "Sin asunto"),
      phone: escapeHtml(phone || "No proporcionado"),
      message: escapeHtml(message),
    };
    const rucRow = isEmpresa
      ? `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">RUC:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${safe.ruc}</td>
          </tr>
        `
      : "";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #4CAF50;">Nuevo Mensaje de Contacto</h2>
        <p>Has recibido un nuevo mensaje a través del formulario de contacto.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Tipo de Entidad:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${safe.entityType}</td>
          </tr>
          ${rucRow}
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nombre Completo:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${safe.firstName} ${safe.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Correo:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${safe.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Asunto:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${safe.subject}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Teléfono:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${safe.phone}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Mensaje:</td>
            <td style="padding: 8px; border: 1px solid #ddd; white-space: pre-wrap;">${safe.message}</td>
          </tr>
        </table>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "Monte Vida <soporte@montevida.pe>",
      to: ["soporte@montevida.pe"], // Delivering to the store owner
      replyTo: email, // Set the reply-to header
      subject: `Nuevo mensaje de contacto: ${subject || "Sin asunto"}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend send error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
