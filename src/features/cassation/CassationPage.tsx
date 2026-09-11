import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAssociation } from '@/features/associations/association-context'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button, Card, Input, Modal, Badge } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, Trash2, Pause, RefreshCw } from 'lucide-react'
import type { CassationType } from '@/types/database'

export function CassationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentAssociation, userRole, refreshAssociations } = useAssociation()
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedType, setSelectedType] = useState<CassationType | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (!currentAssociation) {
    return <AppLayout><div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>{t('dashboard.noAssociation')}</div></AppLayout>
  }

  if (userRole !== 'proprio') {
    return <AppLayout><div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>{t('common.error')}</div></AppLayout>
  }

  const types: { type: CassationType; icon: React.ReactNode; variant: 'danger' | 'warning' | 'primary' }[] = [
    { type: 'supprimee', icon: <Trash2 size={24} />, variant: 'danger' },
    { type: 'desactivee', icon: <Pause size={24} />, variant: 'warning' },
    { type: 'renouvelee', icon: <RefreshCw size={24} />, variant: 'primary' },
  ]

  const handleConfirm = async () => {
    if (!currentAssociation || !selectedType) return
    setLoading(true)
    try {
      let pdfUrl: string | null = null

      if (selectedType === 'supprimee') {
        // Generate anonymized PDF
        const { count: memberCount } = await supabase.from('association_members')
          .select('id', { count: 'exact', head: true })
          .eq('association_id', currentAssociation.id)
        const { count: txCount } = await supabase.from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('association_id', currentAssociation.id)

        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF()
        doc.setFontSize(18)
        doc.text('AssoMboa — Rapport de Cassation (Anonymise)', 20, 30)
        doc.setFontSize(12)
        doc.text(`Type: Suppression definitive`, 20, 50)
        doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 60)
        doc.text(`Statistiques agregees (anonymisees):`, 20, 80)
        doc.text(`- Nombre total de membres: ${memberCount || 0}`, 20, 90)
        doc.text(`- Nombre total de transactions: ${txCount || 0}`, 20, 100)
        doc.text(`Aucune donnee personnelle n'est incluse dans ce rapport.`, 20, 120)
        doc.text(`Conforme a la loi camerounaise n deg 2024/017.`, 20, 130)
        const pdfBlob = doc.output('blob')
        const { error: uploadErr } = await supabase.storage
          .from('cassation-exports')
          .upload(`${currentAssociation.id}/cassation-report.pdf`, pdfBlob)
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from('cassation-exports')
            .getPublicUrl(`${currentAssociation.id}/cassation-report.pdf`)
          pdfUrl = publicUrl
        }
        await supabase.from('associations').update({ status: 'deleted' }).eq('id', currentAssociation.id)
      } else if (selectedType === 'desactivee') {
        await supabase.from('associations').update({ status: 'disabled' }).eq('id', currentAssociation.id)
      } else if (selectedType === 'renouvelee') {
        await supabase.from('associations').update({ status: 'renewed' }).eq('id', currentAssociation.id)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('cassations').insert({
          association_id: currentAssociation.id, type: selectedType,
          reason, pdf_export_url: pdfUrl, performed_by: user.id,
        })
      }

      setShowConfirm(false)
      setReason('')
      await refreshAssociations()
      navigate('/dashboard')
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--color-text)' }}>{t('cassation.title')}</h1>

        <Card style={{ border: '1px solid var(--color-warning)', background: 'rgba(240, 160, 32, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '13px', color: 'var(--color-text)' }}>{t('cassation.warning')}</p>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {types.map(({ type, icon, variant }) => (
            <Card
              key={type}
              onClick={() => { setSelectedType(type); setShowConfirm(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                background: variant === 'danger' ? 'var(--color-error)' : variant === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ color: '#FFFFFF' }}>{icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '15px', color: 'var(--color-text)', marginBottom: '4px' }}>
                  {t(`cassation.type.${type}`)}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  {t(`cassation.type.${type}Desc`)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title={t('cassation.confirm')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedType && (
            <Card style={{ background: 'var(--color-sand)' }}>
              <Badge variant={selectedType === 'supprimee' ? 'error' : selectedType === 'desactivee' ? 'warning' : 'primary'}>
                {t(`cassation.type.${selectedType}`)}
              </Badge>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                {t(`cassation.type.${selectedType}Desc`)}
              </p>
            </Card>
          )}
          <Input label={t('cassation.reason')} value={reason} onChange={setReason} multiline rows={3} />
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="outline" fullWidth onClick={() => setShowConfirm(false)}>
              {t('cassation.cancel')}
            </Button>
            <Button variant="danger" fullWidth loading={loading} onClick={handleConfirm}>
              {t('cassation.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
