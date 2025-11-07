# Privacy-Friendly Analytics Setup

This document explains how to set up and test the privacy-friendly page-view analytics system for your Astro blog.

## Overview

The analytics system tracks page views with:
- **No cookies** — nothing stored in browser
- **No IP addresses** — no personal information collected
- **No localStorage** — ephemeral session tracking only
- **Minimal data** — only `{path, count, last_seen}` per page

Perfect for understanding which content resonates with your audience while respecting their privacy.

---

## 1. Supabase Setup

### Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/log in
2. Click **"New Project"**
3. Choose a name (e.g., `my-blog-analytics`)
4. Set a database password (save this!)
5. Wait for the project to provision (~2 minutes)

### Create the Database Table

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the contents of `SUPABASE-SETUP.sql` from this repo
4. Click **"Run"** to execute the SQL
5. Verify: Go to **Table Editor** → you should see a `pageviews` table

### Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these three values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public key** (starts with `eyJhbG...`)
   - **service_role key** (starts with `eyJhbG...`)  
     ⚠️ **Keep the service role key secret!** Never commit it to GitHub.

---

## 2. Local Environment Configuration

### Create .env File

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your values:
   ```bash
   # Supabase credentials from your dashboard
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE=eyJhbG...your-service-role-key
   SUPABASE_ANON_KEY=eyJhbG...your-anon-key

   # Admin dashboard credentials (choose your own!)
   ADMIN_USER=admin
   ADMIN_PASS=your-secure-password
   ```

3. **Important:** Make sure `.env` is in your `.gitignore` (it should be by default in Astro projects)

---

## 3. Install Dependencies

Install the Supabase JavaScript client:

```bash
npm install @supabase/supabase-js
```

---

## 4. Local Testing

### Start the Dev Server

```bash
npm run dev
```

The server should start on `http://localhost:4321/`

### Test Page View Tracking

1. **Visit some pages:**
   - Open `http://localhost:4321/`
   - Navigate to `/about`
   - Navigate to `/jotting/at-twenty-five`

2. **Check browser console (F12 → Console):**
   - You should see no errors
   - Analytics runs silently in the background

3. **Verify tracking works:**
   - Open your Supabase dashboard
   - Go to **Table Editor** → `pageviews`
   - You should see rows for the pages you visited:
     ```
     path: /
     count: 1
     last_seen: 2025-11-06 ...
     ```

### Test the Admin Dashboard

1. **Visit the admin page:**
   ```
   http://localhost:4321/admin
   ```

2. **Enter credentials:**
   - Username: (the `ADMIN_USER` from your `.env`)
   - Password: (the `ADMIN_PASS` from your `.env`)

3. **You should see:**
   - Summary stats (total pages, total views)
   - A table of all tracked pages with view counts
   - Last-seen timestamps for each page

### Test Visibility Tracking

1. **Open a page** (e.g., `/about`)
2. **Switch to another tab** (page becomes hidden)
3. **Switch back** to your blog tab (page becomes visible)
4. **Check Supabase** → the count should have increased

This simulates users returning to your tab and ensures the `visibilitychange` event works.

---

## 5. Troubleshooting

### No tracking data appearing?

1. **Check browser console** for errors:
   - Look for failed `/api/track` requests
   - Check for CORS or network errors

2. **Verify environment variables:**
   - Open `src/pages/api/track.ts` and add `console.log(import.meta.env.SUPABASE_URL)` temporarily
   - Restart dev server and check terminal output
   - Make sure the URL and keys are correct

3. **Check Supabase logs:**
   - Go to Supabase dashboard → **Logs** → **API**
   - Look for failed requests to `increment_pageview`

### Admin dashboard returns 401 Unauthorized?

- Double-check your `ADMIN_USER` and `ADMIN_PASS` in `.env`
- Restart the dev server after changing `.env` values
- Try a different browser or incognito window (clears any cached auth)

### "Database error" when tracking?

- Verify you ran the SQL from `SUPABASE-SETUP.sql`
- Check that the `increment_pageview` function exists:
  - Supabase dashboard → **Database** → **Functions**
  - You should see `increment_pageview` listed
- Try running the SQL again (it's safe to re-run)

---

## 6. How It Works

### Client-Side (`src/scripts/analytics.ts`)

- Loads on every page via `Base.astro`
- Listens for:
  - Page load (`window.load`)
  - Visibility changes (`document.visibilitychange`)
  - SPA navigation events (Astro/Swup)
- Debounces to prevent duplicate tracking (1 second)
- Sends a simple POST request: `/api/track?path=/current/path`
- Uses `keepalive: true` to ensure requests complete even if user navigates away

### Server-Side (`src/pages/api/track.ts`)

- Receives the `path` from query string
- Validates path format (must start with `/`, max 500 chars)
- Calls Supabase `increment_pageview(path)` function
- Returns `204 No Content` on success

### Database (`SUPABASE-SETUP.sql`)

- `pageviews` table stores: `path` (primary key), `count`, `last_seen`
- `increment_pageview()` function performs atomic upsert:
  - If path exists → increment `count`, update `last_seen`
  - If new path → insert with `count = 1`
- Row Level Security (RLS) enabled:
  - Anonymous users can read (for admin dashboard)
  - Service role can write (for tracking endpoint)

### Admin Dashboard (`src/pages/admin.astro`)

- Protected by HTTP Basic Auth
- Queries Supabase using the **anon key** (read-only)
- Displays:
  - Total pages tracked
  - Total view count
  - Sorted list of pages (most viewed first)
  - Last-seen timestamp for each page

---

## 7. Privacy & Security Notes

### What This System Does NOT Collect

- ❌ User IP addresses
- ❌ Cookies or persistent identifiers
- ❌ Browser fingerprints
- ❌ Referrer URLs
- ❌ User agents or device info
- ❌ Geographic location

### What It DOES Collect

- ✅ Page pathname (e.g., `/about`)
- ✅ View count per page
- ✅ Timestamp of last view

This is **session-level tracking** only. Each browser session tracks independently. When a user closes the tab, the in-memory tracking resets.

### Security Best Practices

1. **Never commit `.env`** — always in `.gitignore`
2. **Keep service role key secret** — used only server-side
3. **Use strong admin password** — dashboard has no rate limiting (MVP)
4. **Enable Supabase RLS** — provided SQL includes policies
5. **HTTPS only in production** — never send keys over HTTP

---

## 8. What's Next?

Once you've confirmed local tracking works:

1. **Add rate limiting** (optional):
   - Implement simple in-memory rate limiting in `/api/track`
   - Example: max 10 requests per IP per minute

2. **Deploy to production:**
   - Add the same env vars to your Vercel/Netlify dashboard
   - Push code to trigger deployment
   - Test on live site

3. **Monitor usage:**
   - Check `/admin` regularly to see popular content
   - Use insights to guide content strategy

4. **Optional enhancements:**
   - Add date filtering to admin dashboard
   - Export data as CSV
   - Add charts/graphs with Chart.js

---

## 9. Files Reference

All analytics code is local-only (not deployed yet):

- **`SUPABASE-SETUP.sql`** — Database schema and function
- **`src/pages/api/track.ts`** — Tracking endpoint (POST handler)
- **`src/scripts/analytics.ts`** — Client-side tracking script
- **`src/pages/admin.astro`** — Admin dashboard with Basic Auth
- **`src/layouts/Base.astro`** — Modified to include analytics script
- **`.env.example`** — Environment variable template
- **`README-ANALYTICS.md`** — This file!

---

## 10. Support

If you encounter issues:

1. Check the [Supabase docs](https://supabase.com/docs)
2. Review browser console and Supabase logs
3. Verify all environment variables are set correctly
4. Try the troubleshooting steps in Section 5

**Remember:** This is a minimal viable implementation. It intentionally avoids cookies, localStorage, and complex tracking to prioritize user privacy.

---

**Ready to go?** Run `npm run dev` and start tracking! 🚀
