export function getApiUrl(path: string): string {
  // Route API requests to Azure Static Web Apps if hosted on GitHub Pages (gpz03.github.io)
  if (window.location.hostname.includes("github.io")) {
    return `https://agreeable-wave-017c7ae0f.7.azurestaticapps.net${path}`;
  }
  return path;
}
