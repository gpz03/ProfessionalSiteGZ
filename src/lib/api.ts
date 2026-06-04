export function getApiUrl(path: string): string {
  // Route API requests directly to home lab backend via localtunnel if hosted on GitHub Pages
  if (window.location.hostname.includes("github.io")) {
    return `https://slick-boxes-speak.loca.lt${path}`;
  }
  return path;
}
