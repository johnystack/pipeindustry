create or replace function public.handle_new_user()
returns trigger as $$
DECLARE
  verification_token TEXT;
BEGIN
  -- Insert a new row into the public.profiles table
  insert into public.profiles (id, first_name, last_name, email, role, status, username)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', new.email, 'user', 'pending', new.raw_user_meta_data->>'username');

  -- Set the referred_by column if a referral_code is provided
  if new.raw_user_meta_data->>'referral_code' is not null then
    update public.profiles
    set referred_by = (select id from public.profiles where username = new.raw_user_meta_data->>'referral_code')
    where id = new.id;
  end if;

  -- Generate a verification token
  verification_token := extensions.uuid_generate_v4();
  UPDATE auth.users SET confirmation_token = verification_token WHERE id = new.id;

  -- Send verification email
  PERFORM send_verification_email_pg_net(new.email, verification_token);

  return new;
end;
$$ language plpgsql security definer;
