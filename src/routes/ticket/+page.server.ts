import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { CreateRequest } from '@greymass/account-creation';
import { createTicket, generateCreationRequest, getSextantProductId } from '$lib/sextant';
import { PUBLIC_WHALESPLAINER_URL } from '$env/static/public';

export const actions: Actions = {
  default: async ({ url, locals, request }) => {
    const session = await locals.auth();

    if (!session) {
    return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();

    const searchParams = new URLSearchParams(String(formData.get('searchParams')));

    const createRequestArguments = {
    login_scope: String(searchParams.get('scope') ?? ''),
    return_path: String(searchParams.get('return_url') ?? ''),
    };
    
    const createRequest: CreateRequest = generateCreationRequest(createRequestArguments)
    const sextantProductId = await getSextantProductId();

    const issuedCode = await createTicket(createRequest.code, sextantProductId, 'free account - google login', session.user?.email ?? undefined);

    // Sextant hands back a stored code when it reuses an unspent ticket; the submitted one was never persisted.
    const ticket: CreateRequest =
        issuedCode === createRequest.code
            ? createRequest
            : generateCreationRequest(createRequestArguments, issuedCode)

    if (searchParams.get('owner_key') || searchParams.get('active_key')) {
        redirect(302, `/create?ticket=${ticket.toString(false)}&${searchParams}`);
    } else {
        return redirect(302, `${PUBLIC_WHALESPLAINER_URL}/activate/${ticket.toString(false)}`)
    }
  },
};
