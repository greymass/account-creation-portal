import { error } from '@sveltejs/kit';
import { encode } from "@auth/core/jwt";
import * as jose from 'jose';
import { 
  AUTH_APPLE_TEAM_ID,
  AUTH_APPLE_SECRET,
  AUTH_APPLE_ID, 
  AUTH_SECRET, 
  AUTH_REDIRECT_URL,
  AUTH_APPLE_KEY_ID
} from "$env/static/private";

const redirectUrl = AUTH_REDIRECT_URL || "http://localhost:3000";
const COOKIE_NAME = "__Secure-authjs.session-token";

async function generateClientSecret(): Promise<string> {
    // Ensure the key is in PEM format
    let pemKey = AUTH_APPLE_SECRET;
    if (!pemKey.includes('-----BEGIN PRIVATE KEY-----')) {
      pemKey = `-----BEGIN PRIVATE KEY-----\n${pemKey}\n-----END PRIVATE KEY-----`;
    }
  
    const privateKey = await jose.importPKCS8(pemKey, 'ES256');
    
    const now = Math.floor(Date.now() / 1000);
    const jwt = await new jose.SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: AUTH_APPLE_KEY_ID})
      .setIssuer(AUTH_APPLE_TEAM_ID)
      .setSubject(AUTH_APPLE_ID)
      .setAudience('https://appleid.apple.com')
      .setIssuedAt(now)
      .setExpirationTime(now + 3600) // 1 hour from now
      .sign(privateKey);
  
    return jwt;
  }

export async function exchangeCodeForTokens(code: string): Promise<{ id_token: string, access_token: string, refresh_token: string }> {
  const clientSecret = await generateClientSecret();

  const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: AUTH_APPLE_ID,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: `${redirectUrl}/auth/callback/apple`,
    }),
  });

  if (!tokenResponse.ok) {
    throw error(400, 'Failed to validate Apple authorization code');
  }

  const tokenData = await tokenResponse.json();
  const { id_token, access_token, refresh_token } = tokenData;

  if (!id_token) {
    throw error(400, 'Missing id_token in Apple response');
  }

  return { id_token, access_token, refresh_token };
}

export async function parseIdToken(idToken: string): Promise<{email: string, sub: string}> {
    try {
      // Decode the ID token
      const { payload } = await jose.jwtVerify(idToken, jose.createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys')));
  
      // Extract email and sub (subject) from the payload
      const email = payload.email as string;
      const sub = payload.sub as string;
  
      if (!email) {
        throw new Error('Email not found in ID token');
      }
  
      return { email, sub };
    } catch (error) {
      console.error('Error parsing ID token:', error);
      throw new Error('Failed to parse ID token');
    }
  }

export function createSessionToken(decodedToken: any, accessToken: string, refreshToken: string): any {
  return {
    name: decodedToken.email,
    email: decodedToken.email,
    picture: null, // Apple doesn't provide a picture
    sub: decodedToken.sub,
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

export async function encodeCookies(token: any): Promise<{ cookie: { name: string; value: string; options: any } }> {
  const encodedToken = await encode({
    token,
    secret: AUTH_SECRET,
    salt: COOKIE_NAME,
    maxAge: 30 * 24 * 60 * 60 // 30 days
  });

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    path: '/',
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  };

  return {
    cookie: {
      name: COOKIE_NAME,
      value: encodedToken,
      options: cookieOptions,
    }
  };
}