export function getApiUrl(path: string): string {
  // Route API requests directly to home lab backend via Cloudflare Tunnel if hosted on GitHub Pages
  if (window.location.hostname.includes("github.io")) {
    return `https://assets-largest-sic-pichunter.trycloudflare.com${path}`;
  }
  return path;
}
