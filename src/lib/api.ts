export function getApiUrl(path: string): string {
  // Route API requests directly to home lab backend if hosted on GitHub Pages
  if (window.location.hostname.includes("github.io")) {
    return `https://ribcage-very-washout.ngrok-free.dev${path}`;
  }
  return path;
}
