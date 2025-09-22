import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const url = new URL(req.url)
    const pathname = url.pathname

    // Get user from token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Routes for Samudra Ledger Carbon Credit Platform
    if (pathname === '/projects/manager-with-credits' && req.method === 'GET') {
      // Get user role from users table
      const { data: userData, error: roleError } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (roleError || userData?.role !== 'project_manager') {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Project Manager role required' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get projects with credits for this manager
      const { data: projects, error: projectsError } = await supabaseClient
        .from('projects')
        .select(`
          id,
          name,
          description,
          project_type,
          status,
          total_credits_generated,
          credits_available,
          credits_retired,
          created_at,
          updated_at
        `)
        .eq('manager_id', user.id)
        .eq('status', 'approved')

      if (projectsError) {
        return new Response(
          JSON.stringify({ error: projectsError.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ projects: projects || [] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all projects (public endpoint)
    if (pathname === '/projects' && req.method === 'GET') {
      const { data: projects, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ projects }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create new project
    if (pathname === '/projects' && req.method === 'POST') {
      const body = await req.json()
      
      const { data: project, error } = await supabaseClient
        .from('projects')
        .insert({
          name: body.name,
          description: body.description,
          project_type: body.project_type,
          manager_id: user.id,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ project }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify project (NCCR Verifier only)
    if (pathname.startsWith('/projects/') && pathname.endsWith('/verify') && req.method === 'PUT') {
      const projectId = pathname.split('/')[2]
      const body = await req.json()

      // Check if user is NCCR Verifier
      const { data: userData, error: roleError } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (roleError || userData?.role !== 'nccr_verifier') {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - NCCR Verifier role required' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: project, error } = await supabaseClient
        .from('projects')
        .update({ 
          status: body.status,
          total_credits_generated: body.credits_generated || 0,
          credits_available: body.credits_generated || 0
        })
        .eq('id', projectId)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ project }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})