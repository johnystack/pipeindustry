create function public.handle_new_user()
returns trigger as $$
begin
  -- Set the referred_by column if a referral_code is provided
  if new.raw_user_meta_data->>'referral_code' is not null then
    update public.profiles
    set referred_by = (select id from public.profiles where username = new.raw_user_meta_data->>'referral_code')
    where id = new.id;
  end if;

  -- Insert a new row into the public.profiles table
  insert into public.profiles (id, first_name, last_name, email, role, status)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', new.email, 'user', 'pending');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
