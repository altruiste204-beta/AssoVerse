-- Migration 006: Add conversations_insert policy
-- Allows active members to create/initialize a conversation for their association

DROP POLICY IF EXISTS "conversations_insert" ON conversations;

CREATE POLICY "conversations_insert" ON conversations FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM association_members am
    WHERE am.association_id = conversations.association_id
      AND am.user_id = (SELECT auth.uid())
      AND am.status = 'active'
  )
);
