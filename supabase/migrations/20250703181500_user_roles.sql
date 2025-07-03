create table "public"."user_roles" (
    id uuid primary key references auth.users(id) on delete cascade,
    role text not null default 'ROLE_USER',
    created_at timestamp with time zone not null default now()
);

alter table "public"."user_roles" enable row level security;

grant delete on table "public"."user_roles" to "service_role";
grant insert on table "public"."user_roles" to "service_role";
grant references on table "public"."user_roles" to "service_role";
grant select on table "public"."user_roles" to "service_role";
grant trigger on table "public"."user_roles" to "service_role";
grant truncate on table "public"."user_roles" to "service_role";
grant update on table "public"."user_roles" to "service_role";

create policy "Users can view own role" on "public"."user_roles"
    for select using (auth.uid() = id);

create policy "Users can insert own role" on "public"."user_roles"
    for insert with check (auth.uid() = id);

create policy "Service can insert role" on "public"."user_roles"
    for insert to service_role with check (true);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_roles(id) values(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
