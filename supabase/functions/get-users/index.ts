import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// This function requires a secret named SUPABASE_SERVICE_ROLE_KEY in the Edge Function settings.
// The value should be the secret key (starts with sb_secret_ or is a long JWT) from the API settings page.

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create a Supabase client with the standard SERVICE_ROLE_KEY.
    // This key MUST be set in the function's secrets.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Verify the caller's JWT to ensure they are a valid user.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Forbidden: Missing Authorization header' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt)

    if (userError) {
      return new Response(JSON.stringify({ error: `Authentication failed: ${userError.message}` }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Check if the verified user has the 'admin' role in the 'profiles' table.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: User is not an admin.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- If all checks pass, proceed to fetch all users --- //

    // 4. Get all users from Supabase Auth using the admin client.
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) {
      // This error would likely be a problem with the service key itself.
      throw new Error(`Failed to list users as admin: ${authError.message}`);
    }

    // 5. Get all profiles to map roles to the users.
    const { data: profiles, error: profilesError2 } = await supabaseAdmin.from('profiles').select('id, role')
    if (profilesError2) throw profilesError2

    const profilesMap = new Map(profiles.map(p => [p.id, p.role]))

    // 6. Combine auth users with their roles.
    const combinedUsers = authUsers.map(u => ({
      id: u.id,
      email: u.email,
      role: profilesMap.get(u.id) || 'user', // Default to 'user' if no profile found.
    }))

    // 7. Return the final list.
    return new Response(JSON.stringify(combinedUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
