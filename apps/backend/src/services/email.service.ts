import sgMail from '@sendgrid/mail';
import { getPlantStage } from '../utils/plant.utils';

const PLANT_TYPE_EMOJIS: Record<string, string> = {
  sakura:   '🌸',
  clasico:  '🌿',
  orquidea: '🌺',
  cactus:   '🌵',
};

function buildGodparentEmailHTML(
  plantEmoji: string,
  userName: string,
  daysCount: number,
  token: string,
): string {
  const expoGoLink = `exp+verdant://padrino/confirmar/${token}`;
  const httpLink = `${process.env['FRONTEND_URL'] ?? 'https://verdant.app'}/padrino/confirmar/${token}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, sans-serif; background: #f5f2eb; margin: 0; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: #1e5435; padding: 32px 24px; text-align: center; }
    .logo { font-size: 28px; color: #5ec287; font-weight: 300; letter-spacing: 1px; }
    .plant { font-size: 56px; display: block; margin: 12px 0 0; }
    .body { padding: 28px 24px; }
    .title { font-size: 22px; color: #0d1f15; margin: 0 0 8px; font-weight: 500; }
    .subtitle { font-size: 15px; color: #7a9a87; margin: 0 0 24px; line-height: 1.5; }
    .streak-badge { background: #eaf7f1; border-radius: 20px; padding: 10px 18px; display: inline-block; font-size: 14px; color: #2d7a4f; font-weight: 500; margin-bottom: 24px; }
    .btn-primary { display: block; background: #3d9e67; color: white; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: 600; margin-bottom: 12px; }
    .btn-secondary { display: block; color: #2d7a4f; text-align: center; padding: 12px; font-size: 14px; text-decoration: underline; }
    .friction { background: #f5f2eb; border-radius: 12px; padding: 16px; margin: 24px 0; }
    .friction-title { font-size: 12px; color: #7a9a87; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px; }
    .friction-body { font-size: 14px; color: #3a5245; line-height: 1.5; margin: 0; }
    .footer { padding: 16px 24px; border-top: 1px solid #ede8de; text-align: center; }
    .footer p { font-size: 12px; color: #7a9a87; margin: 0; line-height: 1.6; }
    .expiry { color: #d4820a; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">verdant</div>
      <span class="plant">${plantEmoji}</span>
    </div>
    <div class="body">
      <h1 class="title">${userName} necesita tu confirmación</h1>
      <p class="subtitle">Tu apadrinado/a reportó otro día sin fumar. ¿Puedes confirmar?</p>
      <div class="streak-badge">🔥 ${daysCount} días de racha</div>
      <div class="friction">
        <p class="friction-title">Antes de confirmar</p>
        <p class="friction-body">¿Estuviste con ${userName} hoy o hablaste con él/ella? Solo confirma si tienes certeza.</p>
      </div>
      <a href="${expoGoLink}" class="btn-primary">✓ Confirmar en la app</a>
      <a href="${httpLink}" class="btn-secondary">O confirmar en el navegador</a>
    </div>
    <div class="footer">
      <p>Este link <span class="expiry">expira a medianoche</span> de hoy.</p>
    </div>
  </div>
</body>
</html>`;
}

const ACHIEVEMENT_NAMES: Record<number, string> = {
  7:   'Una semana sin fumar',
  30:  'Un mes sin fumar',
  60:  'Dos meses sin fumar',
  100: '100 días sin fumar',
};

function buildAchievementEmailHTML(milestone: number, userName: string, emoji: string): string {
  const expoGoLink = `exp+verdant:///(tabs)/logros`;
  const achievementName = ACHIEVEMENT_NAMES[milestone] ?? `${milestone} días`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, sans-serif; background: #f5f2eb; margin: 0; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: #1e5435; padding: 40px 24px; text-align: center; }
    .logo { font-size: 20px; color: #5ec287; font-weight: 300; letter-spacing: 1px; margin-bottom: 16px; }
    .trophy { font-size: 72px; display: block; }
    .body { padding: 32px 24px; text-align: center; }
    .congrats { font-size: 24px; color: #0d1f15; margin: 0 0 8px; font-weight: 600; }
    .name { font-size: 16px; color: #7a9a87; margin: 0 0 24px; }
    .milestone-badge { background: #eaf7f1; border-radius: 20px; padding: 14px 24px; display: inline-block; font-size: 18px; color: #2d7a4f; font-weight: 600; margin-bottom: 32px; }
    .btn-primary { display: block; background: #3d9e67; color: white; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: 600; }
    .footer { padding: 20px 24px; border-top: 1px solid #ede8de; text-align: center; }
    .footer p { font-size: 12px; color: #7a9a87; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">verdant</div>
      <span class="trophy">${emoji}</span>
    </div>
    <div class="body">
      <h1 class="congrats">¡Felicitaciones, ${userName}!</h1>
      <p class="name">Acabas de desbloquear un nuevo logro</p>
      <div class="milestone-badge">🏆 ${achievementName}</div>
      <a href="${expoGoLink}" class="btn-primary">Ver mi logro en la app</a>
    </div>
    <div class="footer">
      <p>Sigue así. Tu planta lo nota. 🌱</p>
    </div>
  </div>
</body>
</html>`;
}

function getSender() {
  return {
    email: process.env['SENDGRID_FROM_EMAIL'] ?? 'noreply@verdant.app',
    name: 'Verdant',
  };
}

export async function sendGodparentEmail(
  godparentEmail: string,
  userName: string,
  token: string,
  daysCount: number,
  plantType?: string,
): Promise<void> {
  const plantEmoji = plantType
    ? (PLANT_TYPE_EMOJIS[plantType] ?? getPlantStage(daysCount).emoji)
    : getPlantStage(daysCount).emoji;

  const subject = `🌱 ${userName} necesita tu confirmación — día ${daysCount}`;
  const html = buildGodparentEmailHTML(plantEmoji, userName, daysCount, token);
  const apiKey = process.env['SENDGRID_API_KEY'] ?? '';

  if (!apiKey || apiKey.startsWith('SG.placeholder')) {
    console.log('[email] SENDGRID sin configurar — email simulado:');
    console.log(`  Para: ${godparentEmail}`);
    console.log(`  Asunto: ${subject}`);
    console.log(`  📱 Expo Go: exp+verdant://padrino/confirmar/${token}`);
    console.log(`  🌐 HTTP: ${process.env['FRONTEND_URL'] ?? 'https://verdant.app'}/padrino/confirmar/${token}`);
    return;
  }

  try {
    sgMail.setApiKey(apiKey);
    await sgMail.send({ to: godparentEmail, from: getSender(), subject, html });
    console.log(`[email] ✅ Email padrino enviado a ${godparentEmail}`);
  } catch (err) {
    console.error('[email] Error enviando email padrino (no bloquea el request):', err);
  }
}

export async function sendAchievementEmail(
  userEmail: string,
  userName: string,
  milestone: number,
): Promise<void> {
  const MILESTONE_EMOJIS: Record<number, string> = { 7: '💪', 30: '🌸', 60: '❤️', 100: '👑' };
  const emoji = MILESTONE_EMOJIS[milestone] ?? '🏆';
  const achievementName = ACHIEVEMENT_NAMES[milestone] ?? `${milestone} días`;
  const subject = `🏆 ¡Desbloqueaste "${achievementName}" en Verdant!`;
  const html = buildAchievementEmailHTML(milestone, userName, emoji);
  const apiKey = process.env['SENDGRID_API_KEY'] ?? '';

  if (!apiKey || apiKey.startsWith('SG.placeholder')) {
    console.log(`[email] Logro simulado — ${userEmail}: ${achievementName}`);
    return;
  }

  try {
    sgMail.setApiKey(apiKey);
    await sgMail.send({ to: userEmail, from: getSender(), subject, html });
    console.log(`[email] ✅ Email logro enviado a ${userEmail} — ${achievementName}`);
  } catch (err) {
    console.error('[email] Error enviando email logro:', err);
  }
}
