export type KycStatus = 'pending' | 'verified' | 'rejected'
export type AssociationType = 'tontine' | 'gic' | 'ong' | 'association'
export type Visibility = 'public' | 'private'
export type ContributionFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type AssociationStatus = 'active' | 'disabled' | 'deleted' | 'renewed'
export type MemberStatus = 'pending' | 'active' | 'suspended' | 'left'
export type BureauRole = 'proprio' | 'secretariat' | 'commission_comptes' | 'tresorerie'
export type TransactionRequestType = 'collection' | 'disbursement' | 'refund'
export type TransactionRequestStatus = 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'rejected'
export type TransactionType = 'collection' | 'disbursement' | 'refund' | 'commission'
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'cancelled'
export type MainLeveeMode = 'flexible' | 'tout_ou_rien'
export type MainLeveeStatus = 'active' | 'succeeded' | 'expired' | 'refunding' | 'refunded' | 'cancelled'
export type ContributionStatus = 'pending' | 'success' | 'failed' | 'refunded'
export type EventType = 'heureux' | 'malheureux'
export type EventStatus = 'active' | 'closed' | 'cancelled'
export type CassationType = 'supprimee' | 'desactivee' | 'renouvelee'
export type MeetingPlatform = 'meet' | 'zoom' | 'whatsapp' | 'other'
export type SubscriptionPlan = 'free' | 'premium'
export type Language = 'fr' | 'en'

export interface Profile {
  id: string
  full_name: string
  phone: string
  id_document_url: string | null
  kyc_status: KycStatus
  kyc_verified_at: string | null
  preferred_language: Language
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Association {
  id: string
  name: string
  owner_id: string
  receipt_document_url: string | null
  receipt_number: string | null
  city: string
  region: string
  association_type: AssociationType
  visibility: Visibility
  contribution_frequency: ContributionFrequency
  contribution_amount: number
  cassation_date: string | null
  status: AssociationStatus
  is_premium: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export interface JoinCode {
  id: string
  code: string
  association_id: string
  created_by: string
  is_active: boolean
  expires_at: string | null
  created_at: string
  deleted_at: string | null
}

export interface AssociationMember {
  id: string
  association_id: string
  user_id: string
  status: MemberStatus
  joined_at: string | null
  invited_by: string | null
  created_at: string
  profile?: Profile
}

export interface BureauAssignment {
  id: string
  association_id: string
  user_id: string
  role: BureauRole
  assigned_at: string
  assigned_by: string | null
  profile?: Profile
}

export interface Wallet {
  id: string
  association_id: string
  external_reference: string | null
  cached_balance: number
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface TransactionRequest {
  id: string
  association_id: string
  requested_by: string
  type: TransactionRequestType
  amount: number
  currency: string
  description: string | null
  beneficiary_name: string | null
  beneficiary_phone: string | null
  related_entity_type: string | null
  related_entity_id: string | null
  status: TransactionRequestStatus
  required_approvals: number
  notchpay_reference: string | null
  notchpay_response: Record<string, unknown> | null
  executed_at: string | null
  created_at: string
  updated_at: string
  approvals?: BureauApproval[]
}

export interface BureauApproval {
  id: string
  transaction_request_id: string
  approver_id: string
  approved: boolean
  comment: string | null
  created_at: string
  profile?: Profile
}

export interface Transaction {
  id: string
  association_id: string
  transaction_request_id: string | null
  type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  external_reference: string | null
  notchpay_response: Record<string, unknown> | null
  description: string | null
  created_at: string
}

export interface MainLevee {
  id: string
  association_id: string
  beneficiary_name: string
  beneficiary_phone: string | null
  title: string
  description: string | null
  target_amount: number
  collected_amount: number
  mode: MainLeveeMode
  commission_rate: number
  status: MainLeveeStatus
  deadline: string
  disbursed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  contributions?: MainLeveeContribution[]
}

export interface MainLeveeContribution {
  id: string
  main_levee_id: string
  contributor_id: string
  amount: number
  status: ContributionStatus
  notchpay_reference: string | null
  refund_reference: string | null
  created_at: string
  profile?: Profile
}

export interface AssociationEvent {
  id: string
  association_id: string
  event_type: EventType
  title: string
  description: string | null
  mandatory_amount: number
  beneficiary_name: string | null
  deadline: string | null
  status: EventStatus
  created_by: string
  created_at: string
  payments?: EventPayment[]
}

export interface EventPayment {
  id: string
  event_id: string
  payer_id: string
  amount: number
  status: 'pending' | 'success' | 'failed'
  notchpay_reference: string | null
  created_at: string
  profile?: Profile
}

export interface Cassation {
  id: string
  association_id: string
  type: CassationType
  reason: string | null
  pdf_export_url: string | null
  performed_by: string
  performed_at: string
}

export interface Meeting {
  id: string
  association_id: string
  title: string
  description: string | null
  scheduled_at: string
  external_link: string | null
  platform: MeetingPlatform | null
  created_by: string
  created_at: string
}

export interface Conversation {
  id: string
  association_id: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  edited_at: string | null
  pinned: boolean
  deleted_for_me: boolean
  deleted_for_all: boolean
  forwarded_from: string | null
  created_at: string
  sender?: Profile
}

export interface Subscription {
  id: string
  association_id: string
  plan: SubscriptionPlan
  started_at: string
  expires_at: string | null
  created_at: string
}

export interface ConsentRecord {
  id: string
  user_id: string
  consent_type: string
  consent_text: string
  consented: boolean
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  association_id: string | null
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export interface UserWallet {
  id: string
  user_id: string
  cached_balance: number
  total_contributed: number
  total_received: number
  currency: string
  created_at: string
  updated_at: string
}

export interface UserWalletTransaction {
  id: string
  user_id: string
  type: 'deposit' | 'withdrawal' | 'cotisation' | 'tontine_payout' | 'main_levee_contribution'
  amount: number
  title: string
  association_name?: string | null
  payment_method: 'mtn_momo' | 'orange_money' | 'wallet'
  status: 'success' | 'pending' | 'failed'
  created_at: string
}

export interface TontineRound {
  id: string
  association_id: string
  round_number: number
  title: string
  beneficiary_id: string
  beneficiary_name: string
  pot_amount: number
  contribution_amount: number
  due_date: string
  status: 'upcoming' | 'active' | 'completed'
}

export interface TontineContribution {
  id: string
  round_id: string
  user_id: string
  amount: number
  status: 'success' | 'pending' | 'failed'
  paid_at: string
  payment_method: 'mtn_momo' | 'orange_money' | 'wallet'
}
