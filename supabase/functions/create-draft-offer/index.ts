import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateDraftOfferRequest {
  clientId: string
  items: Array<{
    itemId: string
    qty: number
  }>
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

    const { clientId, items }: CreateDraftOfferRequest = await req.json()

    if (!clientId || !items?.length) {
      return new Response(
        JSON.stringify({ error: 'Client ID and items are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile and company
    const { data: userProfile } = await supabaseClient
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.company_id) {
      return new Response(
        JSON.stringify({ error: 'User company not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch price list items
    const itemIds = items.map(item => item.itemId)
    const { data: priceItems, error: priceError } = await supabaseClient
      .from('price_list_items')
      .select('*')
      .in('id', itemIds)

    if (priceError || !priceItems?.length) {
      return new Response(
        JSON.stringify({ error: 'Price list items not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate total and prepare offer items
    let netTotal = 0
    const offerItems = items.map(item => {
      const priceItem = priceItems.find(p => p.id === item.itemId)
      if (!priceItem) {
        throw new Error(`Price item ${item.itemId} not found`)
      }
      
      const lineTotal = item.qty * priceItem.price
      netTotal += lineTotal
      
      return {
        price_list_item_id: item.itemId,
        name: priceItem.name,
        description: priceItem.description,
        qty: item.qty,
        price: priceItem.price,
      }
    })

    // Create offer
    const { data: offer, error: offerError } = await supabaseClient
      .from('offers')
      .insert({
        client_id: clientId,
        net_total: netTotal,
        company_id: userProfile.company_id,
        created_by: user.id,
      })
      .select()
      .single()

    if (offerError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create offer' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create offer items
    const offerItemsWithOfferId = offerItems.map(item => ({
      ...item,
      offer_id: offer.id,
    }))

    const { error: itemsError } = await supabaseClient
      .from('offer_items')
      .insert(offerItemsWithOfferId)

    if (itemsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create offer items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        offerId: offer.id,
        netTotal: offer.net_total,
        status: offer.status 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Create draft offer error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})