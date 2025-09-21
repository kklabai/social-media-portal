import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const authCode = searchParams.get("auth_code") || searchParams.get("code");
    
    console.log("Auth callback received");

    if (!authCode) {
      return new Response("Missing auth_code", { status: 400 });
    }

    const res = await fetch(
      `${process.env.NEXT_AUTH_URL}/auth/session/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.NEXT_AUTH_CLIENT_ID,
          client_secret: process.env.AUTH_CLIENT_SECRET,
          code: authCode,
        }),
      }
    );

    const data = await res.json();

    if (res.status !== 200) {
      console.error("Token exchange failed:", data);
      return new Response(data.message || "Token exchange failed", { status: 500 });
    }

    const cookieStore = await cookies();
    
    // Calculate maxAge from the expires_at timestamp if provided
    let maxAge = 60 * 60 * 24; // Default 1 day
    if (data.expires_at) {
      const expiresAt = typeof data.expires_at === 'number' ? data.expires_at * 1000 : data.expires_at;
      const now = Date.now();
      maxAge = Math.floor((expiresAt - now) / 1000);
    }

    // Clear any existing cookies first
    cookieStore.delete("nandi_session_token");
    cookieStore.delete("nandi_session");
    cookieStore.delete("force_logout");
    
    // Set the new cookie
    cookieStore.set({
      name: "nandi_session_token",
      value: data.session_token,
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: maxAge,
    });

    return Response.redirect(`${process.env.NEXT_BASE_URL}/dashboard`, 302);
  } catch (error) {
    console.error("Callback error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}