/*
# AssoMboa — Full Application Schema
All tables created first, then policies applied so cross-table policy references resolve.
*/

-- ============================================================
-- TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  id_document_url text,
  kyc_status text NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending','verified','rejected')),
  kyc_verified_at timestamptz,
  preferred_language text NOT NULL DEFAULT 'fr' CHECK (preferred_language IN ('fr','en')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_document_url text,
  receipt_number text,
  city text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  association_type text NOT NULL DEFAULT 'tontine' CHECK (association_type IN ('tontine','gic','ong','association')),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private')),
  contribution_frequency text NOT NULL DEFAULT 'monthly' CHECK (contribution_frequency IN ('daily','weekly','monthly','quarterly','yearly')),
  contribution_amount numeric(12,2) NOT NULL DEFAULT 0,
  cassation_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','deleted','renewed')),
  is_premium boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS join_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS join_code_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  association_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS association_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','left')),
  joined_at timestamptz,
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(association_id, user_id)
);

CREATE TABLE IF NOT EXISTS bureau_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('proprio','secretariat','commission_comptes','tresorerie')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  UNIQUE(association_id, user_id, role)
);

CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL UNIQUE REFERENCES associations(id) ON DELETE CASCADE,
  external_reference text,
  cached_balance numeric(14,2) NOT NULL DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transaction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('collection','disbursement','refund')),
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'XAF',
  description text,
  beneficiary_name text,
  beneficiary_phone text,
  related_entity_type text,
  related_entity_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','executing','completed','failed','rejected')),
  required_approvals int NOT NULL DEFAULT 2,
  notchpay_reference text,
  notchpay_response jsonb,
  executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bureau_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_request_id uuid NOT NULL REFERENCES transaction_requests(id) ON DELETE CASCADE,
  approver_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  approved boolean NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(transaction_request_id, approver_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  transaction_request_id uuid REFERENCES transaction_requests(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('collection','disbursement','refund','commission')),
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'XAF',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','cancelled')),
  external_reference text,
  notchpay_response jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS main_levees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  beneficiary_name text NOT NULL,
  beneficiary_phone text,
  title text NOT NULL,
  description text,
  target_amount numeric(12,2) NOT NULL,
  collected_amount numeric(12,2) NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'flexible' CHECK (mode IN ('flexible','tout_ou_rien')),
  commission_rate numeric(5,2) NOT NULL DEFAULT 2.00,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','succeeded','expired','refunding','refunded','cancelled')),
  deadline timestamptz NOT NULL,
  disbursed_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS main_levee_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  main_levee_id uuid NOT NULL REFERENCES main_levees(id) ON DELETE CASCADE,
  contributor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded')),
  notchpay_reference text,
  refund_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS association_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('heureux','malheureux')),
  title text NOT NULL,
  description text,
  mandatory_amount numeric(12,2) NOT NULL DEFAULT 0,
  beneficiary_name text,
  deadline timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','cancelled')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES association_events(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  notchpay_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, payer_id)
);

CREATE TABLE IF NOT EXISTS cassations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('supprimee','desactivee','renouvelee')),
  reason text,
  pdf_export_url text,
  performed_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  performed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  scheduled_at timestamptz NOT NULL,
  external_link text,
  platform text CHECK (platform IN ('meet','zoom','whatsapp','other')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL UNIQUE REFERENCES associations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  edited_at timestamptz,
  pinned boolean NOT NULL DEFAULT false,
  deleted_for_me boolean NOT NULL DEFAULT false,
  deleted_for_all boolean NOT NULL DEFAULT false,
  forwarded_from uuid REFERENCES messages(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL UNIQUE REFERENCES associations(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  consent_text text NOT NULL,
  consented boolean NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid REFERENCES associations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_code_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bureau_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bureau_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_levees ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_levee_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cassations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES
-- ============================================================
-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- associations
DROP POLICY IF EXISTS "associations_select" ON associations;
CREATE POLICY "associations_select" ON associations FOR SELECT TO authenticated USING (
  visibility = 'public' OR owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = associations.id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "associations_insert" ON associations;
CREATE POLICY "associations_insert" ON associations FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "associations_update" ON associations;
CREATE POLICY "associations_update" ON associations FOR UPDATE TO authenticated USING (
  owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = associations.id AND ba.user_id = auth.uid() AND ba.role IN ('proprio','tresorerie'))
) WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = associations.id AND ba.user_id = auth.uid() AND ba.role IN ('proprio','tresorerie'))
);
DROP POLICY IF EXISTS "associations_delete" ON associations;
CREATE POLICY "associations_delete" ON associations FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- join_codes
DROP POLICY IF EXISTS "join_codes_select" ON join_codes;
CREATE POLICY "join_codes_select" ON join_codes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = join_codes.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "join_codes_insert" ON join_codes;
CREATE POLICY "join_codes_insert" ON join_codes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = join_codes.association_id AND a.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "join_codes_update" ON join_codes;
CREATE POLICY "join_codes_update" ON join_codes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = join_codes.association_id AND a.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "join_codes_delete" ON join_codes;
CREATE POLICY "join_codes_delete" ON join_codes FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = join_codes.association_id AND a.owner_id = auth.uid())
);

-- join_code_history
DROP POLICY IF EXISTS "join_code_history_select" ON join_code_history;
CREATE POLICY "join_code_history_select" ON join_code_history FOR SELECT TO authenticated USING (auth.uid() = created_by);

-- association_members
DROP POLICY IF EXISTS "members_select" ON association_members;
CREATE POLICY "members_select" ON association_members FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM association_members am2 WHERE am2.association_id = association_members.association_id AND am2.user_id = auth.uid() AND am2.status = 'active')
);
DROP POLICY IF EXISTS "members_insert" ON association_members;
CREATE POLICY "members_insert" ON association_members FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM associations a WHERE a.id = association_members.association_id AND a.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "members_update" ON association_members;
CREATE POLICY "members_update" ON association_members FOR UPDATE TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM associations a WHERE a.id = association_members.association_id AND a.owner_id = auth.uid())
) WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM associations a WHERE a.id = association_members.association_id AND a.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "members_delete" ON association_members;
CREATE POLICY "members_delete" ON association_members FOR DELETE TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM associations a WHERE a.id = association_members.association_id AND a.owner_id = auth.uid())
);

-- bureau_assignments
DROP POLICY IF EXISTS "bureau_select" ON bureau_assignments;
CREATE POLICY "bureau_select" ON bureau_assignments FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = bureau_assignments.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "bureau_insert" ON bureau_assignments;
CREATE POLICY "bureau_insert" ON bureau_assignments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = bureau_assignments.association_id AND a.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "bureau_update" ON bureau_assignments;
CREATE POLICY "bureau_update" ON bureau_assignments FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = bureau_assignments.association_id AND a.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = bureau_assignments.association_id AND a.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "bureau_delete" ON bureau_assignments;
CREATE POLICY "bureau_delete" ON bureau_assignments FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = bureau_assignments.association_id AND a.owner_id = auth.uid())
);

-- wallets
DROP POLICY IF EXISTS "wallets_select" ON wallets;
CREATE POLICY "wallets_select" ON wallets FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = wallets.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "wallets_insert" ON wallets;
CREATE POLICY "wallets_insert" ON wallets FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = wallets.association_id AND a.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "wallets_update" ON wallets;
CREATE POLICY "wallets_update" ON wallets FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = wallets.association_id AND ba.user_id = auth.uid() AND ba.role IN ('proprio','tresorerie'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = wallets.association_id AND ba.user_id = auth.uid() AND ba.role IN ('proprio','tresorerie'))
);

-- transaction_requests
DROP POLICY IF EXISTS "tx_requests_select" ON transaction_requests;
CREATE POLICY "tx_requests_select" ON transaction_requests FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = transaction_requests.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "tx_requests_insert" ON transaction_requests;
CREATE POLICY "tx_requests_insert" ON transaction_requests FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = transaction_requests.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "tx_requests_update" ON transaction_requests;
CREATE POLICY "tx_requests_update" ON transaction_requests FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = transaction_requests.association_id AND am.user_id = auth.uid() AND am.status = 'active')
) WITH CHECK (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = transaction_requests.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);

-- bureau_approvals
DROP POLICY IF EXISTS "approvals_select" ON bureau_approvals;
CREATE POLICY "approvals_select" ON bureau_approvals FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM transaction_requests tr JOIN association_members am ON am.association_id = tr.association_id WHERE tr.id = bureau_approvals.transaction_request_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "approvals_insert" ON bureau_approvals;
CREATE POLICY "approvals_insert" ON bureau_approvals FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM transaction_requests tr JOIN bureau_assignments ba ON ba.association_id = tr.association_id WHERE tr.id = bureau_approvals.transaction_request_id AND ba.user_id = auth.uid())
);

-- transactions
DROP POLICY IF EXISTS "transactions_select" ON transactions;
CREATE POLICY "transactions_select" ON transactions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = transactions.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
CREATE POLICY "transactions_insert" ON transactions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = transactions.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);

-- main_levees
DROP POLICY IF EXISTS "main_levees_select" ON main_levees;
CREATE POLICY "main_levees_select" ON main_levees FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = main_levees.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "main_levees_insert" ON main_levees;
CREATE POLICY "main_levees_insert" ON main_levees FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = main_levees.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "main_levees_update" ON main_levees;
CREATE POLICY "main_levees_update" ON main_levees FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = main_levees.association_id AND ba.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = main_levees.association_id AND ba.user_id = auth.uid())
);

-- main_levee_contributions
DROP POLICY IF EXISTS "ml_contrib_select" ON main_levee_contributions;
CREATE POLICY "ml_contrib_select" ON main_levee_contributions FOR SELECT TO authenticated USING (
  contributor_id = auth.uid()
  OR EXISTS (SELECT 1 FROM main_levees ml JOIN association_members am ON am.association_id = ml.association_id WHERE ml.id = main_levee_contributions.main_levee_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "ml_contrib_insert" ON main_levee_contributions;
CREATE POLICY "ml_contrib_insert" ON main_levee_contributions FOR INSERT TO authenticated WITH CHECK (
  contributor_id = auth.uid()
  AND EXISTS (SELECT 1 FROM main_levees ml JOIN association_members am ON am.association_id = ml.association_id WHERE ml.id = main_levee_contributions.main_levee_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "ml_contrib_update" ON main_levee_contributions;
CREATE POLICY "ml_contrib_update" ON main_levee_contributions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM main_levees ml JOIN bureau_assignments ba ON ba.association_id = ml.association_id WHERE ml.id = main_levee_contributions.main_levee_id AND ba.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM main_levees ml JOIN bureau_assignments ba ON ba.association_id = ml.association_id WHERE ml.id = main_levee_contributions.main_levee_id AND ba.user_id = auth.uid())
);

-- association_events
DROP POLICY IF EXISTS "events_select" ON association_events;
CREATE POLICY "events_select" ON association_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = association_events.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "events_insert" ON association_events;
CREATE POLICY "events_insert" ON association_events FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = association_events.association_id AND ba.user_id = auth.uid() AND ba.role = 'proprio')
);
DROP POLICY IF EXISTS "events_update" ON association_events;
CREATE POLICY "events_update" ON association_events FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = association_events.association_id AND ba.user_id = auth.uid() AND ba.role = 'proprio')
);

-- event_payments
DROP POLICY IF EXISTS "event_payments_select" ON event_payments;
CREATE POLICY "event_payments_select" ON event_payments FOR SELECT TO authenticated USING (
  payer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM association_events ae JOIN association_members am ON am.association_id = ae.association_id WHERE ae.id = event_payments.event_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "event_payments_insert" ON event_payments;
CREATE POLICY "event_payments_insert" ON event_payments FOR INSERT TO authenticated WITH CHECK (
  payer_id = auth.uid()
  AND EXISTS (SELECT 1 FROM association_events ae JOIN association_members am ON am.association_id = ae.association_id WHERE ae.id = event_payments.event_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "event_payments_update" ON event_payments;
CREATE POLICY "event_payments_update" ON event_payments FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM association_events ae JOIN bureau_assignments ba ON ba.association_id = ae.association_id WHERE ae.id = event_payments.event_id AND ba.user_id = auth.uid())
);

-- cassations
DROP POLICY IF EXISTS "cassations_select" ON cassations;
CREATE POLICY "cassations_select" ON cassations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = cassations.association_id AND a.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "cassations_insert" ON cassations;
CREATE POLICY "cassations_insert" ON cassations FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = cassations.association_id AND a.owner_id = auth.uid())
);

-- meetings
DROP POLICY IF EXISTS "meetings_select" ON meetings;
CREATE POLICY "meetings_select" ON meetings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = meetings.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "meetings_insert" ON meetings;
CREATE POLICY "meetings_insert" ON meetings FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = meetings.association_id AND ba.user_id = auth.uid())
);
DROP POLICY IF EXISTS "meetings_update" ON meetings;
CREATE POLICY "meetings_update" ON meetings FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = meetings.association_id AND ba.user_id = auth.uid())
);
DROP POLICY IF EXISTS "meetings_delete" ON meetings;
CREATE POLICY "meetings_delete" ON meetings FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = meetings.association_id AND ba.user_id = auth.uid())
);

-- conversations
DROP POLICY IF EXISTS "conversations_select" ON conversations;
CREATE POLICY "conversations_select" ON conversations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = conversations.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);

-- messages
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated USING (
  sender_id = auth.uid()
  OR (NOT deleted_for_all AND EXISTS (SELECT 1 FROM conversations c JOIN association_members am ON am.association_id = c.association_id WHERE c.id = messages.conversation_id AND am.user_id = auth.uid() AND am.status = 'active'))
);
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (SELECT 1 FROM conversations c JOIN association_members am ON am.association_id = c.association_id WHERE c.id = messages.conversation_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "messages_delete" ON messages;
CREATE POLICY "messages_delete" ON messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- subscriptions
DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = subscriptions.association_id AND am.user_id = auth.uid() AND am.status = 'active')
);
DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = subscriptions.association_id AND a.owner_id = auth.uid())
);

-- consent_records
DROP POLICY IF EXISTS "consent_select_own" ON consent_records;
CREATE POLICY "consent_select_own" ON consent_records FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "consent_insert_own" ON consent_records;
CREATE POLICY "consent_insert_own" ON consent_records FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- audit_logs
DROP POLICY IF EXISTS "audit_select" ON audit_logs;
CREATE POLICY "audit_select" ON audit_logs FOR SELECT TO authenticated USING (
  actor_id = auth.uid()
  OR (association_id IS NOT NULL AND EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = audit_logs.association_id AND ba.user_id = auth.uid()))
);
DROP POLICY IF EXISTS "audit_insert" ON audit_logs;
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_associations_owner ON associations(owner_id);
CREATE INDEX IF NOT EXISTS idx_members_assoc_user ON association_members(association_id, user_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON association_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bureau_assoc ON bureau_assignments(association_id);
CREATE INDEX IF NOT EXISTS idx_join_codes_code ON join_codes(code);
CREATE INDEX IF NOT EXISTS idx_tx_requests_assoc ON transaction_requests(association_id);
CREATE INDEX IF NOT EXISTS idx_tx_requests_status ON transaction_requests(status);
CREATE INDEX IF NOT EXISTS idx_approvals_request ON bureau_approvals(transaction_request_id);
CREATE INDEX IF NOT EXISTS idx_transactions_assoc ON transactions(association_id);
CREATE INDEX IF NOT EXISTS idx_main_levees_assoc ON main_levees(association_id);
CREATE INDEX IF NOT EXISTS idx_main_levees_status ON main_levees(status);
CREATE INDEX IF NOT EXISTS idx_ml_contrib_levee ON main_levee_contributions(main_levee_id);
CREATE INDEX IF NOT EXISTS idx_events_assoc ON association_events(association_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_event ON event_payments(event_id);
CREATE INDEX IF NOT EXISTS idx_meetings_assoc ON meetings(association_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_audit_assoc ON audit_logs(association_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $_$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$_$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_associations_updated ON associations;
CREATE TRIGGER trg_associations_updated BEFORE UPDATE ON associations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_wallets_updated ON wallets;
CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_tx_requests_updated ON transaction_requests;
CREATE TRIGGER trg_tx_requests_updated BEFORE UPDATE ON transaction_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_main_levees_updated ON main_levees;
CREATE TRIGGER trg_main_levees_updated BEFORE UPDATE ON main_levees FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $_$
BEGIN
  INSERT INTO profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  RETURN NEW;
END;
$_$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();