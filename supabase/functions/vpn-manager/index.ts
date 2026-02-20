import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const url = new URL(req.url)
        const action = url.pathname.split('/').pop()

        if (action === 'generate') {
            // 1. Deactivate old tokens
            await supabaseClient
                .from('vpn_tokens')
                .update({ is_active: false })
                .eq('user_id', user.id)

            // 2. Generate new token
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
            const expiresAt = new Date()
            expiresAt.setHours(expiresAt.getHours() + 24)

            const { data, error } = await supabaseClient
                .from('vpn_tokens')
                .insert({
                    user_id: user.id,
                    token,
                    expires_at: expiresAt.toISOString(),
                    is_active: true
                })
                .select()
                .single()

            if (error) throw error
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'status') {
            const { data, error } = await supabaseClient
                .from('vpn_tokens')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single()

            return new Response(JSON.stringify(data || { active: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'verify') {
            const { token } = await req.json()
            if (!token) throw new Error('Token required')

            // Use service role for verification if user JWT is not available or if we want to check token across all users
            const { data, error } = await supabaseClient
                .from('vpn_tokens')
                .select('*')
                .eq('token', token)
                .eq('is_active', true)
                .single()

            if (error || !data) throw new Error('Invalid or expired token')

            if (new Date(data.expires_at) < new Date()) {
                await supabaseClient.from('vpn_tokens').update({ is_active: false }).eq('id', data.id)
                throw new Error('Token expired')
            }

            if (data.bandwidth_used >= data.bandwidth_limit) {
                throw new Error('Bandwidth limit reached (1.5GB)')
            }

            return new Response(JSON.stringify({
                success: true,
                config: {
                    address: data.allowed_ip,
                    server_public_key: 'GOhAqd4tlRQYwMSFtcnlSEyYtM6adwCzNLx/xqOEegw=',
                    endpoint: '20.244.84.153:51820',
                    private_key: 'CLIENT_PRIVATE_KEY_HERE' // Placeholder or client-generated
                }
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
