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
    console.log('Initial pemKey:', AUTH_APPLE_SECRET);
    
    if (!pemKey.includes('-----BEGIN PRIVATE KEY-----')) {
      pemKey = `-----BEGIN PRIVATE KEY-----\n${pemKey}\n-----END PRIVATE KEY-----`;
      console.log('Formatted pemKey:', pemKey);
    }
  
    console.log('Importing private key...');
    const privateKey = await jose.importPKCS8(pemKey, 'ES256');
    console.log('Private key imported successfully');
    
    const now = Math.floor(Date.now() / 1000);
    console.log('Current timestamp:', now);

    console.log('JWT parameters:', {
      kid: AUTH_APPLE_KEY_ID,
      issuer: AUTH_APPLE_TEAM_ID,
      subject: AUTH_APPLE_ID,
      audience: 'https://appleid.apple.com',
      issuedAt: now,
      expirationTime: now + 3600
    });

    const jwt = await new jose.SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: AUTH_APPLE_KEY_ID})
      .setIssuer(AUTH_APPLE_TEAM_ID)
      .setSubject(AUTH_APPLE_ID)
      .setAudience('https://appleid.apple.com')
      .setIssuedAt(now)
      .setExpirationTime(now + 3600) // 1 hour from now
      .sign(privateKey);
    
    console.log('Generated JWT:', jwt);
  
    return jwt;
  }

export async function exchangeCodeForTokens(code: string): Promise<{ id_token: string, access_token: string, refresh_token: string }> {
  const clientSecret = await generateClientSecret();

  // console.log(`curl -X POST 'https://appleid.apple.com/auth/token' \\
  //   -H 'Content-Type: application/x-www-form-urlencoded' \\
  //   -d 'client_id=${AUTH_APPLE_ID}' \\
  //   -d 'client_secret=${clientSecret}' \\
  //   -d 'code=${code}' \\
  //   -d 'grant_type=authorization_code' \\
  //   -d 'redirect_uri=${redirectUrl}/auth/callback/apple'`);

  // throw error(400, 'Failed to validate Apple authorization code');

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
    console.log({
      client_id: AUTH_APPLE_ID,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: `${redirectUrl}/auth/callback/apple`,
    });
    console.error('Failed to validate Apple authorization code:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      headers: tokenResponse.headers,
      body: await tokenResponse.text().catch(e => `Failed to read body: ${e}`),
    });
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