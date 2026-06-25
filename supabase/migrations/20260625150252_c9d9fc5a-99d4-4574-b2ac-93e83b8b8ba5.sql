
REVOKE EXECUTE ON FUNCTION public.grant_palpite_credit(uuid, integer, text, uuid, text) FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.grant_palpite_credit(uuid, integer, text, uuid, text) TO service_role;
