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
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 400px;
      text-align: center;
    }
    h1 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.5rem;
    }
    p {
      color: #666;
      margin: 1rem 0;
      font-size: 0.95rem;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      margin: 1rem 0;
      border: 2px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      font-weight: 600;
      transition: transform 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
    }
    button:active {
      transform: translateY(0);
    }
    .error {
      color: #e53e3e;
      font-size: 0.875rem;
      margin: 1rem 0 0 0;
      display: none;
    }
    .error.show {
      display: block;
    }
    .locked {
      color: #e53e3e;
      font-weight: 600;
      margin: 1rem 0;
      padding: 1rem;
      background: #fed7d7;
      border-radius: 6px;
      display: none;
    }
    .locked.show {
      display: block;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔒 Protected Site</h1>
    <p>This site is password protected.</p>
    <form id="authForm">
      <input
        type="password"
        id="password"
        placeholder="Enter password"
        autocomplete="current-password"
        required
      >
      <button type="submit" id="submitBtn">Unlock</button>
      <div id="error" class="error">Incorrect password</div>
      <div id="locked" class="locked"></div>
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
