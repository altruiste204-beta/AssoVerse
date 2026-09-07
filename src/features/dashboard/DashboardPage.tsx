import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import { useAssociation } from '@/features/associations/association-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Select, ProgressBar, Spinner, EmptyState, Badge } from '@/components/ui'
import { formatXAF, formatDate, getProgressPercentage } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { getEkangPatternSvg, getNdopPatternSvg } from '@/components/ui/CameroonPattern'
import {
  Users,
  TrendingUp,
  Calendar,
  HandCoins,
  Heart,
  ShieldCheck,
  ArrowRight,
  HeartHandshake,
  Landmark,
} from 'lucide-react'

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { currentAssociation, associations, setCurrentAssociation, loading } = useAssociation()
  const [memberCount, setMemberCount] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [lastTx, setLastTx] = useState<{ amount: number; created_at: string } | null>(null)
  const [contributionProgress, setContributionProgress] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      if (!currentAssociation) { setStatsLoading(false); return }
      setStatsLoading(true)
      const [membersRes, walletRes, txRes] = await Promise.all([
        supabase.from('association_members').select('id', { count: 'exact', head: true })
          .eq('association_id', currentAssociation.id).eq('status', 'active'),
        supabase.from('wallets').select('cached_balance').eq('association_id', currentAssociation.id).maybeSingle(),
        supabase.from('transactions').select('amount, created_at').eq('association_id', currentAssociation.id)
          .eq('status', 'success').order('created_at', { ascending: false }).limit(1),
      ])
      setMemberCount(membersRes.count || 0)
      setWalletBalance(walletRes.data?.cached_balance || 0)
      setLastTx(txRes.data?.[0] || null)
      if (txRes.data?.[0] && currentAssociation.contribution_amount > 0) {
        setContributionProgress(getProgressPercentage(txRes.data[0].amount, currentAssociation.contribution_amount))
      }
      setStatsLoading(false)
    }
    loadStats()
  }, [currentAssociation])

  if (loading) {
    return <AppLayout><div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size={32} /></div></AppLayout>
  }

  return (
    <AppLayout>
      <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
        {/* Subtle repeating background Ndop pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url("${getNdopPatternSvg('var(--color-primary)')}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '120px 120px',
          opacity: 0.015,
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Subtle spinning circular Ekang pattern decoration */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '150px',
          height: '150px',
          opacity: 0.08,
          pointerEvents: 'none',
          backgroundImage: `url("${getEkangPatternSvg('var(--color-primary)')}")`,
          backgroundSize: 'cover',
          borderRadius: '50%',
          border: '1.5px dashed var(--color-primary)',
          animation: 'spin 30s linear infinite',
          zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-text)', marginBottom: '8px' }}>
            {t('dashboard.welcome', { name: profile?.full_name?.split(' ')[0] || '' })}
          </h1>
          {associations.length > 0 && (
            <Select
              value={currentAssociation?.id || ''}
              onChange={(val) => {
                const assoc = associations.find((a) => a.id === val)
                if (assoc) setCurrentAssociation(assoc)
              }}
              options={associations.map((a) => ({ value: a.id, label: a.name }))}
            />
          )}
        </div>

        {!currentAssociation ? (
          <EmptyState
            icon={<Users size={48} />}
            title={t('dashboard.noAssociation')}
            description={t('dashboard.selectAssociation')}
            action={<button onClick={() => navigate('/associations')} style={{
              padding: '10px 24px', background: 'var(--color-primary)', color: 'var(--color-primary-text)',
              borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            }}>{t('nav.associations')}</button>}
          />
        ) : statsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size={32} /></div>
        ) : (
          <>
            {/* Association Statistics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <StatCard icon={<Users size={20} />} label={t('dashboard.members')} value={String(memberCount)} />
              <StatCard icon={<Landmark size={20} />} label="Trésorerie" value={formatXAF(walletBalance)} sub="Caisse collective" />
              <StatCard icon={<TrendingUp size={20} />} label={t('dashboard.lastPayment')}
                value={lastTx ? formatXAF(lastTx.amount) : '—'}
                sub={lastTx ? formatDate(lastTx.created_at) : ''} />
              <StatCard icon={<Calendar size={20} />} label={t('dashboard.nextCollection')}
                value={formatXAF(currentAssociation.contribution_amount)}
                sub={t(`assoc.frequency.${currentAssociation.contribution_frequency}`)} />
            </div>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                  {t('dashboard.contributionProgress')}
                </span>
                <Badge variant="primary">{contributionProgress}%</Badge>
              </div>
              <ProgressBar value={contributionProgress} max={100} />
            </Card>

            {/* Quick Actions */}
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-text)', marginBottom: '12px' }}>
                Accès rapide
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                <QuickAction icon={<HandCoins size={20} />} label="Tontines & Cotisations" onClick={() => navigate('/tontines')} />
                <QuickAction icon={<HeartHandshake size={20} />} label={t('mainLevee.title')} onClick={() => navigate('/main-levee?tab=main-levee')} />
                <QuickAction icon={<Heart size={20} />} label={t('events.title')} onClick={() => navigate('/events')} />
                <QuickAction icon={<ShieldCheck size={20} />} label={t('bureau.title')} onClick={() => navigate('/bureau')} />
                <QuickAction icon={<Calendar size={20} />} label={t('meetings.title')} onClick={() => navigate('/meetings')} />
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{sub}</div>}
    </Card>
  )
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
    >
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', flex: 1 }}>{label}</span>
      <ArrowRight size={16} color="var(--color-text-muted)" />
    </Card>
  )
}
