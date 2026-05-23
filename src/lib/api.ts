export function getApiUrl(path: string): string {
  // If hosted on GitHub Pages (gpz03.github.io), point directly to the Azure backend
  if (window.location.hostname.includes("github.io")) {
    return `https://agreeable-wave-017c7ae0f.7.azurestaticapps.net${path}`;
  }
  return path;
}
