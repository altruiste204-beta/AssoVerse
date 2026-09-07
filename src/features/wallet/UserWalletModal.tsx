import { useState } from 'react'
import { useUserWallet } from './user-wallet-context'
import { Modal, Button, Input } from '@/components/ui'
import { motion, AnimatePresence } from 'motion/react'
import { formatXAF, formatDate } from '@/lib/utils'
import { getNdopPatternSvg, getEkangPatternSvg } from '@/components/ui/CameroonPattern'
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

export function UserWalletModal() {
  const {
    wallet,
    transactions,
    isModalOpen,
    closeWalletModal,
    activeTab,
    setActiveTab,
    topUp,
    withdraw,
  } = useUserWallet()

  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('+237 ')
  const [method, setMethod] = useState<'mtn_momo' | 'orange_money'>('mtn_momo')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleTopUp = async () => {
    const num = parseFloat(amount)
    if (!num || num <= 0) {
      setFeedback({ type: 'error', message: 'Veuillez saisir un montant valide (min. 1 000 XAF)' })
      return
    }
    if (phone.length < 9) {
      setFeedback({ type: 'error', message: 'Veuillez saisir un numéro de téléphone valide' })
      return
    }

    setSubmitting(true)
    setFeedback(null)
    const success = await topUp(num, method, phone)
    setSubmitting(false)

    if (success) {
      setFeedback({
        type: 'success',
        message: `Recharge de ${formatXAF(num)} effectuée avec succès sur votre AS-WALLET !`,
      })
      setAmount('')
    } else {
      setFeedback({ type: 'error', message: 'Erreur lors de la recharge. Veuillez réessayer.' })
    }
  }

  const handleWithdraw = async () => {
    const num = parseFloat(amount)
    if (!num || num <= 0) {
      setFeedback({ type: 'error', message: 'Veuillez saisir un montant valide' })
      return
    }
    if (phone.length < 9) {
      setFeedback({ type: 'error', message: 'Veuillez saisir un numéro de téléphone valide' })
      return
    }

    setSubmitting(true)
    setFeedback(null)
    const res = await withdraw(num, method, phone)
    setSubmitting(false)

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Retrait de ${formatXAF(num)} envoyé vers votre compte Mobile Money !`,
      })
      setAmount('')
    } else {
      setFeedback({ type: 'error', message: res.error || 'Erreur lors du retrait' })
    }
  }

  const balance = wallet?.cached_balance || 0
  const totalContributed = wallet?.total_contributed || 0
  const totalReceived = wallet?.total_received || 0

  return (
    <Modal
      open={isModalOpen}
      onClose={closeWalletModal}
      title="AS-WALLET"
      maxWidth={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Balance Hero Card */}
        <div
          style={{
            background: 'var(--color-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          }}
        >
          {/* Repeating Ndop pattern overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url("${getNdopPatternSvg('rgba(255, 255, 255, 0.08)')}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '120px 120px',
            pointerEvents: 'none',
            zIndex: 0,
          }} />

          {/* Spinning Cameroonian motif */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-30px',
            width: '140px',
            height: '140px',
            opacity: 0.15,
            pointerEvents: 'none',
            backgroundImage: `url("${getEkangPatternSvg('#FFFFFF')}")`,
            backgroundSize: 'cover',
            borderRadius: '50%',
            border: '1.5px dashed rgba(255, 255, 255, 0.4)',
            animation: 'spin 30s linear infinite',
            zIndex: 0,
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9, fontSize: '13px' }}>
                <Wallet size={16} />
                <span>Solde Disponible AS-WALLET</span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                FCFA (XAF)
              </span>
            </div>

            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '16px' }}>
              {formatXAF(balance)}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.15)',
                fontSize: '12px',
              }}
            >
              <div>
                <div style={{ opacity: 0.8, marginBottom: '2px' }}>Total cotisé</div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{formatXAF(totalContributed)}</div>
              </div>
              <div>
                <div style={{ opacity: 0.8, marginBottom: '2px' }}>Total reçu (gains)</div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{formatXAF(totalReceived)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--color-sand)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            gap: '4px',
          }}
        >
          <button
            onClick={() => { setActiveTab('overview'); setFeedback(null) }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'overview' ? 'var(--color-card)' : 'transparent',
              color: activeTab === 'overview' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'overview' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <History size={14} />
            Historique
          </button>
          <button
            onClick={() => { setActiveTab('topup'); setFeedback(null) }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'topup' ? 'var(--color-card)' : 'transparent',
              color: activeTab === 'topup' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'topup' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ArrowDownLeft size={14} />
            Recharger
          </button>
          <button
            onClick={() => { setActiveTab('withdraw'); setFeedback(null) }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'withdraw' ? 'var(--color-card)' : 'transparent',
              color: activeTab === 'withdraw' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'withdraw' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ArrowUpRight size={14} />
            Retirer
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              background: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: feedback.type === 'success' ? '#065F46' : '#991B1B',
              border: `1px solid ${feedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Tab 1: Overview & History */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(1px)' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                  Derniers Mouvements
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {transactions.length} opération(s)
                </span>
              </div>

              {transactions.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 16px',
                    color: 'var(--color-text-muted)',
                    fontSize: '13px',
                    background: 'var(--color-sand)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  Aucune transaction récente sur votre AS-WALLET.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                  {transactions.map((tx) => {
                    const isCredit = tx.type === 'deposit' || tx.type === 'tontine_payout'
                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isCredit ? '#E8F5E9' : '#FFEBEE',
                              color: isCredit ? '#2E7D32' : '#C62828',
                            }}
                          >
                            {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                              {tx.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              {formatDate(tx.created_at)}
                              {tx.association_name ? ` • ${tx.association_name}` : ''}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: isCredit ? '#2E7D32' : '#C62828',
                            }}
                          >
                            {isCredit ? '+' : '-'}{formatXAF(tx.amount)}
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            {tx.payment_method === 'wallet' ? 'AS-WALLET' : tx.payment_method === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '8px',
                }}
              >
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => { setActiveTab('topup'); setFeedback(null) }}
                >
                  <ArrowDownLeft size={16} /> Recharger
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => { setActiveTab('withdraw'); setFeedback(null) }}
                >
                  <ArrowUpRight size={16} /> Retirer
                </Button>
              </div>
            </motion.div>
          )}

          {/* Tab 2: Top Up */}
          {activeTab === 'topup' && (
            <motion.div
              key="topup"
              initial={{ opacity: 0, y: 15, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(1px)' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Alimentez votre AS-WALLET pour payer facilement vos cotisations de tontine en un clic.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '6px' }}>
                  Mode de paiement Mobile Money
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setMethod('mtn_momo')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${method === 'mtn_momo' ? '#FBBF24' : 'var(--color-border)'}`,
                      background: method === 'mtn_momo' ? 'rgba(251, 191, 36, 0.15)' : 'var(--color-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Smartphone size={18} color="#D97706" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>MTN Mobile Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('orange_money')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${method === 'orange_money' ? '#F97316' : 'var(--color-border)'}`,
                      background: method === 'orange_money' ? 'rgba(249, 115, 22, 0.15)' : 'var(--color-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Smartphone size={18} color="#EA580C" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>Orange Money</span>
                  </button>
                </div>
              </div>

              <Input
                label="Numéro de téléphone payeur"
                value={phone}
                onChange={setPhone}
                placeholder="+237 690 123 456"
              />

              <Input
                label="Montant à recharger (XAF)"
                type="number"
                value={amount}
                onChange={setAmount}
                placeholder="Ex: 50000"
              />

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[10000, 25000, 50000, 100000].map((quickAmt) => (
                  <button
                    key={quickAmt}
                    type="button"
                    onClick={() => setAmount(String(quickAmt))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-sand)',
                      fontSize: '12px',
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                    }}
                  >
                    +{formatXAF(quickAmt)}
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                fullWidth
                loading={submitting}
                onClick={handleTopUp}
              >
                Valider la recharge
              </Button>
            </motion.div>
          )}

          {/* Tab 3: Withdraw */}
          {activeTab === 'withdraw' && (
            <motion.div
              key="withdraw"
              initial={{ opacity: 0, y: 15, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(1px)' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Transférez vos fonds vers votre compte MTN Mobile Money ou Orange Money.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '6px' }}>
                  Transférer vers
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setMethod('mtn_momo')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${method === 'mtn_momo' ? '#FBBF24' : 'var(--color-border)'}`,
                      background: method === 'mtn_momo' ? 'rgba(251, 191, 36, 0.15)' : 'var(--color-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Smartphone size={18} color="#D97706" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>MTN Mobile Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('orange_money')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${method === 'orange_money' ? '#F97316' : 'var(--color-border)'}`,
                      background: method === 'orange_money' ? 'rgba(249, 115, 22, 0.15)' : 'var(--color-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Smartphone size={18} color="#EA580C" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>Orange Money</span>
                  </button>
                </div>
              </div>

              <Input
                label="Numéro de téléphone bénéficiaire"
                value={phone}
                onChange={setPhone}
                placeholder="+237 677 123 456"
              />

              <Input
                label={`Montant à retirer (Max: ${formatXAF(balance)})`}
                type="number"
                value={amount}
                onChange={setAmount}
                placeholder="Ex: 25000"
              />

              <Button
                variant="primary"
                fullWidth
                loading={submitting}
                onClick={handleWithdraw}
              >
                Initier le retrait
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '8px 10px',
            background: 'var(--color-sand)',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.4,
          }}
        >
          <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            AS-WALLET : Solde indicatif synchronisé via agrégateur agréé NotchPay (MTN MoMo, Orange Money).
            AssoMboa n'est jamais dépositaire direct des fonds.
          </span>
        </div>
      </div>
    </Modal>
  )
}
