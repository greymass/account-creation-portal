import { json, type RequestHandler } from '@sveltejs/kit'
import { SextantError, verifyTicket } from '$lib/sextant'

export const GET: RequestHandler = async ({ params }) => {
    try {        
        if (!params.ticket) {
            return json({ error: 'Missing creation code' }, { status: 400 })
        }
        
        const result = await verifyTicket(params.ticket)

        return json(result, { status: 200 })
    } catch (error) {
        if (error instanceof SextantError && error.code === 404) {
            return json({ error: 'Ticket not found' }, { status: 404 })
        }

        return json({ error }, { status: 500 })
    }
}
