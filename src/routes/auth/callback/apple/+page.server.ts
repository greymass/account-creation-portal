// auth/callback/apple/+server.ts
import { redirect, type ServerLoad } from "@sveltejs/kit";

export const load: ServerLoad = async ({ url }) => redirect(302, `/buy?${url.searchParams}`)