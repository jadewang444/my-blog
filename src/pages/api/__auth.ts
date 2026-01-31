import type { APIRoute } from "astro";

const SITE_PASSWORD = import.meta.env.SITE_PASSWORD || "";
const PASSWORD_COOKIE_NAME = "site_auth";
const PASSWORD_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export const POST: APIRoute = async ({ request }) => {
  if (!SITE_PASSWORD) {
    return new Response(JSON.stringify({ error: "Password not configured" }), {
      status: 500,
    });
  }

  try {
    const { password } = await request.json();

    if (password === SITE_PASSWORD) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Set-Cookie": `${PASSWORD_COOKIE_NAME}=${encodeURIComponent(
            password
          )}; Path=/; Max-Age=${PASSWORD_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${
            import.meta.env.PROD ? "; Secure" : ""
          }`,
        },
      });
    } else {
      return new Response(JSON.stringify({ error: "Incorrect password" }), {
        status: 401,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
    });
  }
};
