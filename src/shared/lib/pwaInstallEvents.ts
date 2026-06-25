export const OPEN_PWA_INSTALL_PROMPT_EVENT = "spot:open-pwa-install-prompt";

export function openPwaInstallPrompt() {
  window.dispatchEvent(new Event(OPEN_PWA_INSTALL_PROMPT_EVENT));
}
