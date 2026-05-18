create or replace function public.handle_new_user()
returns trigger as $$
DECLARE
  verification_token TEXT;
  user_role TEXT;
BEGIN
  -- Get role from metadata, default to 'trader'
  user_role := coalesce(new.raw_user_meta_data->>'role', 'trader');

  -- Insert a new row into the public.profiles table
  insert into public.profiles (id, first_name, last_name, email, role, status, username)
  values (
    new.id, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    new.email, 
    user_role, 
    'pending', 
    new.raw_user_meta_data->>'username'
  );

  -- Set the referred_by column if a referral_code is provided
  if new.raw_user_meta_data->>'referral_code' is not null then
    update public.profiles
    set referred_by = (select id from public.profiles where username = new.raw_user_meta_data->>'referral_code')
    where id = new.id;
  end if;

  -- Generate a verification token
  verification_token := gen_random_uuid();
  UPDATE auth.users SET confirmation_token = verification_token WHERE id = new.id;

  -- Send verification email
  -- Note: send_verification_email_pg_net is assumed to exist as per previous migrations
  BEGIN
    PERFORM send_verification_email_pg_net(new.email, verification_token);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not send verification email: %', SQLERRM;
  END;

  return new;
end;
$$ language plpgsql security definer;
