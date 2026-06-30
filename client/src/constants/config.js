// WhatsApp number for sales/upgrade CTAs (Phase 1). Set in client .env.
export const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP || '919999999999').replace(/[^0-9]/g, '');

export function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
