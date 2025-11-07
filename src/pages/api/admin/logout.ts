/**
 * Admin logout API endpoint
 * POST /api/admin/logout
 * 
 * Clears the session cookie
 */

import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  // Clear the session cookie
  cookies.delete('admin_session', {
    path: '/'
  });

  // Redirect to login
  return redirect('/admin/login');
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Also support GET for convenience
  cookies.delete('admin_session', {
    path: '/'
  });

  return redirect('/admin/login');
};
