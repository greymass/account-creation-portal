// import type { Load } from '@sveltejs/kit'
// import { redirect } from '@sveltejs/kit';
// import type { Ticket } from '$lib/types'
// import { PUBLIC_WHALESPLAINER_URL } from '$env/static/public';

// async function loadTicket(fetch: typeof window.fetch, ticket: string) {
//     const res = await fetch(`/api/ticket/${ticket}`)
//     if (!res.ok && res.status !== 404) {
//         throw res
//     }
//     let ticketData: Ticket | undefined
//     if (res.status === 200) {
//         ticketData = await res.json()
//     }
//     return ticketData
// }

// export const load: Load = async ({ fetch, params, url }) => {
//     if (!params.ticket) {
//         return redirect(302, '/buy')
//     }
//     const ticketData = await loadTicket(fetch, params.ticket)

//     const ownerKey = url.searchParams.get('owner_key')
//     const activeKey = url.searchParams.get('active_key')

//     if (ticketData) {
//         if (ownerKey && activeKey) {
//             redirect(302, `/create?ticket=${params.ticket}&owner_key=${ownerKey}&active_key=${activeKey}`)
//         } else {
//             redirect(302, `${PUBLIC_WHALESPLAINER_URL}/activate/${params.ticket}`)
//         }
//     }

//     return {
//         ticket: params.ticket,
//         ticketData,
//         searchParams: url.searchParams.toString()
//     }
// }