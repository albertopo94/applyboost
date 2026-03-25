-- Migration to insert a test user for anonymous CV generations
-- Required because the generations table has a foreign key to public.users

-- Insert into auth.users (Supabase Auth)
-- Using ID 00000000-0000-0000-0000-000000000000
-- Note: In a managed Supabase environment, you might need to use the dashboard or a specialized function if direct auth schema access is restricted,
-- but local migrations typically have access.
INSERT INTO auth.users (id, email, aud, role, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'test@example.com', 
    'authenticated', 
    'authenticated', 
    '{"full_name": "Test User"}', 
    '{}', 
    now(), 
    now(), 
    '', 
    '', 
    '', 
    ''
)
ON CONFLICT (id) DO NOTHING;

-- Ensure it exists in public.users (in case the trigger didn't fire or already exists)
-- The trigger on_auth_user_created usually handles this, but we'll be explicit for safety.
INSERT INTO public.users (id, email, full_name, exports_available)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'test@example.com', 
    'Test User', 
    9999 -- Provide plenty of exports for testing
)
ON CONFLICT (id) DO NOTHING;

-- Ensure it exists in user_exports too
INSERT INTO public.user_exports (user_id, exports_available)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    9999
)
ON CONFLICT (user_id) DO NOTHING;
