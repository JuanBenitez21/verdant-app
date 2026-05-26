import sgMail from '@sendgrid/mail';

// En producción: URL web de la app. En dev: se usa el deep link scheme "verdant://"
const APP_URL = process.env['APP_PUBLIC_URL'] ?? 'verdant:/';

export async function sendGodparentEmail(
  godparentEmail: string,
  userName: string,
  token: string,
  daysCount: number,
): Promise<void> {
  const link = `${APP_URL}/padrino/confirmar/${token}`;
  const subject = `🌱 ${userName} necesita tu confirmación — día ${daysCount}`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <body style="font-family: sans-serif; background: #f5f2eb; padding: 32px; margin: 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 32px;">
        <p style="color: #2d7a4f; font-size: 14px; font-weight: 600; margin: 0 0 16px;">🌿 Verdant</p>
        <h1 style="color: #0d1f15; font-size: 24px; margin: 0 0 12px;">Tu apadrinado/a necesita tu visto bueno</h1>
        <p style="color: #3a5245; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
          <strong>${userName}</strong> reportó su <strong>día ${daysCount}</strong> sin fumar
          y necesita tu confirmación para que su planta siga creciendo. 🌱
        </p>
        <a href="${link}"
           style="display: block; background: #3d9e67; color: #ffffff; text-decoration: none;
                  padding: 16px 24px; border-radius: 18px; text-align: center;
                  font-weight: 600; font-size: 16px; margin-bottom: 24px;">
          ✅ Confirmar el día de ${userName}
        </a>
        <p style="color: #7a9a87; font-size: 13px; margin: 0;">
          Este enlace expira a medianoche de hoy. No necesitas crear una cuenta.
        </p>
      </div>
    </body>
    </html>
  `;

  const apiKey = process.env['SENDGRID_API_KEY'] ?? '';

  if (!apiKey || apiKey.startsWith('SG.placeholder')) {
    console.log('[email.service] SENDGRID sin configurar — email simulado:');
    console.log(`  Para: ${godparentEmail}`);
    console.log(`  Asunto: ${subject}`);
    console.log(`  Link: ${link}`);
    return;
  }

  sgMail.setApiKey(apiKey);
  await sgMail.send({
    to: godparentEmail,
    from: 'noreply@verdant.app',
    subject,
    html,
  });
}
