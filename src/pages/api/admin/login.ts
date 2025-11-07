/**
 * Admin login API endpoint
 * POST /api/admin/login
 * 
 * Validates credentials and sets a signed HttpOnly cookie
 * Cookie expires after 4 hours
 */

import type { APIRoute } from 'astro';
import crypto from 'crypto';

export const prerender = false;

const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

// Simple HMAC signing for cookie integrity (not encryption)
function signSession(data: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('hex');
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    // Get form data
    const formData = await request.formData();
    const username = formData.get('username')?.toString();
    const password = formData.get('password')?.toString();

    if (!username || !password) {
      return redirect('/admin/login?error=invalid');
    }

    // Get credentials from env
    const expectedUser = import.meta.env.ADMIN_USER;
    const expectedPass = import.meta.env.ADMIN_PASS;

    if (!expectedUser || !expectedPass) {
      console.error('Admin credentials not configured');
      return new Response('Server configuration error', { status: 500 });
    }

    // Verify credentials
    if (username !== expectedUser || password !== expectedPass) {
      return redirect('/admin/login?error=invalid');
    }

    // Create session data
    const expiresAt = Date.now() + SESSION_DURATION;
    const sessionData = {
      username,
      expires: expiresAt
    };

    // Encode session as base64
    const sessionString = JSON.stringify(sessionData);
    const sessionBase64 = Buffer.from(sessionString, 'utf-8').toString('base64');

    // Sign the session
    const secret = import.meta.env.SESSION_SECRET || expectedPass; // Use password as fallback
    const signature = signSession(sessionBase64, secret);
    const signedSession = `${sessionBase64}.${signature}`;

    // Set HttpOnly cookie
    cookies.set('admin_session', signedSession, {
      httpOnly: true,
      secure: import.meta.env.PROD, // HTTPS only in production
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION / 1000 // in seconds
    });

    // Redirect to admin dashboard
    return redirect('/admin');

  } catch (err) {
    console.error('Login error:', err);
    return redirect('/admin/login?error=invalid');
  }
};
