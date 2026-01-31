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
      // Return an upgraded password form that matches the provided design
      const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jade Wang Space | Bienvenue</title>
    <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Montserrat:wght@200;300&display=swap" rel="stylesheet">
    <style>
        html,body{height:100%;}
        body {
            margin: 0; padding: 0; overflow: hidden; font-family: 'Montserrat', sans-serif; background: #fdfbfb; height: 100vh; display: flex; align-items: center; justify-content: center;
        }
        .ambient-background { position: absolute; top:0; left:0; width:100%; height:100%; z-index:-1; filter: blur(120px); opacity:0.6; overflow:hidden }
        .color-blob{ position:absolute; border-radius:50%; mix-blend-mode:multiply; animation: drift 30s infinite alternate ease-in-out }
        .blob-purple{ width:60vw; height:60vw; background:#e8dbff; top:-15%; left:-10% }
        .blob-green{ width:50vw; height:50vw; background:#e2f5ee; bottom:-10%; right:5%; animation-delay:-7s }
        .blob-blue{ width:55vw; height:55vw; background:#e0efff; top:30%; left:35%; animation-delay:-12s }
        @keyframes drift{ 0%{transform:translate(0,0) scale(1) rotate(0deg)} 100%{transform:translate(10%,10%) scale(1.1) rotate(15deg)} }
        .glass-card{ background: rgba(255,255,255,0.4); backdrop-filter: blur(50px); -webkit-backdrop-filter: blur(50px); border:0.5px solid rgba(255,255,255,0.5); border-radius:50px; padding:3.2rem 2.25rem; width:90%; max-width:460px; box-shadow:0 40px 100px rgba(0,0,0,0.03); text-align:center; transition: all 0.8s cubic-bezier(0.16,1,0.3,1) }
        .title{ font-family:'Bodoni Moda', serif; font-size:2.4rem; color:#2d2d2d; font-weight:300; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:0.4rem; line-height:1 }
        .subtitle{ font-family:'Montserrat', sans-serif; color:#9a9a9a; font-weight:200; margin-bottom:2.6rem; font-size:0.65rem; letter-spacing:0.42em; text-transform:uppercase }
        .input-group{ position:relative; margin-bottom:2rem }
        input{ width:100%; background:transparent; border:none; border-bottom:1px solid rgba(0,0,0,0.08); padding:10px 0; color:#2d2d2d; outline:none; transition:all 0.45s ease; text-align:center; font-size:0.85rem; letter-spacing:1.4px }
        input:focus{ border-bottom-color:#b39ddb; letter-spacing:2.6px }
        input::placeholder{ color:#cccccc; font-weight:200; letter-spacing:1px }
        .btn-unlock{ width:100%; padding:14px; border-radius:30px; background:#2d2d2d; color:#fff; font-size:0.75rem; font-weight:300; letter-spacing:3px; cursor:pointer; transition:all 0.45s ease; border:none; text-transform:uppercase }
        .btn-unlock:hover{ background:#4a4a4a; transform:translateY(-2px); box-shadow:0 15px 30px rgba(0,0,0,0.1) }
        #message{ margin-top:2rem; font-size:0.75rem; color:#9e9e9e; letter-spacing:1px; font-weight:200 }
        .dot-deco{ display:block; width:4px; height:4px; background:#b39ddb; border-radius:50%; margin:0 auto 1.5rem; opacity:0.5 }
        .muted{ color:#9e9e9e; font-size:0.85rem }
        /* disabled styles */
        .disabled{ opacity:0.5; pointer-events:none }
    </style>
</head>
<body>

    <div class="ambient-background">
        <div class="color-blob blob-purple"></div>
        <div class="color-blob blob-green"></div>
        <div class="color-blob blob-blue"></div>
    </div>

    <div class="glass-card" id="card">
        <span class="dot-deco"></span>
        <h1 class="title">Jade Wang</h1>
        <p class="subtitle">Le Jardin Secret</p>

        <form id="unlockForm">
            <div class="input-group">
                <input type="password" id="password" placeholder="MOT DE PASSE" autocomplete="current-password" required>
            </div>
            <button type="submit" class="btn-unlock" id="submitBtn">Explorer</button>
        </form>

        <div id="message" class="muted">&nbsp;</div>
    </div>

    <script>
      // Rate limiting + server auth integration
      const MAX_ATTEMPTS = 3;
      const LOCKOUT_TIME = 24 * 60 * 60 * 1000; // 24 hours
      const ATTEMPTS_KEY = 'auth_attempts';
      const LOCKOUT_KEY = 'auth_lockout_time';

      function getAttempts(){ const s = localStorage.getItem(ATTEMPTS_KEY); return s? parseInt(s,10):0 }
      function setAttempts(n){ localStorage.setItem(ATTEMPTS_KEY, String(n)) }
      function getLockout(){ const s = localStorage.getItem(LOCKOUT_KEY); return s? parseInt(s,10):null }
      function setLockout(){ localStorage.setItem(LOCKOUT_KEY, String(Date.now()+LOCKOUT_TIME)) }
      function clearLockout(){ localStorage.removeItem(LOCKOUT_KEY); localStorage.removeItem(ATTEMPTS_KEY) }

      function updateUIForLockout(){
        const lock = getLockout(); const now = Date.now(); const msgEl = document.getElementById('message'); const btn = document.getElementById('submitBtn'); const input = document.getElementById('password');
        if(lock && now < lock){ const hrs = Math.ceil((lock - now)/3600000); msgEl.textContent = 'Trop d\u2019échecs. Réessayez dans ' + hrs + ' heure' + (hrs>1? 's' : ''); btn.classList.add('disabled'); input.classList.add('disabled'); input.disabled = true; btn.disabled = true; return true }
        if(lock && now >= lock){ clearLockout(); msgEl.textContent = ''; input.disabled = false; btn.disabled = false; btn.classList.remove('disabled'); input.classList.remove('disabled'); }
        return false
      }

      // initial check
      updateUIForLockout();

      document.getElementById('unlockForm').addEventListener('submit', async (e)=>{
        e.preventDefault();
        if(updateUIForLockout()) return;
        const pwd = document.getElementById('password').value;
        const msgEl = document.getElementById('message');

        try{
          const res = await fetch('/__auth', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ password: pwd }) });
          if(res.ok){ clearLockout(); msgEl.style.color = '#a5d6a7'; msgEl.textContent = 'ACCÈS AUTORISÉ...'; const card = document.getElementById('card'); card.style.transition = 'opacity 0.6s, transform 0.6s'; card.style.transform = 'scale(0.98)'; card.style.opacity = '0'; setTimeout(()=> location.reload(), 900); return }
          else {
            const attempts = getAttempts()+1; setAttempts(attempts); const remaining = MAX_ATTEMPTS - attempts; if(remaining <= 0){ setLockout(); updateUIForLockout(); msgEl.style.color = '#ef9a9a'; msgEl.textContent = 'VERROUILLÉ. Réessayez plus tard.' } else { msgEl.style.color = '#ef9a9a'; msgEl.textContent = 'CODE INCORRECT — ' + remaining + ' essai' + (remaining>1?'s':'') + ' restant' }
            document.getElementById('password').value = ''; document.getElementById('password').focus();
          }
        }catch(err){ msgEl.textContent = 'Erreur réseau'; msgEl.style.color = '#ef9a9a' }
      });
    </script>
</body>
</html>
`;
      return new Response(html, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
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
