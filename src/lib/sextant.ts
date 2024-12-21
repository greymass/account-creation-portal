/** Sextant API helpers, backend only. */

import { Bytes, Checksum256, PrivateKey } from '@wharfkit/antelope'
import { SEXTANT_URL, SEXTANT_DEVICE_UUID, SEXTANT_KEY, ACCOUNT_CREATOR_VERSION, BUOY_SERVICE_URL, STRIPE_PRODUCT_ID, SEXTANT_PRODUCT_ID, UNLIMITED_ACCOUNTS_PER_EMAIL } from '$env/static/private'
import type { NameType, PublicKeyType } from '@wharfkit/antelope'
import { CreateRequest, type CreateRequestArguments, type CreateRequestType } from '@greymass/account-creation'
import { randomCode } from './helpers'
import { getProduct } from './stripe'

const sextantUrl = SEXTANT_URL || 'http://localhost:8080'
const sextantDeviceUUID = SEXTANT_DEVICE_UUID || '8273DBFA-D91F-4C65-A8A3-0D9325B5E99C'
const sextantKey = PrivateKey.from(SEXTANT_KEY || 'PVT_K1_2VbtWei9iPNJWDkzSdrJG1BHEyftwPWeJVnyaKxzi4hkjVX2fF')
const buoyServiceUrl = new URL(BUOY_SERVICE_URL || 'https://cb.anchor.link')
const accountCreatorVersion = ACCOUNT_CREATOR_VERSION || 'account-creation-portal'
const stripeProductId = STRIPE_PRODUCT_ID
const unlimitedAccountsPerEmail = UNLIMITED_ACCOUNTS_PER_EMAIL === 'true'


export class SextantError extends Error {
    code: number
    reason: string
    constructor(data: any, code: number) {
        super(`Sextant ${code} - ${data.reason}`)
        this.code = code
        this.reason = data.reason
    }
}
  
async function sextantApiCall<T = any>(path: string, data: any): Promise<T | undefined> {
    const body = Bytes.from(JSON.stringify(data), 'utf8');
    const signature = sextantKey.signMessage(body);
    
    const response = await fetch(sextantUrl + path, {
      body: JSON.stringify(data),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Sig': String(signature)
      }
    });

    if (response?.status !== 200) {
        let errorData: any
        try {
            errorData = await response.json()
        } catch {
            throw new Error(`Unknown Sextant API error: ${response.status}`)
        }
        throw new SextantError(errorData, response.status)
    }

    if (
        response.headers.get('Content-Type') &&
        response.headers.get('Content-Type')?.startsWith('application/json')
    ) {
        return response.json()
    }
}

export async function createTicket(code: string, productId: string, comment: string, email?: string) {
    await sextantApiCall('/tickets/new', {
        code,
        productId,
        comment,
        email: unlimitedAccountsPerEmail ? undefined : email,
    })
}

export async function verifyTicket(payload: CreateRequestType) {
    const request = CreateRequest.from(payload)
    const ticket = await sextantApiCall('/tickets/verify', {
        code: request.code,
        deviceId: SEXTANT_DEVICE_UUID,
        version: 'account-creation-portal'
    })

    return ticket
}

export async function checkAccountName(productId: string, accountName: NameType, ticket: string) {
    const createRequest = CreateRequest.from(ticket)

    try {
        await sextantApiCall('/tickets/check', {
            name: String(accountName),
            code: createRequest.code,
            deviceId: sextantDeviceUUID,
            productId,
            version: accountCreatorVersion
        })
    } catch (error: unknown) {
        return { nameAvailable: false }
    }

    return { nameAvailable: true }
}

export async function freeAccountAvailable(email: string) {
    try {
        await sextantApiCall('/tickets/free', {
            email
        })

        return true
    }
    catch (error: unknown) {
        return false
    }
}

export interface CreateAccountRequest {
    ticket: string
    productId: string
    activeKey: PublicKeyType
    ownerKey: PublicKeyType
    accountName: NameType
}

export function createAccount(payload: CreateAccountRequest) {
    const { code } = CreateRequest.from(payload.ticket)

    if (!code) {
        throw new Error('Invalid ticket')
    }

    return sextantApiCall('/tickets/create', {
        productId: payload.productId,
        activeKey: String(payload.activeKey),
        ownerKey: String(payload.ownerKey),
        accountName: String(payload.accountName),
        deviceId: sextantDeviceUUID,
        version: accountCreatorVersion,
        code,
    })
}

export function generateCreationRequest(createRequestArguments: Partial<CreateRequestArguments> = {}) {
    const code = randomCode()
    const codeHash = Checksum256.hash(Bytes.from(code, 'utf8')).hexString
    const loginUrl = `${buoyServiceUrl.origin}/${codeHash}`

    return CreateRequest.from({
        ...createRequestArguments,
        code,
        login_url: loginUrl,
    })
}

export async function getSextantProductId() {
    if (SEXTANT_PRODUCT_ID) {
        return SEXTANT_PRODUCT_ID
    }
    const stripeProduct = await getProduct(stripeProductId)

    return stripeProduct.product.metadata.sextant_id
}
