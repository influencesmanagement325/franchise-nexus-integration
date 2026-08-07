DROP POLICY IF EXISTS "Open access to franchise_audit_logs" ON public.franchise_audit_logs;

REVOKE UPDATE, DELETE, TRUNCATE ON public.franchise_audit_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON public.franchise_audit_logs TO anon, authenticated;
GRANT ALL ON public.franchise_audit_logs TO service_role;

CREATE POLICY "Audit logs are readable" ON public.franchise_audit_logs FOR SELECT USING (true);
CREATE POLICY "Audit logs are append only" ON public.franchise_audit_logs FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.fm_block_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are append-only and cannot be % ', lower(TG_OP);
END;
$$;

DROP TRIGGER IF EXISTS franchise_audit_logs_immutable ON public.franchise_audit_logs;
CREATE TRIGGER franchise_audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.franchise_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.fm_block_audit_mutation();