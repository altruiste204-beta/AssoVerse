import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import { useAssociation } from '@/features/associations/association-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button, Card, Input, Select, Modal, Badge, Spinner, EmptyState, ProgressBar } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatXAF, formatDate } from '@/lib/utils'
import type { BureauAssignment, TransactionRequest, BureauApproval, Profile } from '@/types/database'
import { ShieldCheck, Plus, Check, X, Users } from 'lucide-react'

export function BureauPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { currentAssociation, userRole } = useAssociation()
  const [assignments, setAssignments] = useState<(BureauAssignment & { profile?: Profile })[]>([])
  const [requests, setRequests] = useState<(TransactionRequest & { approvals?: (BureauApproval & { profile?: Profile })[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)

  // form
  const [reqType, setReqType] = useState('collection')
  const [amount, setAmount] = useState('')
  const [beneficiary, setBeneficiary] = useState('')
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('')
  const [description, setDescription] = useState('')

  const loadData = useCallback(async () => {
    if (!currentAssociation) { setLoading(false); return }
    const [bureauRes, reqRes] = await Promise.all([
      supabase.from('bureau_assignments').select('*, profile:profiles!bureau_assignments_user_id_fkey(*)')
        .eq('association_id', currentAssociation.id),
      supabase.from('transaction_requests')
        .select('*, approvals:bureau_approvals(*, profile:profiles!bureau_approvals_approver_id_fkey(*))')
        .eq('association_id', currentAssociation.id)
        .order('created_at', { ascending: false }),
    ])
    setAssignments((bureauRes.data || []) as (BureauAssignment & { profile?: Profile })[])
    setRequests((reqRes.data || []) as (TransactionRequest & { approvals?: (BureauApproval & { profile?: Profile })[] })[])
    setLoading(false)
  }, [currentAssociation])

  useEffect(() => { loadData() }, [loadData])

  const isBureauMember = !!userRole

  const handleCreate = async () => {
    if (!user || !currentAssociation || !amount) return
    setCreating(true)
    try {
      const { error } = await supabase.from('transaction_requests').insert({
        association_id: currentAssociation.id,
        requested_by: user.id, type: reqType,
        amount: parseFloat(amount), description,
        beneficiary_name: beneficiary, beneficiary_phone: beneficiaryPhone,
        required_approvals: 2, status: 'pending',
      })
      if (error) throw error
      setShowCreate(false)
      setAmount(''); setBeneficiary(''); setBeneficiaryPhone(''); setDescription('')
      await loadData()
    } catch (err) { console.error(err) } finally { setCreating(false) }
  }

  const handleApprove = async (req: TransactionRequest, approved: boolean) => {
    if (!user) return
    setApproving(req.id)
    try {
      const { error } = await supabase.from('bureau_approvals').insert({
        transaction_request_id: req.id, approver_id: user.id, approved,
      })
      if (error) throw error
      const approvals = (req as TransactionRequest & { approvals?: BureauApproval[] }).approvals || []
      const newCount = approvals.filter(a => a.approved).length + (approved ? 1 : 0)
      if (approved && newCount >= req.required_approvals) {
        await supabase.from('transaction_requests').update({ status: 'approved' }).eq('id', req.id)
      } else if (!approved) {
        await supabase.from('transaction_requests').update({ status: 'rejected' }).eq('id', req.id)
      }
      await loadData()
    } catch (err) { console.error(err) } finally { setApproving(null) }
  }

  if (!currentAssociation) {
    return <AppLayout><EmptyState icon={<ShieldCheck size={48} />} title={t('dashboard.noAssociation')} /></AppLayout>
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '22px', color: 'var(--color-text)' }}>{t('bureau.title')}</h1>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> {t('bureau.newRequest')}
          </Button>
        </div>

        {/* Bureau members */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Users size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '15px', color: 'var(--color-text)' }}>{t('bureau.members')}</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? <Spinner size={24} /> : assignments.map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>{a.profile?.full_name || '—'}</span>
                <Badge variant={a.role === 'proprio' ? 'primary' : 'default'} size="sm">
                  {t(`bureau.role.${a.role}`)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Transaction requests */}
        <div>
          <h3 style={{ fontSize: '15px', color: 'var(--color-text)', marginBottom: '12px' }}>{t('bureau.approvals')}</h3>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner size={24} /></div>
          ) : requests.length === 0 ? (
            <EmptyState icon={<ShieldCheck size={36} />} title={t('bureau.noRequests')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requests.map((req) => {
                const approvals = req.approvals || []
                const approvedCount = approvals.filter(a => a.approved).length
                const hasApproved = approvals.some(a => a.approver_id === user?.id && a.approved)
                const hasRejected = approvals.some(a => a.approver_id === user?.id && !a.approved)
                const canApprove = isBureauMember && !hasApproved && !hasRejected && req.status === 'pending'
                return (
                  <Card key={req.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <Badge variant={req.type === 'collection' ? 'success' : req.type === 'disbursement' ? 'accent' : 'warning'} size="sm">
                          {t(`bureau.requestType.${req.type}`)}
                        </Badge>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginLeft: '8px' }}>
                          {formatXAF(req.amount)}
                        </span>
                      </div>
                      <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'error' : req.status === 'completed' ? 'primary' : 'warning'} size="sm">
                        {req.status}
                      </Badge>
                    </div>
                    {req.description && <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>{req.description}</p>}
                    {req.beneficiary_name && <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{req.beneficiary_name}</p>}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {t('bureau.approvalCount', { current: approvedCount, required: req.required_approvals })}
                        </span>
                      </div>
                      <ProgressBar value={approvedCount} max={req.required_approvals} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>{formatDate(req.created_at)}</div>
                    {canApprove && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button size="sm" variant="success" loading={approving === req.id} onClick={() => handleApprove(req, true)}>
                          <Check size={14} /> {t('bureau.approve')}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleApprove(req, false)}>
                          <X size={14} /> {t('bureau.reject')}
                        </Button>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('bureau.newRequest')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select label={t('bureau.requestType')} value={reqType} onChange={setReqType} options={[
            { value: 'collection', label: t('bureau.requestType.collection') },
            { value: 'disbursement', label: t('bureau.requestType.disbursement') },
            { value: 'refund', label: t('bureau.requestType.refund') },
          ]} />
          <Input label={t('bureau.amount')} value={amount} onChange={setAmount} type="number" required />
          <Input label={t('bureau.beneficiary')} value={beneficiary} onChange={setBeneficiary} />
          <Input label={t('mainLevee.beneficiaryPhone')} value={beneficiaryPhone} onChange={setBeneficiaryPhone} />
          <Input label={t('bureau.description')} value={description} onChange={setDescription} multiline rows={2} />
          <Button onClick={handleCreate} fullWidth loading={creating} disabled={!amount}>
            {t('bureau.submit')}
          </Button>
        </div>
      </Modal>
    </AppLayout>
  )
}
