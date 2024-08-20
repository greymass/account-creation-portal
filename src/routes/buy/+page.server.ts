// import { type ServerLoad, redirect } from "@sveltejs/kit";
// import { freeAccountAvailable } from "$lib/sextant";

// const SEARCH_PARAMS_COOKIE = 'searchParamsCookie';

// export const load: ServerLoad = async ({ url, fetch, locals, cookies }) => {
//     const response = await fetch(`/api/stripe/product`)
//     const stripeProduct = await response.json()
//     const creationTicket = url.searchParams.get('ticket');

//     // Get the current search params
//     let currentSearchParams = new URLSearchParams(url.searchParams);

//     // If there are search params in the URL, update the cookie
//     if (currentSearchParams.toString()) {
//         cookies.set(SEARCH_PARAMS_COOKIE, currentSearchParams.toString(), {
//             path: '/',
//             maxAge: 60 * 60 * 1, // 1 hour
//             httpOnly: true,
//             secure: true,
//             sameSite: 'lax'
//         });
//     } else {
//         // If no search params in URL, try to get them from the cookie
//         const storedParams = cookies.get(SEARCH_PARAMS_COOKIE);

//         if (storedParams) {
//             currentSearchParams = new URLSearchParams(storedParams);
//         }
//     }

//     if (creationTicket) {
//         throw redirect(302, `/create?ticket=${creationTicket}&${currentSearchParams}`);
//     }

//     const session = await locals.auth()

//     let canGetFreeAccount = false

//     if (session?.user?.email) {
//         canGetFreeAccount = await freeAccountAvailable(session.user.email)
//     }

//     return {
//         stripeProduct: stripeProduct,
//         createRequestArguments: {
//             login_scope: currentSearchParams.get('scope'),
//             return_path: currentSearchParams.get('return_url'),
//             owner_key: currentSearchParams.get('owner_key'),
//             active_key: currentSearchParams.get('active_key'),
//         },
//         searchParams: String(currentSearchParams),
//         session,
//         canGetFreeAccount,
//     };
// };