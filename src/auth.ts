import { SvelteKitAuth } from "@auth/sveltekit"
import Google from "@auth/sveltekit/providers/google"
import Apple from "@auth/sveltekit/providers/apple"
import { 
  AUTH_GOOGLE_ID, 
  AUTH_GOOGLE_SECRET, 
  AUTH_APPLE_ID, 
  AUTH_APPLE_SECRET, 
  AUTH_SECRET, 
  AUTH_REDIRECT_URL 
} from "$env/static/private"
import { error, redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { 
  exchangeCodeForTokens, 
  createSessionToken, 
  parseIdToken,
  encodeCookies
} from '$lib/apple';

const redirectUrl = AUTH_REDIRECT_URL || "http://localhost:3000"

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
  secret: AUTH_SECRET,
})

const appleAuthenticationHandle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === '/auth/callback/apple' && event.request.method === 'POST') {
    const formData = await event.request.formData();
    const code = formData.get('code') as string;
    
    if (!code) {
      throw error(400, 'Missing code in Apple callback');
    }

    try {
      const { id_token, access_token, refresh_token } = await exchangeCodeForTokens(code);
      const decodedToken = await parseIdToken(id_token);
      const sessionToken = createSessionToken(decodedToken, access_token, refresh_token);
      const { cookie } = await encodeCookies(sessionToken);

      event.cookies.set(cookie.name, cookie.value, cookie.options);

      // Resolve the event to ensure cookies are set
      await resolve(event);

    } catch (err) {
      throw error(500, 'Error processing Apple sign-in');
    }

    throw redirect(302, `/buy?${event.url.searchParams}`);
  }

  return resolve(event);
};

export const handle: Handle = sequence(appleAuthenticationHandle, authHandle.handle);

export const { signIn, signOut } = authHandle;