import { SENDGRID_KEY, SENDGRID_TEMPLATE, SENDGRID_FROM } from '$env/static/private'

const key = SENDGRID_KEY
const templateId = SENDGRID_TEMPLATE || 'd-1106a932fc984f14be0230c670820b38'
const from = SENDGRID_FROM || 'no-reply@greymass.com'


if (!key) {
    console.log('Missing SENDGRID_KEY, will not send emails')
}

export async function sendEmail(to: string, data: Record<string, string>) {
    if (!key) return

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        body: JSON.stringify({
            from: {
                email: from
            },
            personalizations: [
                {
                    to: [{ email: to }],
                    dynamic_template_data: data
                }
            ],
            template_id: templateId
        }),
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        method: 'POST'
    })
    if (res.status >= 400) {
        const body =
            parseInt(res.headers.get('content-length') || '0') > 0
                ? await res.text()
                : `${res.status} ${res.statusText}`
        throw new Error(`Sendgrid error: ${body}`)
    }
}
