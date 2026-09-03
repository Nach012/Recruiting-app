/**
 * Limpia y formatea un número de teléfono para generar un enlace de WhatsApp Web (wa.me)
 * @param rawPhone Número de teléfono en cualquier formato (+54 9 11..., 11-1234-5678, etc.)
 * @param candidateName Nombre completo del candidato (opcional, para personalizar el saludo)
 * @returns URL de WhatsApp o null si no hay número válido
 */
export function getWhatsAppUrl(rawPhone?: string, candidateName?: string): string | null {
  if (!rawPhone) return null;

  // 1. Extraer únicamente los dígitos
  let digits = rawPhone.replace(/\D/g, '');

  if (!digits || digits.length < 6) return null;

  // 2. Si empieza con 00 internacional, eliminar
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // 3. Si empieza con 0 local (ej: 011 -> 11), eliminar el 0
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // 4. Normalizar números de Argentina:
  // Si empieza con 54 pero no tiene el 9 de celular (ej: 541161870794 -> 5491161870794)
  if (digits.startsWith('54') && !digits.startsWith('549') && digits.length >= 12) {
    digits = '549' + digits.slice(2);
  } else if (!digits.startsWith('54')) {
    // Si es un número local de 10 dígitos (ej: 1139433174) -> anteponer 549
    if (digits.length === 10) {
      digits = '549' + digits;
    } else if (digits.length === 8) {
      // Si son 8 dígitos (ej: 39433174 sin código de área) -> anteponer 54911
      digits = '54911' + digits;
    }
  }

  // 5. Personalizar saludo con primer nombre
  const firstName = candidateName ? candidateName.trim().split(' ')[0] : '';
  const greeting = firstName ? `Hola ${firstName}! ¿Cómo estás?` : 'Hola! ¿Cómo estás?';

  // 6. Mensaje prediseñado con salto de línea
  const message = `${greeting}\n\nTe escribo desde Conectō - Talento y Estrategia. Mi nombre es `;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
