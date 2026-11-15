/**
 * Formats image URLs so that relative paths (/uploads/...) point to the active backend API server,
 * while base64 data URIs (data:image/...) and absolute URLs (https://...) are preserved.
 */
export const getImageUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }

  const trimmed = url.trim();

  // If already base64 data URL or absolute HTTP/HTTPS URL
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Determine backend base URL
  const envApiUrl = import.meta.env.VITE_API_URL || '';
  let backendOrigin = '';

  if (envApiUrl) {
    // Strip trailing /api or /
    backendOrigin = envApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  } else if (typeof window !== 'undefined') {
    // In local development or production fallback
    backendOrigin =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : window.location.origin;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${backendOrigin}${cleanPath}`;
};

export default getImageUrl;
