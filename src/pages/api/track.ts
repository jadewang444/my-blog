/**
 * Privacy-friendly page-view tracking endpoint
 * 
 * POST /api/track?path=/some/path
 * 
 * Inserts pageview record with: path, referrer, user_agent, country, city
 * No raw IPs stored - optionally stores masked IP (e.g., /24 subnet)
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  try {
    // Get path from query string
    const path = url.searchParams.get('path');
    
    if (!path || typeof path !== 'string') {
      return new Response('Missing or invalid path parameter', { status: 400 });
    }

    // Validate path format
    if (!path.startsWith('/') || path.length > 500) {
      return new Response('Invalid path format', { status: 400 });
    }

    // Get Supabase credentials
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials');
      return new Response('Server configuration error', { status: 500 });
    }

    // Extract metadata from request
    const referrer = request.headers.get('referer') || null;
    const userAgent = request.headers.get('user-agent') || null;
    
    // Optional: Get geographic data from Cloudflare/Vercel headers
    // These are automatically added by edge providers
    const country = request.headers.get('cf-ipcountry') || 
                   request.headers.get('x-vercel-ip-country') || null;
    const city = request.headers.get('cf-ipcity') ||
                request.headers.get('x-vercel-ip-city') || null;
    
    // Create Supabase client with anon key (uses INSERT policy)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Insert pageview record
    const { error } = await supabase
      .from('pageviews')
      .insert({
        path,
        referrer,
        user_agent: userAgent,
        country,
        city,
        country_code: null,  // Could extract from CF-IPCountry if needed
        ip_mask: null        // No IP tracking for maximum privacy
      });

    if (error) {
      console.error('Supabase insert error:', error);
      return new Response('Database error', { status: 500 });
    }

    // Return 204 No Content
    return new Response(null, { status: 204 });

  } catch (err) {
    console.error('Track endpoint error:', err);
    return new Response('Internal server error', { status: 500 });
  }
};
