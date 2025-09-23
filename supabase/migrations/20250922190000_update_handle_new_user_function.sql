create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, email, role, status, username, referred_by)
  values (
    new.id, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    new.email, 
    'user', 
    'pending', 
    new.raw_user_meta_data->>'username',
    (select id from public.profiles where username = new.raw_user_meta_data->>'referral_code')
  );
  return new;
end;
$$ language plpgsql security definer;
