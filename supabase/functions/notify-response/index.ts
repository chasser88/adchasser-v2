import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ADMIN_EMAIL = 'charlzillion@gmail.com'

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record

    if (!record?.completed_at || !record?.campaign_id) {
      return new Response('skipped', { status: 200 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Fetch campaign and brand info
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('name, survey_slug, brand_id, brands(name, user_id)')
      .eq('id', record.campaign_id)
      .single()

    if (!campaign) return new Response('campaign not found', { status: 200 })

    // Fetch campaign owner email
    const { data: owner } = await supabase.auth.admin.getUserById(campaign.brands?.user_id)
    const ownerEmail = owner?.user?.email

    // Get total response count
    const { count } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', record.campaign_id)
      .not('completed_at', 'is', null)

    const insightsUrl = `https://adchasser.com/app/insights/${record.campaign_id}`
    const track = record.track === 'A' ? 'Track A — Organic Recall' : record.track === 'B' ? 'Track B — Forced Exposure' : 'Unknown Track'

    const emailHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#07090F;color:#ffffff;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#C9A84C,#E5C76B);padding:32px;text-align:center">
          <h1 style="margin:0;font-size:28px;color:#07090F;font-weight:700">New Response</h1>
          <p style="margin:8px 0 0;color:#07090F;opacity:0.7;font-size:14px">AdChasser Campaign Intelligence</p>
        </div>
        <div style="padding:32px">
          <p style="font-size:16px;color:#a0a0b0;margin:0 0 24px">A new survey response has been completed.</p>
          <div style="background:#111827;border-radius:12px;padding:20px;margin-bottom:24px">
            <div style="margin-bottom:12px">
              <p style="font-size:11px;color:#C9A84C;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px">Campaign</p>
              <p style="font-size:16px;font-weight:600;margin:0">${campaign.name}</p>
            </div>
            <div style="margin-bottom:12px">
              <p style="font-size:11px;color:#C9A84C;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px">Brand</p>
              <p style="font-size:16px;font-weight:600;margin:0">${campaign.brands?.name ?? '—'}</p>
            </div>
            <div style="margin-bottom:12px">
              <p style="font-size:11px;color:#C9A84C;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px">Track</p>
              <p style="font-size:14px;margin:0;color:#a0a0b0">${track}</p>
            </div>
            <div>
              <p style="font-size:11px;color:#C9A84C;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px">Total Responses</p>
              <p style="font-size:24px;font-weight:700;margin:0;color:#C9A84C">${count ?? 1}</p>
            </div>
          </div>
          <a href="${insightsUrl}" style="display:block;background:linear-gradient(135deg,#C9A84C,#E5C76B);color:#07090F;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-weight:700;font-size:15px">
            View Insights Dashboard →
          </a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #1f2937;text-align:center">
          <p style="font-size:12px;color:#4b5563;margin:0">AdChasser · adchasser.com</p>
        </div>
      </div>
    `

    // Send to admin always, plus campaign owner if different
    const recipients = [ADMIN_EMAIL]
    if (ownerEmail && ownerEmail !== ADMIN_EMAIL) recipients.push(ownerEmail)

    await Promise.all(recipients.map(to =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AdChasser <noreply@adchasser.com>',
          to,
          subject: `New response — ${campaign.name} (${count} total)`,
          html: emailHtml,
        }),
      })
    ))

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response('error', { status: 500 })
  }
})
