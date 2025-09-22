create function public.get_referral_data(p_user_id uuid)
returns json as $$
begin
  return json_build_object(
    'profile', (select row_to_json(p) from profiles p where id = p_user_id),
    'referral_stats', (
      select json_build_object(
        'total_referrals', count(*) filter (where referred_by = p_user_id),
        'active_referrals', count(*) filter (where referred_by = p_user_id and has_invested = true),
        'total_earned', (select sum(amount) from transactions where user_id = p_user_id and type = 'Referral' and status = 'completed')
      ) from profiles
    ),
    'recent_referrals', (
      select json_agg(json_build_object(
        'name', u.first_name || ' ' || u.last_name,
        'email', '',
        'joinDate', u.created_at,
        'status', case when u.has_invested then 'Active' else 'Pending' end,
        'invested', (select sum(amount) from investments where user_id = u.id),
        'commission', (select sum(amount) from transactions where user_id = p_user_id and type = 'Referral' and referred_user_id = u.id)
      )) from profiles u where referred_by = p_user_id
    ),
    'commission_earnings', (
      select json_agg(row_to_json(t)) from transactions t where user_id = p_user_id and type = 'Referral'
    )
  );
end;
$$ language plpgsql;