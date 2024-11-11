import type { Load } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit';
import type { Ticket } from '$lib/types'
import { PUBLIC_WHALESPLAINER_URL } from '$env/static/public';

async function loadTicket(fetch: typeof window.fetch, ticket: string) {
    const res = await fetch(`/api/ticket/${ticket}`)
    if (!res.ok && res.status !== 404) {
        throw res
    }
    let ticketData: Ticket | undefined
    if (res.status === 200) {
        ticketData = await res.json()
    }
    return ticketData
}

export const load: Load = async ({ fetch, params, url }) => {
    console.log('Loading success page with params:', params);
    
    if (!params.ticket) {
        console.log('No ticket provided, redirecting to /buy');
        return redirect(302, '/buy')
    }
    
    console.log('Fetching ticket data for:', params.ticket);
    const ticketData = await loadTicket(fetch, params.ticket)
    console.log('Received ticket data:', ticketData);

    const ownerKey = url.searchParams.get('owner_key')
    const activeKey = url.searchParams.get('active_key')
    console.log('Keys from URL:', { ownerKey, activeKey });

    if (ticketData) {
        if (ownerKey && activeKey) {
            console.log('Redirecting to create page with keys');
            redirect(302, `/create?ticket=${params.ticket}&owner_key=${ownerKey}&active_key=${activeKey}`)
        } else {
            console.log('Redirecting to Whalesplainer activate page');
            redirect(302, `${PUBLIC_WHALESPLAINER_URL}/activate/${params.ticket}`)
        }
    }

    console.log('Returning page data');
    return {
        ticket: params.ticket,
        ticketData,
        searchParams: url.searchParams.toString()
    }
}