import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Edge-safe auth check: do not import `@/auth` here - it pulls in MongoDB/bcrypt
 * and breaks the Edge runtime ("stream" module error).
 */
function sessionCookieName() {
	return process.env.NODE_ENV === "production"
		? "__Secure-authjs.session-token"
		: "authjs.session-token";
}

export async function middleware(request: NextRequest) {
	const secret = process.env.AUTH_SECRET;
	if (!secret) {
		console.error("[middleware] AUTH_SECRET is not set");
		return NextResponse.next();
	}

	const token = await getToken({
		req: request,
		secret,
		secureCookie: process.env.NODE_ENV === "production",
		cookieName: sessionCookieName(),
	});

	const path = request.nextUrl.pathname;
	const isAuth = !!token;

	if (
		["/dashboard", "/profile"].some(
			(p) => path === p || path.startsWith(`${p}/`)
		)
	) {
		if (!isAuth) {
			const u = new URL("/login", request.url);
			u.searchParams.set("callbackUrl", path);
			return NextResponse.redirect(u);
		}
	}

	if (isAuth && ["/login", "/signup"].includes(path)) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.webp$).*)",
	],
};
