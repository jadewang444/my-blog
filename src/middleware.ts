// Middleware to set a secure Content Security Policy (CSP) header
// Astro automatically loads `src/middleware.*` files in the project root.
// This CSP allows self-hosted resources, Google Fonts, and inline styles
// (the 'unsafe-inline' for styles is included because the site uses small
// inline style attributes in a few places). Adjust as needed.

export const onRequest = async (_ctx: any, next: any) => {
  const response = await next();

  // Set a restrictive but usable CSP for Vercel-hosted static site
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
  );

  return response;
};
