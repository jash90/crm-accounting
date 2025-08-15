import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AcceptOfferRequest {
  token: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role for this function since it's public access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { token }: AcceptOfferRequest = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find offer by token
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('offers')
      .select(`
        *,
        clients (id, name, email)
      `)
      .eq('token', token)
      .single()

    if (offerError || !offer) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired offer token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (offer.status !== 'SENT') {
      return new Response(
        JSON.stringify({ error: 'Offer is not available for acceptance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update offer status
    const { error: updateError } = await supabaseAdmin
      .from('offers')
      .update({
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', offer.id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to accept offer' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create initial checklist
    const { error: checklistError } = await supabaseAdmin
      .rpc('create_first_checklist', { client_uuid: offer.client_id })

    if (checklistError) {
      console.error('Failed to create checklist:', checklistError)
      // Continue - this shouldn't block the acceptance
    }

    // Send Slack notification
    if (Deno.env.get('SLACK_WEBHOOK_URL')) {
      const slackPayload = {
        text: `🎉 New Offer Accepted!`,
        attachments: [
          {
            color: 'good',
            fields: [
              {
                title: 'Client',
                value: offer.clients.name,
                short: true
              },
              {
                title: 'Amount',
                value: `$${offer.net_total}`,
                short: true
              },
              {
                title: 'Accepted At',
                value: new Date().toLocaleString(),
                short: false
              }
            ]
          }
        ]
      }

      await fetch(Deno.env.get('SLACK_WEBHOOK_URL')!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        offerId: offer.id,
        clientName: offer.clients.name,
        amount: offer.net_total
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Accept offer error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})