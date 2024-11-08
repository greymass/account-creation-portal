// /auth/apple/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { signIn } from '../../../../auth';

export const POST: RequestHandler = async ({ request }) => {
    const { loginType } = await request.json()
   
    const session = await signIn(loginType);

    return json({ session }, { status: 200 });
}