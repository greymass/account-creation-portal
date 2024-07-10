import { SvelteKitAuth } from "@auth/sveltekit"
import Google from "@auth/sveltekit/providers/google"
import Apple from "@auth/sveltekit/providers/apple"
import { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_APPLE_ID, AUTH_APPLE_SECRET, AUTH_REDIRECT_URL } from "$env/static/private"
import { error, json, redirect, text, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const redirectUrl = AUTH_REDIRECT_URL || "http://localhost:3000"

const ALLOWED_PATHS = ['/auth/callback/apple'];

/**
 * Custom CSRF protection with the ability to bypass for specific routes.
 */
const csrf = (): Handle => async ({ event, resolve }) => {
  const forbidden =
    event.request.method === 'POST' &&
    event.request.headers.get('origin') !== event.url.origin &&
    isFormContentType(event.request) &&
    !ALLOWED_PATHS.includes(event.url.pathname);

  if (forbidden) {
    const message = `Cross-site ${event.request.method} form submissions are forbidden`;
    if (event.request.headers.get('accept') === 'application/json') {
      return json({ message }, { status: 403 });
    }
    return text(message, { status: 403 });
  }

  return resolve(event);
};

function isContentType(request: Request, ...types: string[]) {
  const type = request.headers.get('content-type')?.split(';', 1)[0].trim() ?? '';
  return types.includes(type);
}

function isFormContentType(request: Request) {
  return isContentType(request, 'application/x-www-form-urlencoded', 'multipart/form-data');
}

const authHandle = SvelteKitAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: AUTH_GOOGLE_ID,
      clientSecret: AUTH_GOOGLE_SECRET,
      redirectProxyUrl: `${redirectUrl}/auth/callback/google`,
    }),
    Apple({
      clientId: AUTH_APPLE_ID,
      clientSecret: AUTH_APPLE_SECRET,
      redirectProxyUrl: `${redirectUrl}/auth/callback/apple`,
    })
  ],
});

// Custom handle function to process Apple callback
// Custom handle function to process callbacks
const customHandle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/auth/callback/')) {
    const provider = event.url.pathname.split('/').pop(); // 'apple' or 'google'
    let searchParams: URLSearchParams;

    console.log({ provider, url: event.url.toString(), cookie: event.request.headers.get('cookie') });

    if (provider === 'apple' && event.request.method === 'POST') {
      // Handle Apple callback (POST request)
      const formData = await event.request.formData();
      searchParams = new URLSearchParams();
      for (const [key, value] of formData.entries()) {
        searchParams.append(key, value.toString());
      }
      const authUrl = new URL(`${event.url.origin}/auth/callback/${provider}?${searchParams.toString()}`);

      throw redirect( 302, authUrl.toString())
    }
  }

  return resolve(event);
};

// Combine our custom CSRF protection with SvelteKitAuth
export const handle = sequence(csrf(), customHandle, authHandle.handle);

export const { signIn, signOut } = authHandle;