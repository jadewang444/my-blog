# Analytics Implementation Summary

## Files Created

### 1. SUPABASE-SETUP.sql
Database schema and atomic increment function.

**Location:** `/SUPABASE-SETUP.sql`

### 2. src/pages/api/track.ts
Server-side tracking endpoint.

**Location:** `/src/pages/api/track.ts`

**Key features:**
- Accepts POST requests with `?path=/some/path`
- Uses Supabase service role key for write access
- Calls `increment_pageview()` SQL function
- Returns 204 No Content on success
- Validates path format (must start with `/`, max 500 chars)

### 3. src/scripts/analytics.ts
Client-side tracking script.

**Location:** `/src/scripts/analytics.ts`

**Key features:**
- Tracks on page load and `visibilitychange` events
- Debounced (1 second) to prevent duplicates
- In-memory session tracking (no cookies/localStorage)
- Graceful failure (never breaks the site)
- Uses `keepalive: true` for reliability

### 4. src/pages/admin.astro
Private admin dashboard.

**Location:** `/src/pages/admin.astro`

**Key features:**
- Protected by HTTP Basic Auth (username/password from env)
- Queries Supabase with anon key (read-only)
- Displays summary stats and sorted page list
- Minimal inline styles (uses site defaults)
- SSR-only (`prerender = false`)

## Files Modified

### 1. src/layouts/Base.astro
Added analytics script inclusion.

**Change:**
```diff
    <Footer author={config.author} copyright={config.copyright} isHome={route === '/'} />
  </div>
+
+  <!-- Privacy-friendly page-view analytics -->
+  <script src="/src/scripts/analytics.ts"></script>
</App>
```

### 2. .env.example
Added analytics environment variables.

**Change:**
```diff
 # Basic configuration
 PUBLIC_TIMEZONE=
+
+# Analytics Environment Variables
+# Copy these to .env and fill in your actual values
+
+# Supabase Configuration
+# Get these from your Supabase project settings at https://supabase.com/dashboard
+SUPABASE_URL=https://your-project-id.supabase.co
+SUPABASE_SERVICE_ROLE=your-service-role-key-here
+SUPABASE_ANON_KEY=your-anon-key-here
+
+# Admin Dashboard Authentication
+# Used for Basic Auth on /admin page
+# Choose a strong username and password
+ADMIN_USER=admin
+ADMIN_PASS=your-secure-password-here
```

## Quick Start

### 1. Install dependencies
```bash
npm install @supabase/supabase-js
```

### 2. Set up Supabase
1. Create a Supabase project at https://supabase.com
2. Run the SQL from `SUPABASE-SETUP.sql` in the SQL Editor
3. Copy your project URL and API keys

### 3. Configure environment
```bash
# Copy and edit .env
cp .env.example .env

# Fill in:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE
# - SUPABASE_ANON_KEY
# - ADMIN_USER
# - ADMIN_PASS
```

### 4. Test locally
```bash
# Start dev server
npm run dev

# Visit pages to generate tracking data
# Then view analytics at:
# http://localhost:4321/admin
```

## Privacy Guarantees

**What is tracked:**
- Page pathname (e.g., `/about`)
- View count per page
- Last-seen timestamp

**What is NOT tracked:**
- ❌ IP addresses
- ❌ Cookies
- ❌ User agents
- ❌ Referrer URLs
- ❌ Geographic data
- ❌ Personal information

**How it works:**
- Each page view sends: `POST /api/track?path=/current/path`
- Server increments counter in Supabase
- No client-side storage (cookies/localStorage)
- Session tracking resets when tab closes

## Security Notes

1. **Service role key** — Server-side only (never exposed to client)
2. **Anon key** — Read-only access (RLS enforced)
3. **Admin dashboard** — HTTP Basic Auth (no rate limiting in MVP)
4. **Database** — Row Level Security enabled

## Complete File List

**New files:**
- `SUPABASE-SETUP.sql` — Database schema
- `src/pages/api/track.ts` — Tracking endpoint
- `src/scripts/analytics.ts` — Client script
- `src/pages/admin.astro` — Admin dashboard
- `README-ANALYTICS.md` — Full setup guide

**Modified files:**
- `src/layouts/Base.astro` — Added script tag
- `.env.example` — Added env vars

**Documentation:**
- `README-ANALYTICS.md` — Complete setup and troubleshooting guide

---

**Status:** ✅ Local-only implementation complete. Ready for testing with `npm run dev`.

**Next steps:**
1. Install `@supabase/supabase-js`
2. Create Supabase project and run SQL setup
3. Configure `.env` with your credentials
4. Test tracking and admin dashboard locally
5. Deploy when ready (add env vars to Vercel/Netlify)
