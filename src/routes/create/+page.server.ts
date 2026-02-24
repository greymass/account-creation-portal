import type { SextantError } from '$lib/sextant';
import { redirect, type Load, type ServerLoad } from '@sveltejs/kit';

const SEARCH_PARAMS_COOKIE = 'searchParamsCookie';

function loadTicket(fetch: typeof window.fetch, ticket: string) {
    return fetch(`/api/ticket/${ticket}`).then(res => {
        if (!res.ok && res.status !== 404) {
            throw res;
        }
        let ticketData;
        if (res.status === 200) {
            ticketData = res.json();
        }
        return ticketData;
    })
}

export const load: ServerLoad = async ({ url, fetch, cookies }) => {
    const ticket = url.searchParams.get('ticket');

    const params = new URLSearchParams(url.searchParams);

    if (!ticket) {
        throw redirect(302, '/buy');
    }

    let ticketData
    try {
        ticketData = await loadTicket(fetch, ticket);
    } catch (error: SextantError | unknown) {
        console.error('Error loading ticket:', error)

        throw redirect(302, `/buy?${params.toString()}`);
    }

    // If owner_key or active_key are missing, try to get them from the cookie
    if (!params.get('owner_key') || !params.get('active_key')) {
        const storedParams = cookies.get(SEARCH_PARAMS_COOKIE);

        if (storedParams) {
            const cookieParams = new URLSearchParams(storedParams);
            params.set('owner_key', cookieParams.get('owner_key')!);
            params.set('active_key', cookieParams.get('active_key')!);
        }
    }

    if (!ticketData || !params.get('owner_key') || !params.get('active_key')) {
        console.error('Missing keys so redirecting to buy page');

        throw redirect(302, `/buy?${params.toString()}`);
    }

    const response = await fetch(`/api/stripe/product`)

    const stripeProduct = await response.json()

    return {
        ticket,
        product: stripeProduct.product,
        searchParams: params.toString()
    };
};