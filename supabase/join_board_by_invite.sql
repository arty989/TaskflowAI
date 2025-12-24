create or replace function public.join_board_by_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  bid uuid;
begin
  select b.id into bid
  from public.boards b
  where b.invite_code = invite_code;

  if bid is null then
    return null;
  end if;

  insert into public.board_members(board_id, user_id, role, permissions)
  values (bid, auth.uid(), 'member', array['can_view']::text[])
  on conflict (board_id, user_id) do nothing;

  delete from public.board_invites
  where board_id = bid and user_id = auth.uid();

  delete from public.notifications
  where type = 'invite' and board_id = bid and to_user_id = auth.uid();

  return bid;
end;
$$;

grant execute on function public.join_board_by_invite(text) to authenticated;
