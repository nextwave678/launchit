-- Enable necessary extensions
create extension if not exists pgcrypto;

-- Set up demo user variables
DO $$
DECLARE
  new_user_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  user_email text := 'demo@launchit.app';
  user_password text := 'password123';
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = user_email
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    new_user_id,
    new_user_id,
    format('{"sub": "%s", "email": "%s"}', new_user_id::text, user_email)::jsonb,
    'email',
    new_user_id::text,
    now(),
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = new_user_id
  );

  -- Insert a sample project
  INSERT INTO public.projects (
    user_id,
    name,
    niche,
    business_type,
    status,
    risk_tolerance,
    goal_mrr
  )
  SELECT
    new_user_id,
    'AI Content Generator',
    'Content Marketing',
    'saas',
    'building',
    'medium',
    5000
  WHERE NOT EXISTS (
    SELECT 1 FROM public.projects WHERE user_id = new_user_id
  );
END $$;

