create function public.update_due_investments()
returns void as $$
begin
  update public.investments
  set status = 'completed'
  where status = 'active'
  and approved_at <= now() - interval '7 days';
end;
$$ language plpgsql;