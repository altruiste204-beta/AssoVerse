/*
# Fix security issues:
# 1. Both functions get a fixed search_path to prevent search_path injection
# 2. handle_new_user: REVOKE EXECUTE from PUBLIC/anon/authenticated so it can't
#    be called as a SECURITY DEFINER RPC endpoint. It's a trigger function that
#    only needs to run internally when auth.users INSERT fires.
*/

-- 1. update_updated_at: add fixed search_path (not SECURITY DEFINER, just needs search_path lock)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. handle_new_user: add fixed search_path + keep SECURITY DEFINER (needs to insert into profiles on behalf of auth trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  RETURN NEW;
END;
$function$;

-- Revoke EXECUTE from PUBLIC, anon, and authenticated so the function
-- cannot be called directly via the Data API (/rest/v1/rpc/handle_new_user).
-- It remains usable as a trigger on auth.users.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
