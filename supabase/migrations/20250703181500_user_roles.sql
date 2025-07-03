create table "public"."user_roles" (
    id uuid primary key references auth.users(id) on delete cascade,
    role text not null default 'ROLE_USER',
    created_at timestamp with time zone not null default now()
);

alter table "public"."user_roles" enable row level security;

create policy "Users can view own role" on "public"."user_roles"
    for select using (auth.uid() = id);

create policy "Users can insert own role" on "public"."user_roles"
    for insert with check (auth.uid() = id);

create function public.handle_new_user()
returns trigger language plpgsql as $$
begin
  insert into public.user_roles(id) values(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
