export function getApiUrl(path: string): string {
  // Route API requests to Azure Static Web Apps if hosted on GitHub Pages or running locally on localhost
  if (
    window.location.hostname.includes("github.io") ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return `https://agreeable-wave-017c7ae0f.7.azurestaticapps.net${path}`;
  }
  return path;
}
