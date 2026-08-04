CREATE TABLE public.territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  region text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  population integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  exclusivity text NOT NULL DEFAULT 'exclusive',
  lat numeric NOT NULL DEFAULT 0,
  lng numeric NOT NULL DEFAULT 0,
  potential_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.franchises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  owner_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  territory_id uuid REFERENCES public.territories(id) ON DELETE SET NULL,
  territory text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  commission_rate numeric NOT NULL DEFAULT 10,
  royalty_rate numeric NOT NULL DEFAULT 8,
  pricing_variation numeric NOT NULL DEFAULT 0,
  total_sales numeric NOT NULL DEFAULT 0,
  performance_score integer NOT NULL DEFAULT 0,
  health text NOT NULL DEFAULT 'stable',
  lead_routing boolean NOT NULL DEFAULT false,
  joined_date date NOT NULL DEFAULT current_date,
  last_active date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.franchise_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  business_name text NOT NULL,
  owner_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  requested_territory text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  experience text NOT NULL DEFAULT '',
  business_type text NOT NULL DEFAULT '',
  investment_capacity text NOT NULL DEFAULT '',
  kyc_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'in_review',
  review_notes text,
  applied_at date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.franchise_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  period text NOT NULL,
  revenue numeric NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  tickets integer NOT NULL DEFAULT 0,
  csat numeric NOT NULL DEFAULT 0,
  sla_percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.franchise_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  requirement text NOT NULL,
  category text NOT NULL DEFAULT 'legal',
  status text NOT NULL DEFAULT 'pending',
  severity text NOT NULL DEFAULT 'medium',
  due_date date,
  last_checked date NOT NULL DEFAULT current_date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.franchise_fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  risk_score integer NOT NULL DEFAULT 0,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  detected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.franchise_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'support',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  raised_by text NOT NULL DEFAULT '',
  assigned_to text NOT NULL DEFAULT '',
  sla_due timestamptz,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.franchise_royalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  period text NOT NULL,
  gross_sales numeric NOT NULL DEFAULT 0,
  royalty_rate numeric NOT NULL DEFAULT 0,
  royalty_due numeric NOT NULL DEFAULT 0,
  commission_due numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'due',
  due_date date,
  paid_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.franchise_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  contract_no text NOT NULL UNIQUE,
  contract_type text NOT NULL DEFAULT 'master_franchise',
  start_date date NOT NULL,
  end_date date NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  renewal_status text NOT NULL DEFAULT 'not_due',
  signed_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.franchise_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.franchise_applications(id) ON DELETE CASCADE,
  name text NOT NULL,
  doc_type text NOT NULL DEFAULT 'kyc',
  status text NOT NULL DEFAULT 'pending',
  file_url text,
  uploaded_at date NOT NULL DEFAULT current_date,
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.franchise_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.franchise_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL DEFAULT 'franchise_manager',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.franchise_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.fm_touch_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['territories','franchises','franchise_applications','franchise_compliance','franchise_fraud_alerts','franchise_escalations','franchise_royalties','franchise_contracts','franchise_documents','franchise_settings']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fm_touch_updated_at()', t, t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Open access to %I" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY['franchise_performance','franchise_notifications','franchise_audit_logs']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Open access to %I" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

INSERT INTO public.territories (code, name, region, state, city, population, status, exclusivity, lat, lng, potential_score) VALUES
('TR-MH-W','Maharashtra - West','West','Maharashtra','Mumbai',20400000,'assigned','exclusive',19.0760,72.8777,94),
('TR-DL-NCR','Delhi NCR','North','Delhi','New Delhi',32900000,'assigned','exclusive',28.6139,77.2090,96),
('TR-KA-S','Karnataka - South','South','Karnataka','Bangalore',13600000,'reserved','exclusive',12.9716,77.5946,91),
('TR-TN-E','Tamil Nadu - East','South','Tamil Nadu','Chennai',11500000,'assigned','exclusive',13.0827,80.2707,84),
('TR-TS-C','Telangana - Central','South','Telangana','Hyderabad',10500000,'assigned','exclusive',17.3850,78.4867,88),
('TR-MH-P','Maharashtra - Pune','West','Maharashtra','Pune',7400000,'disputed','exclusive',18.5204,73.8567,81),
('TR-GJ-A','Gujarat - Ahmedabad','West','Gujarat','Ahmedabad',8400000,'available','exclusive',23.0225,72.5714,79),
('TR-WB-K','West Bengal - Kolkata','East','West Bengal','Kolkata',14900000,'available','exclusive',22.5726,88.3639,77),
('TR-RJ-J','Rajasthan - Jaipur','North','Rajasthan','Jaipur',4000000,'available','non_exclusive',26.9124,75.7873,68),
('TR-KL-C','Kerala - Kochi','South','Kerala','Kochi',2100000,'available','non_exclusive',9.9312,76.2673,64);

INSERT INTO public.franchises (code, name, owner_name, email, phone, status, territory_id, territory, state, city, commission_rate, royalty_rate, pricing_variation, total_sales, performance_score, health, lead_routing, joined_date, last_active) VALUES
('FR-001','Tech Solutions Mumbai','Rajesh Sharma','rajesh@techsolutionsmumbai.in','+91 98765 43210','active',(SELECT id FROM public.territories WHERE code='TR-MH-W'),'Maharashtra - West','Maharashtra','Mumbai',15,8,5,24500000,92,'excellent',true,'2024-01-15','2026-08-03'),
('FR-002','Digital Hub Delhi','Priya Kapoor','priya@digitalhubdelhi.in','+91 98765 43211','active',(SELECT id FROM public.territories WHERE code='TR-DL-NCR'),'Delhi NCR','Delhi','New Delhi',18,9,0,32000000,88,'excellent',true,'2023-11-20','2026-08-04'),
('FR-003','Software Point Bangalore','Arun Kumar','arun@softwarepointblr.in','+91 98765 43212','pending',(SELECT id FROM public.territories WHERE code='TR-KA-S'),'Karnataka - South','Karnataka','Bangalore',12,7,3,0,0,'stable',false,'2026-06-10','2026-07-28'),
('FR-004','IT Masters Chennai','Lakshmi Narayanan','lakshmi@itmasterschennai.in','+91 98765 43213','suspended',(SELECT id FROM public.territories WHERE code='TR-TN-E'),'Tamil Nadu - East','Tamil Nadu','Chennai',14,8,2,8900000,46,'at_risk',false,'2024-06-05','2026-05-20'),
('FR-005','Code Factory Hyderabad','Venkat Reddy','venkat@codefactoryhyd.in','+91 98765 43214','active',(SELECT id FROM public.territories WHERE code='TR-TS-C'),'Telangana - Central','Telangana','Hyderabad',16,8,4,17500000,79,'good',true,'2024-03-22','2026-08-02'),
('FR-006','Tech Nexus Pune','Suresh Patil','suresh@technexuspune.in','+91 98765 43215','terminated',(SELECT id FROM public.territories WHERE code='TR-MH-P'),'Maharashtra - Pune','Maharashtra','Pune',10,6,0,3200000,28,'critical',false,'2023-08-15','2025-12-01');

INSERT INTO public.franchise_applications (code, business_name, owner_name, email, phone, requested_territory, city, state, experience, business_type, investment_capacity, kyc_status, status, applied_at) VALUES
('FA-001','TechVentures Ahmedabad','Nirav Mehta','nirav@techventures.in','+91 99201 44512','Gujarat - Ahmedabad','Ahmedabad','Gujarat','5+ years in tech distribution','Technology Distribution','Rs 50L - Rs 1Cr','verified','in_review','2026-07-15'),
('FA-002','Digital Solutions Kolkata','Ananya Bose','ananya@digitalsolutions.in','+91 98304 11223','West Bengal - Kolkata','Kolkata','West Bengal','3 years in SaaS sales','SaaS Reselling','Rs 25L - Rs 50L','pending','in_review','2026-07-19'),
('FA-003','Pink City Softwares','Mohit Agarwal','mohit@pinkcitysoft.in','+91 94140 55678','Rajasthan - Jaipur','Jaipur','Rajasthan','8 years running an IT services firm','IT Services','Rs 1Cr+','verified','in_review','2026-07-24'),
('FA-004','Backwater Tech Kochi','Fathima Rasheed','fathima@backwatertech.in','+91 95627 88190','Kerala - Kochi','Kochi','Kerala','2 years as a channel partner','Channel Partner','Rs 10L - Rs 25L','rejected','rejected','2026-06-30');

INSERT INTO public.franchise_performance (franchise_id, period, revenue, leads, conversions, tickets, csat, sla_percent)
SELECT f.id, p.period, p.revenue, p.leads, p.conversions, p.tickets, p.csat, p.sla
FROM public.franchises f
JOIN (VALUES
 ('FR-001','2026-03',3600000,420,168,22,4.6,96.4),('FR-001','2026-04',3950000,455,190,19,4.7,97.1),('FR-001','2026-05',4180000,478,201,25,4.5,95.2),('FR-001','2026-06',4420000,502,214,18,4.8,98.0),('FR-001','2026-07',4610000,517,228,21,4.7,97.5),
 ('FR-002','2026-03',4800000,560,240,31,4.4,93.8),('FR-002','2026-04',5100000,588,254,28,4.5,94.6),('FR-002','2026-05',5350000,601,268,26,4.6,95.4),('FR-002','2026-06',5620000,634,281,30,4.5,94.1),('FR-002','2026-07',5880000,660,296,24,4.7,96.2),
 ('FR-004','2026-03',1400000,180,42,48,3.4,72.5),('FR-004','2026-04',1250000,164,36,55,3.1,68.2),('FR-004','2026-05',980000,142,27,61,2.9,61.4),('FR-004','2026-06',760000,118,19,66,2.7,55.8),('FR-004','2026-07',540000,96,12,71,2.5,49.3),
 ('FR-005','2026-03',2700000,310,124,27,4.2,90.1),('FR-005','2026-04',2880000,326,133,24,4.3,91.4),('FR-005','2026-05',3050000,341,141,22,4.4,92.8),('FR-005','2026-06',3190000,358,149,20,4.4,93.6),('FR-005','2026-07',3340000,372,158,18,4.5,94.5)
) AS p(code, period, revenue, leads, conversions, tickets, csat, sla) ON p.code = f.code;

INSERT INTO public.franchise_compliance (franchise_id, requirement, category, status, severity, due_date, notes)
SELECT f.id, c.requirement, c.category, c.status, c.severity, c.due_date::date, c.notes
FROM public.franchises f
JOIN (VALUES
 ('FR-001','GST registration certificate','legal','compliant','high','2027-03-31','Verified against GSTN portal'),
 ('FR-001','Brand usage guideline audit','brand','compliant','medium','2026-12-31','Q2 audit passed with 98% score'),
 ('FR-001','Data protection training','operations','pending','medium','2026-09-15','2 of 14 staff pending'),
 ('FR-002','GST registration certificate','legal','compliant','high','2027-01-31','Valid'),
 ('FR-002','Annual financial statement','finance','pending','high','2026-09-30','FY26 statement awaited'),
 ('FR-004','GST registration certificate','legal','breach','critical','2026-05-31','Lapsed 66 days - operations suspended'),
 ('FR-004','Minimum staffing commitment','operations','breach','high','2026-06-30','4 of 10 mandated seats filled'),
 ('FR-004','Customer SLA adherence','operations','breach','critical','2026-07-31','49.3% against 90% contractual floor'),
 ('FR-005','Brand usage guideline audit','brand','compliant','medium','2026-11-30','Passed'),
 ('FR-005','Local advertising spend proof','marketing','pending','low','2026-08-31','Invoices for July pending'),
 ('FR-006','Exit settlement documentation','legal','breach','high','2026-01-31','Termination dues unsettled')
) AS c(code, requirement, category, status, severity, due_date, notes) ON c.code = f.code;

INSERT INTO public.franchise_fraud_alerts (franchise_id, alert_type, severity, risk_score, description, status, detected_at)
SELECT f.id, a.alert_type, a.severity, a.risk_score, a.description, a.status, a.detected_at::timestamptz
FROM public.franchises f
JOIN (VALUES
 ('FR-004','Revenue under-reporting','critical',92,'Declared sales are 38% below payment-gateway settlements for 3 consecutive months.','open','2026-07-28 09:15+00'),
 ('FR-004','Territory boundary violation','high',77,'14 deals closed with billing addresses inside the Telangana - Central territory.','investigating','2026-07-21 14:40+00'),
 ('FR-006','Duplicate customer records','medium',58,'62 customer records match an existing franchise ledger by PAN and phone.','resolved','2026-04-11 07:05+00'),
 ('FR-005','Unusual discount pattern','medium',54,'Discounts above the 12% approved ceiling on 9 enterprise invoices.','investigating','2026-07-30 11:22+00'),
 ('FR-002','Lead recycling','low',31,'118 leads re-submitted within 30 days of a closed-lost outcome.','open','2026-08-01 06:48+00')
) AS a(code, alert_type, severity, risk_score, description, status, detected_at) ON a.code = f.code;

INSERT INTO public.franchise_escalations (franchise_id, title, category, priority, status, raised_by, assigned_to, sla_due)
SELECT f.id, e.title, e.category, e.priority, e.status, e.raised_by, e.assigned_to, e.sla_due::timestamptz
FROM public.franchises f
JOIN (VALUES
 ('FR-004','Repeated SLA breaches on enterprise support','support','critical','open','Regional Ops','Franchise Manager','2026-08-06 12:00+00'),
 ('FR-004','GST lapse blocking new invoicing','legal','critical','in_progress','Compliance Desk','Legal Team','2026-08-05 18:00+00'),
 ('FR-001','Territory overlap query with Pune unit','territory','medium','in_progress','Rajesh Sharma','Franchise Manager','2026-08-09 12:00+00'),
 ('FR-005','Royalty invoice dispute for June','finance','high','open','Venkat Reddy','Finance Ops','2026-08-07 12:00+00'),
 ('FR-002','Request for additional demo licences','operations','low','resolved','Priya Kapoor','Franchise Manager','2026-07-30 12:00+00')
) AS e(code, title, category, priority, status, raised_by, assigned_to, sla_due) ON e.code = f.code;

INSERT INTO public.franchise_royalties (franchise_id, period, gross_sales, royalty_rate, royalty_due, commission_due, paid_amount, status, due_date, paid_at)
SELECT f.id, r.period, r.gross, r.rate, r.royalty, r.commission, r.paid, r.status, r.due::date, r.paid_at::date
FROM public.franchises f
JOIN (VALUES
 ('FR-001','2026-06',4420000,8,353600,663000,353600,'paid','2026-07-10','2026-07-08'),
 ('FR-001','2026-07',4610000,8,368800,691500,0,'due','2026-08-10',NULL),
 ('FR-002','2026-06',5620000,9,505800,1011600,505800,'paid','2026-07-10','2026-07-09'),
 ('FR-002','2026-07',5880000,9,529200,1058400,0,'due','2026-08-10',NULL),
 ('FR-004','2026-06',760000,8,60800,106400,0,'overdue','2026-07-10',NULL),
 ('FR-004','2026-07',540000,8,43200,75600,0,'overdue','2026-08-10',NULL),
 ('FR-005','2026-06',3190000,8,255200,510400,255200,'paid','2026-07-10','2026-07-11'),
 ('FR-005','2026-07',3340000,8,267200,534400,120000,'partial','2026-08-10',NULL)
) AS r(code, period, gross, rate, royalty, commission, paid, status, due, paid_at) ON r.code = f.code;

INSERT INTO public.franchise_contracts (franchise_id, contract_no, contract_type, start_date, end_date, value, status, renewal_status, signed_at)
SELECT f.id, c.no, c.ctype, c.sdate::date, c.edate::date, c.value, c.status, c.renewal, c.signed::date
FROM public.franchises f
JOIN (VALUES
 ('FR-001','CT-2024-001','master_franchise','2024-01-15','2027-01-14',7500000,'active','not_due','2024-01-12'),
 ('FR-002','CT-2023-014','master_franchise','2023-11-20','2026-11-19',9000000,'active','due_soon','2023-11-16'),
 ('FR-003','CT-2026-031','unit_franchise','2026-07-01','2029-06-30',4500000,'draft','not_due',NULL),
 ('FR-004','CT-2024-022','unit_franchise','2024-06-05','2027-06-04',5200000,'suspended','under_review','2024-06-02'),
 ('FR-005','CT-2024-009','master_franchise','2024-03-22','2027-03-21',6800000,'active','not_due','2024-03-19'),
 ('FR-006','CT-2023-006','unit_franchise','2023-08-15','2026-08-14',3000000,'terminated','terminated','2023-08-11')
) AS c(code, no, ctype, sdate, edate, value, status, renewal, signed) ON c.code = f.code;

INSERT INTO public.franchise_documents (franchise_id, name, doc_type, status, uploaded_at, expires_at)
SELECT f.id, d.name, d.dtype, d.status, d.uploaded::date, d.expires::date
FROM public.franchises f
JOIN (VALUES
 ('FR-001','GST Certificate.pdf','kyc','verified','2024-01-10','2027-03-31'),
 ('FR-001','Signed Franchise Agreement.pdf','contract','verified','2024-01-12',NULL),
 ('FR-001','Q2 Brand Audit Report.pdf','audit','verified','2026-07-05',NULL),
 ('FR-002','PAN Card.pdf','kyc','verified','2023-11-15',NULL),
 ('FR-002','FY26 Financial Statement.pdf','finance','pending','2026-07-28','2026-09-30'),
 ('FR-004','GST Certificate.pdf','kyc','expired','2024-06-01','2026-05-31'),
 ('FR-004','Suspension Notice.pdf','legal','verified','2026-06-02',NULL),
 ('FR-005','Shop Establishment Licence.pdf','kyc','verified','2024-03-18','2027-03-17')
) AS d(code, name, dtype, status, uploaded, expires) ON d.code = f.code;

INSERT INTO public.franchise_notifications (franchise_id, title, message, type, read)
SELECT f.id, n.title, n.message, n.ntype, n.read
FROM public.franchises f
JOIN (VALUES
 ('FR-004','Compliance breach escalated','GST certificate lapsed 66 days ago. Invoicing is blocked until renewal is filed.','critical',false),
 ('FR-004','Fraud alert raised','Revenue under-reporting detected with a 92 risk score.','critical',false),
 ('FR-002','Contract renewal due soon','CT-2023-014 expires on 19 Nov 2026. Start renewal review.','warning',false),
 ('FR-005','Royalty partially paid','Rs 1,20,000 of Rs 2,67,200 received for July 2026.','warning',true),
 ('FR-001','Monthly target achieved','July revenue closed at Rs 46.1L, 108% of target.','success',true)
) AS n(code, title, message, ntype, read) ON n.code = f.code;

INSERT INTO public.franchise_audit_logs (actor, action, entity_type, entity_id, details) VALUES
('franchise_manager','application_reviewed','franchise_application','FA-004','Application rejected - investment capacity below territory floor'),
('franchise_manager','franchise_suspended','franchise','FR-004','Suspended for GST lapse and SLA breach'),
('compliance_desk','compliance_flagged','franchise','FR-004','Customer SLA adherence recorded at 49.3%'),
('franchise_manager','territory_reserved','territory','TR-KA-S','Reserved pending FR-003 onboarding'),
('finance_ops','royalty_recorded','franchise_royalty','FR-005/2026-07','Partial payment of Rs 1,20,000 recorded'),
('franchise_manager','contract_flagged','franchise_contract','CT-2023-014','Renewal window opened');

INSERT INTO public.franchise_settings (key, label, description, value) VALUES
('territory_exclusivity','One territory = one franchise','Blocks assigning a territory that already has an active franchise.','{"enabled": true}'),
('auto_approval','Auto / bulk approval','Automatic approval of franchise applications is permanently blocked.','{"enabled": false, "locked": true}'),
('kyc_required','KYC before approval','Applications cannot be approved until KYC is verified.','{"enabled": true}'),
('royalty_grace_days','Royalty grace period','Days after the due date before a royalty is marked overdue.','{"days": 7}'),
('sla_floor','Contractual SLA floor','Minimum support SLA percentage every franchise must maintain.','{"percent": 90}'),
('audit_logging','Audit every action','All Franchise Manager actions are written to the audit log.','{"enabled": true, "locked": true}');