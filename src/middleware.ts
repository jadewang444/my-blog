// Middleware to set a secure Content Security Policy (CSP) header
// Astro automatically loads `src/middleware.*` files in the project root.
// This CSP allows self-hosted resources, Google Fonts, and inline styles
// (the 'unsafe-inline' for styles is included because the site uses small
// inline style attributes in a few places). Adjust as needed.

// Password protection for the entire site
const SITE_PASSWORD = import.meta.env.SITE_PASSWORD || "";
const PASSWORD_COOKIE_NAME = "site_auth";
const PASSWORD_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export const onRequest = async (ctx: any, next: any) => {
  // Skip password check for password submission endpoint
  if (ctx.request.url.includes("/__auth")) {
    return next();
  }

  // If password is set, check authentication
  if (SITE_PASSWORD) {
    const cookieHeader = ctx.request.headers.get("cookie") || "";
    const cookies = cookieHeader.split(";").reduce(
      (acc: Record<string, string>, cookie: string) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = decodeURIComponent(value || "");
        return acc;
      },
      {}
    );

    const isAuthenticated = cookies[PASSWORD_COOKIE_NAME] === SITE_PASSWORD;

    if (!isAuthenticated) {
      // Return password form
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Protected Site</title>
  <style>
    :root {
      --primary-color: #2a2a28;
      --secondary-color: #50504d;
      --weak-color: #9f9f9c;
      --background-color: #fffffd;
      --block-color: #eeeeee;
      --error-color: #d32f2f;
      --serif: "Cormorant Garamond", "Noto Serif SC", serif;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --primary-color: #dddddb;
        --secondary-color: #aaaaa8;
        --weak-color: #5d5d5a;
        --background-color: #0e0e0c;
        --block-color: #1e1e1e;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 2rem 1rem;
      font-family: var(--serif);
      background-color: var(--background-color);
      color: var(--primary-color);
      line-height: 1.65;
    }

    .container {
      width: 100%;
      max-width: 480px;
      padding: 3rem 2.5rem;
      background-color: var(--block-color);
      border: 1px solid rgba(42, 42, 40, 0.1);
    }

    @media (prefers-color-scheme: dark) {
      .container {
        border-color: rgba(221, 221, 219, 0.1);
      }
    }

    .lock-icon {
      font-size: 3rem;
      margin-bottom: 1.5rem;
      display: block;
    }

    h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 400;
      letter-spacing: 0.02em;
      color: var(--primary-color);
    }

    .subtitle {
      margin: 0 0 2rem 0;
      font-size: 0.95rem;
      color: var(--secondary-color);
      font-weight: 400;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    input {
      width: 100%;
      padding: 0.875rem 1rem;
      font-family: inherit;
      font-size: 1rem;
      background-color: var(--background-color);
      color: var(--primary-color);
      border: 1px solid var(--weak-color);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    input::placeholder {
      color: var(--weak-color);
    }

    input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(42, 42, 40, 0.05);
    }

    @media (prefers-color-scheme: dark) {
      input:focus {
        box-shadow: 0 0 0 3px rgba(221, 221, 219, 0.05);
      }
    }

    button {
      padding: 0.875rem 1rem;
      font-family: var(--serif);
      font-size: 1rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      background-color: var(--primary-color);
      color: var(--background-color);
      border: none;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    button:hover:not(:disabled) {
      opacity: 0.85;
    }

    button:active:not(:disabled) {
      opacity: 0.7;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .message {
      padding: 1rem;
      font-size: 0.875rem;
      line-height: 1.5;
      border-left: 2px solid;
      display: none;
    }

    .message.show {
      display: block;
    }

    .error {
      border-left-color: var(--error-color);
      background-color: rgba(211, 47, 47, 0.08);
      color: var(--error-color);
    }

    .locked {
      border-left-color: var(--error-color);
      background-color: rgba(211, 47, 47, 0.08);
      color: var(--error-color);
    }

    .attempts-info {
      font-size: 0.875rem;
      color: var(--secondary-color);
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <span class="lock-icon">🔐</span>
    <h1>Protected</h1>
    <p class="subtitle">This site is password protected.</p>
    <form id="authForm">
      <input
        type="password"
        id="password"
        placeholder="Enter password"
        autocomplete="current-password"
        required
      >
      <button type="submit" id="submitBtn">Unlock</button>
      <div id="error" class="message error"></div>
      <div id="locked" class="message locked"></div>
    </form>
  </div>
  <script>
    const MAX_ATTEMPTS = 3;
    const LOCKOUT_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const ATTEMPTS_KEY = "auth_attempts";
    const LOCKOUT_KEY = "auth_lockout_time";

    function getAttempts() {
      const stored = localStorage.getItem(ATTEMPTS_KEY);
      if (!stored) return 0;
      return parseInt(stored, 10);
    }

    function setAttempts(count) {
      localStorage.setItem(ATTEMPTS_KEY, count.toString());
    }

    function getLockoutTime() {
      const stored = localStorage.getItem(LOCKOUT_KEY);
      if (!stored) return null;
      return parseInt(stored, 10);
    }

    function setLockout() {
      localStorage.setItem(LOCKOUT_KEY, (Date.now() + LOCKOUT_TIME).toString());
    }

    function clearLockout() {
      localStorage.removeItem(LOCKOUT_KEY);
      localStorage.removeItem(ATTEMPTS_KEY);
    }

    function updateLockoutUI() {
      const lockoutTime = getLockoutTime();
      const now = Date.now();
      
      if (lockoutTime && now < lockoutTime) {
        const remainingMs = lockoutTime - now;
        const remainingHours = Math.ceil(remainingMs / 3600000);
        const lockedEl = document.getElementById("locked");
        lockedEl.textContent = \`Too many failed attempts. Please try again in \${remainingHours} hour\${remainingHours > 1 ? 's' : ''}.\`;
        lockedEl.classList.add("show");
        document.getElementById("submitBtn").disabled = true;
        document.getElementById("password").disabled = true;
        
        const interval = setInterval(() => {
          const currentLockout = getLockoutTime();
          const currentNow = Date.now();
          if (!currentLockout || currentNow >= currentLockout) {
            clearInterval(interval);
            clearLockout();
            location.reload();
          }
        }, 10000); // Check every 10 seconds
      } else if (lockoutTime) {
        clearLockout();
      }
    }

    function checkRateLimit() {
      updateLockoutUI();
      const lockoutTime = getLockoutTime();
      return !lockoutTime || Date.now() >= lockoutTime;
    }

    document.getElementById("authForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      
      if (!checkRateLimit()) {
        return;
      }

      const password = document.getElementById("password").value;
      const response = await fetch("/__auth", {
        method: "POST",
        body: JSON.stringify({ password }),
        headers: { "Content-Type": "application/json" }
      });
      
      if (response.ok) {
        clearLockout();
        window.location.reload();
      } else {
        const attempts = getAttempts() + 1;
        setAttempts(attempts);
        
        const errorEl = document.getElementById("error");
        const remaining = MAX_ATTEMPTS - attempts;
        
        if (remaining <= 0) {
          setLockout();
          updateLockoutUI();
          errorEl.classList.remove("show");
        } else {
          errorEl.textContent = \`Incorrect password. \${remaining} attempt\${remaining > 1 ? 's' : ''} remaining.\`;
          errorEl.classList.add("show");
        }
        
        document.getElementById("password").value = "";
        document.getElementById("password").focus();
      }
    });

    // Check lockout status on page load
    checkRateLimit();
  </script>
</body>
</html>
`;
      return new Response(html, {
        status: 401,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  const response = await next();

  // Set a restrictive but usable CSP for Vercel-hosted static site
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
  );

  return response;
};
