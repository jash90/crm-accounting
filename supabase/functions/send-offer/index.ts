import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode } from 'https://deno.land/std@0.168.0/encoding/hex.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendOfferRequest {
  offerId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { offerId }: SendOfferRequest = await req.json()

    if (!offerId) {
      return new Response(
        JSON.stringify({ error: 'Offer ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get offer with client details
    const { data: offer, error: offerError } = await supabaseClient
      .from('offers')
      .select(`
        *,
        clients (id, name, email)
      `)
      .eq('id', offerId)
      .single()

    if (offerError || !offer) {
      return new Response(
        JSON.stringify({ error: 'Offer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (offer.status !== 'DRAFT') {
      return new Response(
        JSON.stringify({ error: 'Only draft offers can be sent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate cryptographically secure token
    const tokenBytes = new Uint8Array(32)
    crypto.getRandomValues(tokenBytes)
    const token = encode(tokenBytes)

    // Update offer status and token
    const { error: updateError } = await supabaseClient
      .from('offers')
      .update({
        status: 'SENT',
        token: token,
      })
      .eq('id', offerId)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update offer' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email (using Resend or similar service)
    const emailPayload = {
      to: offer.clients.email,
      subject: `New Offer from Our Company - ${offer.net_total}`,
      html: `
        <h2>You have received a new offer!</h2>
        <p>Dear ${offer.clients.name},</p>
        <p>We've prepared a custom offer for you totaling $${offer.net_total}.</p>
        <p>Please review and accept your offer by clicking the link below:</p>
        <a href="${Deno.env.get('FRONTEND_URL')}/offer/${token}" 
           style="background: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View & Accept Offer
        </a>
        <p>This offer is valid for 30 days.</p>
        <p>Best regards,<br>The Team</p>
      `,
    }

    // Send via Resend (or your preferred email service)
    if (Deno.env.get('RESEND_API_KEY')) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('FROM_EMAIL') || 'offers@company.com',
          ...emailPayload,
        }),
      })

      if (!emailResponse.ok) {
        console.error('Failed to send email:', await emailResponse.text())
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        token,
        offerUrl: `${Deno.env.get('FRONTEND_URL')}/offer/${token}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send offer error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})