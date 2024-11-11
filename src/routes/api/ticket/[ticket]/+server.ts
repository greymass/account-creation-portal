import { json, type RequestHandler } from '@sveltejs/kit'
import { SextantError, verifyTicket } from '$lib/sextant'

export const GET: RequestHandler = async ({ params }) => {
    try {
        console.log('GET /api/ticket/[ticket] called with params:', params);
        
        if (!params.ticket) {
            console.log('No ticket provided in params');
            return json({ error: 'Missing creation code' }, { status: 400 })
        }
        
        console.log('Verifying ticket:', params.ticket);
        const result = await verifyTicket(params.ticket)
        console.log('Ticket verification result:', result);

        return json(result, { status: 200 })
    } catch (error) {
        if (error instanceof SextantError && error.code === 404) {
            return json({ error: 'Ticket not found' }, { status: 404 })
        }

        return json({ error }, { status: 500 })
    }
}
