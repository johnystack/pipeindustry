create function public.get_dashboard_data(p_user_id uuid)
returns json as $$
begin
  -- Call the function to update due investments
  perform public.update_due_investments();

  return json_build_object(
    'profile', (select row_to_json(p) from profiles p where id = p_user_id),
    'investments', (select json_agg(row_to_json(i)) from investments i where user_id = p_user_id),
    'recent_transactions', (select json_agg(row_to_json(t)) from (select * from transactions where user_id = p_user_id order by created_at desc limit 5) t)
  );
end;
$$ language plpgsql;