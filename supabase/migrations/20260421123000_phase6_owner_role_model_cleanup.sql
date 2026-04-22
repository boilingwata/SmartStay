begin;

update smartstay.profiles
set role = case
  when role::text in ('admin', 'manager', 'landlord') then 'owner'::smartstay.user_role
  when role::text = 'viewer' then 'tenant'::smartstay.user_role
  else role
end
where role::text in ('admin', 'manager', 'landlord', 'viewer');

delete from smartstay.roles
where name in ('Landlord', 'Manager');

create or replace function private.is_super_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = private, smartstay, auth, public
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = user_id
      and coalesce(u.raw_app_meta_data ->> 'workspace_role', '') = 'super_admin'
  );
$$;

create or replace function private.is_owner(user_id uuid)
returns boolean
language sql
security definer
set search_path = private, smartstay, public
as $$
  select exists (
    select 1
    from smartstay.profiles p
    where p.id = user_id
      and p.role = 'owner'::smartstay.user_role
  );
$$;

create or replace function private.is_staff(user_id uuid)
returns boolean
language sql
security definer
set search_path = private, smartstay, public
as $$
  select exists (
    select 1
    from smartstay.profiles p
    where p.id = user_id
      and p.role = 'staff'::smartstay.user_role
  );
$$;

create or replace function private.is_workspace_operator(user_id uuid)
returns boolean
language sql
security definer
set search_path = private, smartstay, auth, public
as $$
  select private.is_super_admin(user_id)
      or private.is_owner(user_id)
      or private.is_staff(user_id);
$$;

create or replace function private.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = private, smartstay, auth, public
as $$
  select private.is_workspace_operator(user_id);
$$;

do $$
declare
  policy_row record;
  roles_clause text;
  new_qual text;
  new_with_check text;
  create_sql text;
begin
  for policy_row in
    select
      schemaname,
      tablename,
      policyname,
      permissive,
      cmd,
      roles,
      qual,
      with_check
    from pg_policies
    where schemaname = 'smartstay'
      and (
        coalesce(qual, '') like '%private.is_admin%'
        or coalesce(with_check, '') like '%private.is_admin%'
        or coalesce(qual, '') like '%''admin''::smartstay.user_role%'
        or coalesce(with_check, '') like '%''admin''::smartstay.user_role%'
        or coalesce(qual, '') like '%''manager''::smartstay.user_role%'
        or coalesce(with_check, '') like '%''manager''::smartstay.user_role%'
        or coalesce(qual, '') like '%''landlord''::smartstay.user_role%'
        or coalesce(with_check, '') like '%''landlord''::smartstay.user_role%'
      )
  loop
    new_qual := policy_row.qual;
    new_with_check := policy_row.with_check;

    new_qual := replace(new_qual, 'private.is_admin', 'private.is_workspace_operator');
    new_with_check := replace(new_with_check, 'private.is_admin', 'private.is_workspace_operator');

    new_qual := replace(new_qual, 'ARRAY[''admin''::smartstay.user_role, ''manager''::smartstay.user_role, ''staff''::smartstay.user_role, ''landlord''::smartstay.user_role]', 'ARRAY[''owner''::smartstay.user_role, ''staff''::smartstay.user_role]');
    new_with_check := replace(new_with_check, 'ARRAY[''admin''::smartstay.user_role, ''manager''::smartstay.user_role, ''staff''::smartstay.user_role, ''landlord''::smartstay.user_role]', 'ARRAY[''owner''::smartstay.user_role, ''staff''::smartstay.user_role]');

    new_qual := replace(new_qual, 'ARRAY[''admin''::smartstay.user_role, ''staff''::smartstay.user_role, ''manager''::smartstay.user_role, ''landlord''::smartstay.user_role]', 'ARRAY[''owner''::smartstay.user_role, ''staff''::smartstay.user_role]');
    new_with_check := replace(new_with_check, 'ARRAY[''admin''::smartstay.user_role, ''staff''::smartstay.user_role, ''manager''::smartstay.user_role, ''landlord''::smartstay.user_role]', 'ARRAY[''owner''::smartstay.user_role, ''staff''::smartstay.user_role]');

    new_qual := replace(new_qual, 'ARRAY[''admin''::smartstay.user_role, ''manager''::smartstay.user_role, ''staff''::smartstay.user_role]', 'ARRAY[''owner''::smartstay.user_role, ''staff''::smartstay.user_role]');
    new_with_check := replace(new_with_check, 'ARRAY[''admin''::smartstay.user_role, ''manager''::smartstay.user_role, ''staff''::smartstay.user_role]', 'ARRAY[''owner''::smartstay.user_role, ''staff''::smartstay.user_role]');

    new_qual := replace(new_qual, 'ARRAY[''admin''::smartstay.user_role, ''manager''::smartstay.user_role]', 'ARRAY[''owner''::smartstay.user_role]');
    new_with_check := replace(new_with_check, 'ARRAY[''admin''::smartstay.user_role, ''manager''::smartstay.user_role]', 'ARRAY[''owner''::smartstay.user_role]');

    new_qual := replace(new_qual, '''admin''::smartstay.user_role', '''owner''::smartstay.user_role');
    new_with_check := replace(new_with_check, '''admin''::smartstay.user_role', '''owner''::smartstay.user_role');
    new_qual := replace(new_qual, '''manager''::smartstay.user_role', '''owner''::smartstay.user_role');
    new_with_check := replace(new_with_check, '''manager''::smartstay.user_role', '''owner''::smartstay.user_role');
    new_qual := replace(new_qual, '''landlord''::smartstay.user_role', '''owner''::smartstay.user_role');
    new_with_check := replace(new_with_check, '''landlord''::smartstay.user_role', '''owner''::smartstay.user_role');

    roles_clause := (
      select case
        when array_length(policy_row.roles, 1) is null then 'to public'
        else 'to ' || string_agg(quote_ident(role_name), ', ')
      end
      from unnest(policy_row.roles) as role_name
    );

    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);

    create_sql := format(
      'create policy %I on %I.%I as %s',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename,
      policy_row.permissive
    );

    if policy_row.cmd <> 'ALL' then
      create_sql := create_sql || ' for ' || lower(policy_row.cmd);
    end if;

    create_sql := create_sql || ' ' || roles_clause;

    if new_qual is not null then
      create_sql := create_sql || ' using (' || new_qual || ')';
    end if;

    if new_with_check is not null then
      create_sql := create_sql || ' with check (' || new_with_check || ')';
    end if;

    execute create_sql;
  end loop;
end $$;

commit;
