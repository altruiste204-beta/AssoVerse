-- Security and performance fixes patch

-- ============================================================
-- 1. READ-ONLY FOR AUTHENTICATED (NON-CUSTODIAL RLS)
-- ============================================================

-- Table wallets
DROP POLICY IF EXISTS "wallets_select" ON wallets;
DROP POLICY IF EXISTS "wallets_insert" ON wallets;
DROP POLICY IF EXISTS "wallets_update" ON wallets;
DROP POLICY IF EXISTS "wallets_delete" ON wallets;

CREATE POLICY "wallets_select" ON wallets FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = wallets.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);

-- Table transactions
DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_update" ON transactions;
DROP POLICY IF EXISTS "transactions_delete" ON transactions;

CREATE POLICY "transactions_select" ON transactions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = transactions.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);

-- Table main_levee_contributions
DROP POLICY IF EXISTS "ml_contrib_select" ON main_levee_contributions;
DROP POLICY IF EXISTS "ml_contrib_insert" ON main_levee_contributions;
DROP POLICY IF EXISTS "ml_contrib_update" ON main_levee_contributions;
DROP POLICY IF EXISTS "ml_contrib_delete" ON main_levee_contributions;

CREATE POLICY "ml_contrib_select" ON main_levee_contributions FOR SELECT TO authenticated USING (
  contributor_id = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM main_levees ml JOIN association_members am ON am.association_id = ml.association_id WHERE ml.id = main_levee_contributions.main_levee_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);

-- Table event_payments
DROP POLICY IF EXISTS "event_payments_select" ON event_payments;
DROP POLICY IF EXISTS "event_payments_insert" ON event_payments;
DROP POLICY IF EXISTS "event_payments_update" ON event_payments;
DROP POLICY IF EXISTS "event_payments_delete" ON event_payments;

CREATE POLICY "event_payments_select" ON event_payments FOR SELECT TO authenticated USING (
  payer_id = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM association_events ae JOIN association_members am ON am.association_id = ae.association_id WHERE ae.id = event_payments.event_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);

-- Table audit_logs
DROP POLICY IF EXISTS "audit_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_insert" ON audit_logs;
DROP POLICY IF EXISTS "audit_update" ON audit_logs;
DROP POLICY IF EXISTS "audit_delete" ON audit_logs;

CREATE POLICY "audit_select" ON audit_logs FOR SELECT TO authenticated USING (
  actor_id = (SELECT auth.uid())
  OR (association_id IS NOT NULL AND EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = audit_logs.association_id AND ba.user_id = (SELECT auth.uid())))
);


-- ============================================================
-- 2. ANTI AUTO-APPROBATION & TRANSACTION REQUEST POLICIES
-- ============================================================

-- Table bureau_approvals: no auto-approving own requests
DROP POLICY IF EXISTS "approvals_insert" ON bureau_approvals;
CREATE POLICY "approvals_insert" ON bureau_approvals FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM transaction_requests tr 
    JOIN bureau_assignments ba ON ba.association_id = tr.association_id 
    WHERE tr.id = bureau_approvals.transaction_request_id 
      AND ba.user_id = (SELECT auth.uid())
      AND tr.requested_by != (SELECT auth.uid())
  )
);

-- Table transaction_requests: collection = active member, disbursement/refund = bureau only
DROP POLICY IF EXISTS "tx_requests_insert" ON transaction_requests;
CREATE POLICY "tx_requests_insert" ON transaction_requests FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM association_members am 
    WHERE am.association_id = transaction_requests.association_id 
      AND am.user_id = (SELECT auth.uid()) 
      AND am.status = 'active'
  )
  AND (
    type = 'collection'
    OR EXISTS (
      SELECT 1 FROM bureau_assignments ba 
      WHERE ba.association_id = transaction_requests.association_id 
        AND ba.user_id = (SELECT auth.uid())
    )
  )
);

-- Table association_members: user can only pass themselves to 'left' status
DROP POLICY IF EXISTS "members_update" ON association_members;
CREATE POLICY "members_update" ON association_members FOR UPDATE TO authenticated USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM associations a WHERE a.id = association_members.association_id AND a.owner_id = (SELECT auth.uid()))
) WITH CHECK (
  (
    user_id = (SELECT auth.uid()) 
    AND status = 'left'
  )
  OR EXISTS (SELECT 1 FROM associations a WHERE a.id = association_members.association_id AND a.owner_id = (SELECT auth.uid()))
);


-- ============================================================
-- 3. FIX JOIN CODES SELECT POLICY
-- ============================================================

-- Table join_codes: owner or active member can read
DROP POLICY IF EXISTS "join_codes_select" ON join_codes;
CREATE POLICY "join_codes_select" ON join_codes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = join_codes.association_id AND a.owner_id = (SELECT auth.uid()))
  OR EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = join_codes.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);


-- ============================================================
-- 4. PERFORMANCE SUBQUERIES (auth.uid() -> (SELECT auth.uid()))
-- ============================================================

-- Table associations
DROP POLICY IF EXISTS "associations_select" ON associations;
DROP POLICY IF EXISTS "associations_insert" ON associations;
DROP POLICY IF EXISTS "associations_update" ON associations;
DROP POLICY IF EXISTS "associations_delete" ON associations;

CREATE POLICY "associations_select" ON associations FOR SELECT TO authenticated USING (
  owner_id = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);
CREATE POLICY "associations_insert" ON associations FOR INSERT TO authenticated WITH CHECK (
  owner_id = (SELECT auth.uid())
);
CREATE POLICY "associations_update" ON associations FOR UPDATE TO authenticated USING (
  owner_id = (SELECT auth.uid())
);
CREATE POLICY "associations_delete" ON associations FOR DELETE TO authenticated USING (
  owner_id = (SELECT auth.uid())
);

-- Table association_members (remaining policies)
DROP POLICY IF EXISTS "members_select" ON association_members;
DROP POLICY IF EXISTS "members_insert" ON association_members;
DROP POLICY IF EXISTS "members_delete" ON association_members;

CREATE POLICY "members_select" ON association_members FOR SELECT TO authenticated USING (
  user_id = (SELECT auth.uid())
  OR check_is_association_member(association_id, (SELECT auth.uid()))
);
CREATE POLICY "members_insert" ON association_members FOR INSERT TO authenticated WITH CHECK (
  user_id = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM associations a WHERE a.id = association_members.association_id AND a.owner_id = (SELECT auth.uid()))
);
CREATE POLICY "members_delete" ON association_members FOR DELETE TO authenticated USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM associations a WHERE a.id = association_members.association_id AND a.owner_id = (SELECT auth.uid()))
);

-- Table bureau_assignments
DROP POLICY IF EXISTS "bureau_select" ON bureau_assignments;
DROP POLICY IF EXISTS "bureau_insert" ON bureau_assignments;
DROP POLICY IF EXISTS "bureau_update" ON bureau_assignments;
DROP POLICY IF EXISTS "bureau_delete" ON bureau_assignments;

CREATE POLICY "bureau_select" ON bureau_assignments FOR SELECT TO authenticated USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = bureau_assignments.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);
CREATE POLICY "bureau_insert" ON bureau_assignments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = bureau_assignments.association_id AND a.owner_id = (SELECT auth.uid()))
);
CREATE POLICY "bureau_update" ON bureau_assignments FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = bureau_assignments.association_id AND a.owner_id = (SELECT auth.uid()))
);
CREATE POLICY "bureau_delete" ON bureau_assignments FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = bureau_assignments.association_id AND a.owner_id = (SELECT auth.uid()))
);

-- Table join_codes (remaining policies)
DROP POLICY IF EXISTS "join_codes_insert" ON join_codes;
DROP POLICY IF EXISTS "join_codes_update" ON join_codes;
DROP POLICY IF EXISTS "join_codes_delete" ON join_codes;

CREATE POLICY "join_codes_insert" ON join_codes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = join_codes.association_id AND a.owner_id = (SELECT auth.uid()))
);
CREATE POLICY "join_codes_update" ON join_codes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = join_codes.association_id AND a.owner_id = (SELECT auth.uid()))
);
CREATE POLICY "join_codes_delete" ON join_codes FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = join_codes.association_id AND a.owner_id = (SELECT auth.uid()))
);

-- Table main_levees
DROP POLICY IF EXISTS "main_levees_select" ON main_levees;
DROP POLICY IF EXISTS "main_levees_insert" ON main_levees;
DROP POLICY IF EXISTS "main_levees_update" ON main_levees;

CREATE POLICY "main_levees_select" ON main_levees FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = main_levees.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);
CREATE POLICY "main_levees_insert" ON main_levees FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = main_levees.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);
CREATE POLICY "main_levees_update" ON main_levees FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = main_levees.association_id AND ba.user_id = (SELECT auth.uid()))
) WITH CHECK (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = main_levees.association_id AND ba.user_id = (SELECT auth.uid()))
);

-- Table association_events
DROP POLICY IF EXISTS "events_select" ON association_events;
DROP POLICY IF EXISTS "events_insert" ON association_events;
DROP POLICY IF EXISTS "events_update" ON association_events;

CREATE POLICY "events_select" ON association_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = association_events.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);
CREATE POLICY "events_insert" ON association_events FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = association_events.association_id AND ba.user_id = (SELECT auth.uid()) AND ba.role = 'proprio')
);
CREATE POLICY "events_update" ON association_events FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = association_events.association_id AND ba.user_id = (SELECT auth.uid()) AND ba.role = 'proprio')
);

-- Table cassations
DROP POLICY IF EXISTS "cassations_select" ON cassations;
DROP POLICY IF EXISTS "cassations_insert" ON cassations;

CREATE POLICY "cassations_select" ON cassations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = cassations.association_id AND a.owner_id = (SELECT auth.uid()))
);
CREATE POLICY "cassations_insert" ON cassations FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = cassations.association_id AND a.owner_id = (SELECT auth.uid()))
);

-- Table meetings
DROP POLICY IF EXISTS "meetings_select" ON meetings;
DROP POLICY IF EXISTS "meetings_insert" ON meetings;
DROP POLICY IF EXISTS "meetings_update" ON meetings;
DROP POLICY IF EXISTS "meetings_delete" ON meetings;

CREATE POLICY "meetings_select" ON meetings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = meetings.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);
CREATE POLICY "meetings_insert" ON meetings FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = meetings.association_id AND ba.user_id = (SELECT auth.uid()))
);
CREATE POLICY "meetings_update" ON meetings FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = meetings.association_id AND ba.user_id = (SELECT auth.uid()))
);
CREATE POLICY "meetings_delete" ON meetings FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM bureau_assignments ba WHERE ba.association_id = meetings.association_id AND ba.user_id = (SELECT auth.uid()))
);

-- Table conversations
DROP POLICY IF EXISTS "conversations_select" ON conversations;
CREATE POLICY "conversations_select" ON conversations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = conversations.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);

-- Table messages
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
DROP POLICY IF EXISTS "messages_delete" ON messages;

CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated USING (
  sender_id = (SELECT auth.uid())
  OR (NOT deleted_for_all AND EXISTS (SELECT 1 FROM conversations c JOIN association_members am ON am.association_id = c.association_id WHERE c.id = messages.conversation_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active'))
);
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = (SELECT auth.uid())
  AND EXISTS (SELECT 1 FROM conversations c JOIN association_members am ON am.association_id = c.association_id WHERE c.id = messages.conversation_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);
CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated USING (
  sender_id = (SELECT auth.uid())
) WITH CHECK (
  sender_id = (SELECT auth.uid())
);
CREATE POLICY "messages_delete" ON messages FOR DELETE TO authenticated USING (
  sender_id = (SELECT auth.uid())
);

-- Table subscriptions
DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;

CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = subscriptions.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = subscriptions.association_id AND a.owner_id = (SELECT auth.uid()))
);
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM associations a WHERE a.id = subscriptions.association_id AND a.owner_id = (SELECT auth.uid()))
);

-- Table consent_records
DROP POLICY IF EXISTS "consent_select_own" ON consent_records;
DROP POLICY IF EXISTS "consent_insert_own" ON consent_records;

CREATE POLICY "consent_select_own" ON consent_records FOR SELECT TO authenticated USING (
  user_id = (SELECT auth.uid())
);
CREATE POLICY "consent_insert_own" ON consent_records FOR INSERT TO authenticated WITH CHECK (
  user_id = (SELECT auth.uid())
);

-- Table transaction_requests (remaining policies)
DROP POLICY IF EXISTS "tx_requests_select" ON transaction_requests;
DROP POLICY IF EXISTS "tx_requests_update" ON transaction_requests;

CREATE POLICY "tx_requests_select" ON transaction_requests FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = transaction_requests.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);
CREATE POLICY "tx_requests_update" ON transaction_requests FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = transaction_requests.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
) WITH CHECK (
  EXISTS (SELECT 1 FROM association_members am WHERE am.association_id = transaction_requests.association_id AND am.user_id = (SELECT auth.uid()) AND am.status = 'active')
);


-- ============================================================
-- 5. INDEXES CREATION
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_join_codes_assoc ON join_codes(association_id);
CREATE INDEX IF NOT EXISTS idx_members_assoc_user_status ON association_members(association_id, user_id, status);


-- ============================================================
-- 6. KYC SUBMISSIONS & BUCKETS CREATION
-- ============================================================

-- Private bucket kyc_docs
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc_docs', 'kyc_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for private bucket kyc_docs
DROP POLICY IF EXISTS "kyc_docs_private_select" ON storage.objects;
DROP POLICY IF EXISTS "kyc_docs_private_insert" ON storage.objects;

CREATE POLICY "kyc_docs_private_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'kyc_docs' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "kyc_docs_private_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc_docs' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND (metadata->>'size')::int <= 3145728  -- Max 3MB
  );

-- Create table kyc_submissions
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  document_type text NOT NULL CHECK (document_type IN ('cni','passeport','permis')),
  cni_path text NOT NULL,
  selfie_path text NOT NULL,
  liveness_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on kyc_submissions
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kyc_submissions_select_own" ON kyc_submissions;
DROP POLICY IF EXISTS "kyc_submissions_insert_own" ON kyc_submissions;

CREATE POLICY "kyc_submissions_select_own" ON kyc_submissions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "kyc_submissions_insert_own" ON kyc_submissions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'pending');

-- Ensure profiles table has the kyc_verified boolean column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_verified boolean NOT NULL DEFAULT false;

