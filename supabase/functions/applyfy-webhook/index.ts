import { createClient } from 'npm:@supabase/supabase-js@2'
import { normalizeApplyfyPayment } from './payment-contract.mjs'

const json = (body: object, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
})
function safeEqual(left: string, right: string) {
  if (!left || left.length !== right.length) return false
  let difference = 0
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i)
  return difference === 0
}
Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const plan = new URL(request.url).searchParams.get('plan')
  if (plan !== 'monthly' && plan !== 'lifetime') return json({ error: 'Invalid plan' }, 400)
  const token = Deno.env.get(plan === 'monthly' ? 'APPLYFY_MONTHLY_TOKEN' : 'APPLYFY_LIFETIME_TOKEN')
  if (!token) return json({ error: 'Webhook is not configured' }, 503)
  const body = await request.text()
  if (body.length > 262144) return json({ error: 'Payload too large' }, 413)
  let payload
  try { payload = JSON.parse(body) } catch { return json({ error: 'Invalid JSON' }, 400) }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return json({ error: 'Invalid payload' }, 400)
  if (typeof payload.token !== 'string' || !safeEqual(payload.token, token)) return json({ error: 'Invalid token' }, 401)
  let payment
  try { payment = normalizeApplyfyPayment(payload, plan) } catch { return json({ error: 'Invalid payment fields' }, 422) }
  if (!payment) return json({ received: true, ignored: true })
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error } = await admin.rpc('process_payment_event', payment)
    if (error) return json({ error: 'Unable to process event' }, 500)
    if(payment.p_status==='approved'){
      // Access is already persisted. A failed invitation is retried by the outbox scheduler.
      const activation=await admin.functions.invoke('prime-maintenance',{body:{email:payment.p_email}})
      if(activation.error)console.warn('Buyer activation queued for retry')
    }
    return json({ received: true })
  } catch { return json({ error: 'Unable to process event' }, 500) }
})
