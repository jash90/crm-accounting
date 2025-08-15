import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RegisterOwnerRequest {
  email: string
  password: string
  companyName: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Register owner function called');
    
    // Create Supabase client with service role key
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

    console.log('Supabase admin client created');
    
    const { email, password, companyName }: RegisterOwnerRequest = await req.json()

    console.log('Registration request:', { email, companyName });
    
    // Validate input
    if (!email || !password || !companyName) {
      console.log('Validation failed: missing required fields');
      return new Response(
        JSON.stringify({ error: 'Email, password, and company name are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (password.length < 8) {
      console.log('Validation failed: password too short');
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Starting auth user creation');
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for demo
    })

    if (authError) {
      console.log('Auth user creation failed:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Auth user created:', authData.user.id);
    const userId = authData.user.id

    // Start transaction-like operations
    // 1. Create user profile first (with null company_id initially)
    console.log('Creating user profile');
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: userId,
        email,
        role: 'OWNER',
        company_id: null
      }])

    if (userError) {
      console.log('User profile creation failed:', userError);
      // Clean up auth user if user profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile: ' + userError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User profile created');
    
    // 2. Create company (now that user exists)
    console.log('Creating company:', companyName);
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert([{
        name: companyName,
        owner_id: userId
      }])
      .select()
      .single()

    if (companyError) {
      console.log('Company creation failed:', companyError);
      // Clean up user profile and auth user if company creation fails
      await supabaseAdmin.from('users').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: 'Failed to create company: ' + companyError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Company created:', company.id);
    
    // 3. Update user profile with company_id
    console.log('Updating user profile with company_id');
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ company_id: company.id })
      .eq('id', userId)

    if (updateError) {
      console.log('User profile update failed:', updateError);
      // Clean up company, user profile and auth user if update fails
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      await supabaseAdmin.from('users').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: 'Failed to update user profile: ' + updateError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Registration completed successfully');
    return new Response(
      JSON.stringify({ 
        message: 'Company and owner account created successfully',
        user: { id: userId, email, role: 'OWNER' },
        company: { id: company.id, name: company.name }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Registration error details:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})