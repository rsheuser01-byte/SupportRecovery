export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

// Utility function to get the correct login URL based on environment
export function getLoginUrl(): string {
  // Check if we're in development mode by looking at the hostname
  if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    return '/api/local-login';
  }
  // Production/other environments use the regular login
  return '/api/login';
}

// Utility function to get the correct logout URL based on environment
export function getLogoutUrl(): string {
  // Check if we're in development mode by looking at the hostname
  if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    return '/api/local-logout';
  }
  // Production/other environments use the regular logout
  return '/api/logout';
}