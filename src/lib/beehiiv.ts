export const BEEHIIV_FORM_URL =
  "https://subscribe-forms.beehiiv.com/69acb8ac-4587-41c0-92b4-df39eb8798ea";

export function openBeehiivWaitlist() {
  if (typeof window === "undefined") return;
  const beehiiv = (window as unknown as { beehiiv?: { open?: () => void } }).beehiiv;
  if (beehiiv?.open) {
    beehiiv.open();
    return;
  }
  window.open(BEEHIIV_FORM_URL, "_blank", "noopener,noreferrer");
}
