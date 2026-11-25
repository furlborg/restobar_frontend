export const REVIEW_QR_MAX_URL_LENGTH = 150;

/**
 * Valida el enlace del QR de calificación con las mismas reglas del servidor:
 * https, host, sin credenciales, sin espacios y máximo 150 caracteres.
 */
export function isValidReviewQrUrl(value) {
  const url = String(value || "").trim();
  if (!url || url.length > REVIEW_QR_MAX_URL_LENGTH || /\s/.test(url)) return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    );
  } catch (_) {
    return false;
  }
}
