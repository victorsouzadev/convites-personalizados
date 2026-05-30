import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { password } = await req.json() as { password: string };
        const masterPassword = Deno.env.get('MASTER_PASSWORD') ?? '';

        const valid = masterPassword.length > 0 && password === masterPassword;

        return new Response(JSON.stringify({ valid }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch {
        return new Response(JSON.stringify({ valid: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
});
