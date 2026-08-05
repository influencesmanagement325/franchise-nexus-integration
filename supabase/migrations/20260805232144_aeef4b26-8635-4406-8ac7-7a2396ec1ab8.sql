ALTER TABLE public.franchises
  ADD COLUMN IF NOT EXISTS lead_quality integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sla_adherence numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complaint_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_resellers integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

ALTER TABLE public.territories
  ADD COLUMN IF NOT EXISTS business_density text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS overlapping_with text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.franchise_applications
  ADD COLUMN IF NOT EXISTS clarification_message text;

ALTER TABLE public.franchise_fraud_alerts
  ADD COLUMN IF NOT EXISTS patterns text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recommendation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS review_notes text;

ALTER TABLE public.franchise_audit_logs
  ADD COLUMN IF NOT EXISTS old_value text,
  ADD COLUMN IF NOT EXISTS new_value text,
  ADD COLUMN IF NOT EXISTS result text NOT NULL DEFAULT 'success';

CREATE UNIQUE INDEX IF NOT EXISTS franchise_applications_code_unique ON public.franchise_applications (code);
CREATE UNIQUE INDEX IF NOT EXISTS franchises_code_unique ON public.franchises (code);
CREATE UNIQUE INDEX IF NOT EXISTS territories_code_unique ON public.territories (code);
CREATE UNIQUE INDEX IF NOT EXISTS franchise_contracts_contract_no_unique ON public.franchise_contracts (contract_no);
CREATE UNIQUE INDEX IF NOT EXISTS franchises_one_per_territory_unique ON public.franchises (territory_id) WHERE territory_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.fm_approve_application(_application_id uuid, _review_notes text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  app public.franchise_applications%ROWTYPE;
  territory_row public.territories%ROWTYPE;
  created_franchise_id uuid;
BEGIN
  SELECT * INTO app
  FROM public.franchise_applications
  WHERE id = _application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  IF app.status <> 'in_review' THEN
    RAISE EXCEPTION 'Application has already been decided';
  END IF;
  IF app.kyc_status <> 'verified' THEN
    RAISE EXCEPTION 'KYC must be verified before approval';
  END IF;

  SELECT * INTO territory_row
  FROM public.territories
  WHERE name = app.requested_territory
  FOR UPDATE;

  IF FOUND AND territory_row.status <> 'available' THEN
    RAISE EXCEPTION '% is already assigned or unavailable', territory_row.name;
  END IF;

  INSERT INTO public.franchises (
    code, name, owner_name, email, phone, status, territory_id, territory,
    state, city, commission_rate, royalty_rate, pricing_variation, total_sales,
    performance_score, health, lead_routing, joined_date
  ) VALUES (
    replace(app.code, 'APP', 'FR'), app.business_name, app.owner_name, app.email,
    app.phone, 'active', territory_row.id, app.requested_territory, app.state,
    app.city, 10, 8, 0, 0, 60, 'stable', true, CURRENT_DATE
  ) RETURNING id INTO created_franchise_id;

  UPDATE public.franchise_applications
  SET status = 'approved', review_notes = COALESCE(_review_notes, review_notes)
  WHERE id = app.id;

  IF territory_row.id IS NOT NULL THEN
    UPDATE public.territories SET status = 'assigned' WHERE id = territory_row.id;
  END IF;

  INSERT INTO public.franchise_audit_logs
    (actor, action, entity_type, entity_id, details, old_value, new_value, result)
  VALUES
    ('Franchise Manager', 'application_approved', 'franchise_application', app.code,
     app.business_name || ' approved and franchise created', 'in_review', 'approved', 'success');

  RETURN created_franchise_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fm_approve_application(uuid, text) TO anon, authenticated, service_role;