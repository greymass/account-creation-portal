/** Stripe API helpers, backend only. */

import Stripe from 'stripe'
import { type CreateRequestArguments } from '@greymass/account-creation'

import { STRIPE_ENDPOINT_SECRET, STRIPE_PRIVATE_KEY, STRIPE_PUBLIC_KEY } from '$env/static/private'
import { PUBLIC_URL } from '$env/static/public'
import { generateCreationRequest } from './sextant'

/** Stripe API keys, public will be sent to frontend. */
const keys = {
    private: STRIPE_PRIVATE_KEY,
    public: STRIPE_PUBLIC_KEY,
    endpointSecret: STRIPE_ENDPOINT_SECRET
}

/** Public facing url for the service stripe will redirect back to. */
const publicUrl = new URL(PUBLIC_URL || 'http://localhost:3000')

// disabled because sveltekit adapter tries to execute code during build
if (!keys.private || !keys.public || !keys.endpointSecret) {
    console.log(
        'WARN: Missing stripe keys, please set STRIPE_PRIVATE_KEY, STRIPE_PUBLIC_KEY, and STRIPE_ENDPOINT_SECRET'
    )
}

const client = new Stripe(keys.private, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient()
})

export async function listProducts(): Promise<Stripe.Product[]> {
    const products: Stripe.Product[] = []
    for await (const product of client.products.list()) {
        if (product.active && product.metadata.sextant_id) {
            products.push(product)
        }
    }
    return products
}

export async function getProduct(stripeProductId: string) {
    const product = await client.products.retrieve(stripeProductId)
    if (!product.active || !product.metadata.sextant_id) {
        throw new Error('Product not found')
    }
    const prices = await client.prices.list({ product: stripeProductId, limit: 99, active: true })
    const price = prices.data[0]
    if (!price) {
        throw new Error('No price info')
    }
    return { product, price, key: keys.public }
}



export async function createSession(
    priceId: string,
    createRequestArguments: CreateRequestArguments,
    searchParams: string,
) {
    const price = await client.prices.retrieve(priceId, { expand: ['product'] })
    if (!price) {
        throw new Error('Price not found')
    }

    const product = price.product as Stripe.Product
    const sextantId = product.metadata.sextant_id
    if (!sextantId) {
        throw new Error('Product missing sextant_id')
    }

    const createRequest = generateCreationRequest(createRequestArguments)
    
    const session = await client.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        success_url: `${publicUrl.origin}/success/${createRequest.toString(false)}?${searchParams}`,
        cancel_url: `${publicUrl.origin}/buy?${searchParams}`,
        payment_intent_data: {
            metadata: { code: createRequest.code, request: createRequest.toString(false), sextantId }
        },
        line_items: [
            {
                price: priceId,
                quantity: 1
            }
        ],
        metadata: { code: createRequest.code, request: createRequest.toString(false), sextantId }
    })
    return {
        sessionId: session.id,
        key: keys.public
    }
}
export async function webhookEvent(request: Request) {
    const payload = await request.text()
    return await client.webhooks.constructEventAsync(
        payload,
        String(request.headers.get('Stripe-Signature')),
        keys.endpointSecret,
        30,
        Stripe.createSubtleCryptoProvider()
    )
}
