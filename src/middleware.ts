// Middleware to set a secure Content Security Policy (CSP) header
// Astro automatically loads `src/middleware.*` files in the project root.
// This CSP allows self-hosted resources, Google Fonts, and inline styles
// (the 'unsafe-inline' for styles is included because the site uses small
// inline style attributes in a few places). Adjust as needed.

// Password protection for the entire site
const SITE_PASSWORD = import.meta.env.SITE_PASSWORD || "";
const PASSWORD_COOKIE_NAME = "site_auth";
const PASSWORD_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const RATE_LIMIT_COOKIE_NAME = "auth_attempts";
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

// In-memory store for rate limiting (in production, use Redis or similar)
const attemptStore = new Map<string, Array<number>>();

function getClientIp(ctx: any): string {
  return (
    ctx.request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    ctx.request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const attempts = attemptStore.get(clientIp) || [];
  
  // Remove attempts older than the rate limit window
  const recentAttempts = attempts.filter((time) => now - time < RATE_LIMIT_WINDOW);
  
  const remaining = Math.max(0, MAX_ATTEMPTS - recentAttempts.length);
  const resetTime = recentAttempts.length > 0 ? recentAttempts[0] + RATE_LIMIT_WINDOW : 0;
  
  attemptStore.set(clientIp, recentAttempts);
  
  return {
    allowed: recentAttempts.length < MAX_ATTEMPTS,
    remaining,
    resetTime,
  };
}

function recordAttempt(clientIp: string): void {
  const attempts = attemptStore.get(clientIp) || [];
  attempts.push(Date.now());
  attemptStore.set(clientIp, attempts);
}

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
      const clientIp = getClientIp(ctx);
      const rateLimit = checkRateLimit(clientIp);
      
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
    input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
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
    button:hover:not(:disabled) {
      transform: translateY(-2px);
    }
    button:active:not(:disabled) {
      transform: translateY(0);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
    .warning {
      color: #f6ad55;
      font-size: 0.875rem;
      margin: 1rem 0 0 0;
      display: none;
    }
    .warning.show {
      display: block;
    }
    .locked {
      color: #c53030;
      font-size: 0.875rem;
      margin: 1rem 0 0 0;
      display: none;
    }
    .locked.show {
      display: block;
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
        ${!rateLimit.allowed ? 'disabled' : ''}
      >
      <button type="submit" ${!rateLimit.allowed ? 'disabled' : ''}>
        ${rateLimit.allowed ? 'Unlock' : 'Locked'}
      </button>
      <div id="error" class="error">Incorrect password</div>
      <div id="warning" class="warning"></div>
      <div id="locked" class="locked"></div>
    </form>
  </div>
  <script>
    const maxAttempts = ${MAX_ATTEMPTS};
    const remaining = ${rateLimit.remaining};
    const isLocked = ${!rateLimit.allowed};
    const resetTime = ${rateLimit.resetTime};
    
    const errorEl = document.getElementById("error");
    const warningEl = document.getElementById("warning");
    const lockedEl = document.getElementById("locked");
    const passwordInput = document.getElementById("password");
    const form = document.getElementById("authForm");
    const submitBtn = form.querySelector("button[type=submit]");
    
    function updateUI() {
      if (isLocked) {
        const now = Date.now();
        const timeRemaining = Math.ceil((resetTime - now) / 1000);
        if (timeRemaining > 0) {
          const minutes = Math.ceil(timeRemaining / 60);
          lockedEl.textContent = \`Too many attempts. Try again in \${minutes} minute\${minutes > 1 ? 's' : ''}.\`;
          lockedEl.classList.add("show");
          passwordInput.disabled = true;
          submitBtn.disabled = true;
          setTimeout(updateUI, 1000);
        } else {
          location.reload();
        }
      } else if (remaining <= 2) {
        warningEl.textContent = \`\${remaining} attempt\${remaining !== 1 ? 's' : ''} remaining\`;
        warningEl.classList.add("show");
      }
    }
    
    updateUI();
    
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = passwordInput.value;
      const response = await fetch("/__auth", {
        method: "POST",
        body: JSON.stringify({ password }),
        headers: { "Content-Type": "application/json" }
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        errorEl.classList.add("show");
        warningEl.classList.remove("show");
        passwordInput.value = "";
        passwordInput.focus();
        
        // Refresh to get updated attempt count
        setTimeout(() => location.reload(), 1500);
      }
    });
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
