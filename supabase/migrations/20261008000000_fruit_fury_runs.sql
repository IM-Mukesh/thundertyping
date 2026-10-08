-- Create table for authoritative Fruit Fury run state
CREATE TABLE IF NOT EXISTS public.fruit_fury_runs (
    run_id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    master_seed text NOT NULL,
    current_chunk integer NOT NULL DEFAULT 0,
    expected_token_hash text NOT NULL,
    score integer NOT NULL DEFAULT 0,
    combo integer NOT NULL DEFAULT 0,
    max_combo integer NOT NULL DEFAULT 0,
    cleared integer NOT NULL DEFAULT 0,
    lives integer NOT NULL DEFAULT 3,
    survived_ms integer NOT NULL DEFAULT 0,
    fever_gauge numeric NOT NULL DEFAULT 0,
    is_fever_active boolean NOT NULL DEFAULT false,
    fever_time_remaining integer NOT NULL DEFAULT 0,
    is_frozen_active boolean NOT NULL DEFAULT false,
    frozen_time_remaining integer NOT NULL DEFAULT 0,
    last_slice_time integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'active', -- 'active', 'completed', 'expired'
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    last_chunk_issued_at timestamptz NOT NULL DEFAULT now()
);

-- Protect table: NO ACCESS for browser roles
ALTER TABLE public.fruit_fury_runs ENABLE ROW LEVEL SECURITY;

-- Deny all by default to anon and authenticated
CREATE POLICY "Deny anon access" ON public.fruit_fury_runs FOR ALL TO anon USING (false);
CREATE POLICY "Deny authenticated access" ON public.fruit_fury_runs FOR ALL TO authenticated USING (false);

-- Only the server (service role) can insert/update runs to prevent client forgery
CREATE POLICY "Service role manages runs" 
    ON public.fruit_fury_runs FOR ALL TO service_role
    USING (true) 
    WITH CHECK (true);
