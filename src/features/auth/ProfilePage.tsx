import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import { useTheme } from '@/features/dashboard/theme-context'
import { useUserWallet } from '@/features/wallet/user-wallet-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button, Card, Input, Badge, Select, Modal, Spinner } from '@/components/ui'
import { getEkangPatternSvg, getNdopPatternSvg } from '@/components/ui/CameroonPattern'
import { formatXAF } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Mail, Phone, ShieldCheck, Sun, Moon, Globe, LogOut, Wallet, ArrowDownLeft, ArrowUpRight, Trash2, Archive, UserX, Copy, Share2, ShieldAlert, Check, Upload, Scale, BookOpen, Eye } from 'lucide-react'

export function ProfilePage() {
  const { t } = useTranslation()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { theme, followSystem, setFollowSystem, toggleTheme } = useTheme()
  const { wallet, openWalletModal } = useUserWallet()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Account actions state
  const [showAccountActionModal, setShowAccountActionModal] = useState(false)
  const [accountActionType, setAccountActionType] = useState<'archive' | 'deactivate' | 'delete' | null>(null)
  const [actionExecuting, setActionExecuting] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(false)

  // Inviting friends state
  const [inviteCopied, setInviteCopied] = useState<string | null>(null)

  // KYC Modal State
  const [showKycModal, setShowKycModal] = useState(false)
  const [kycFullName, setKycFullName] = useState(profile?.full_name || '')
  const [kycPhone, setKycPhone] = useState(profile?.phone || '')
  const [kycDocType, setKycDocType] = useState('cni')
  const [kycDocBase64, setKycDocBase64] = useState<string | null>(null)
  const [kycUploading, setKycUploading] = useState(false)
  const [kycSubmitting, setKycSubmitting] = useState(false)
  const [kycError, setKycError] = useState<string | null>(null)
  const [kycSuccess, setKycSuccess] = useState(false)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setInviteCopied(key)
    setTimeout(() => setInviteCopied(null), 2000)
  }

  const handleAccountAction = async () => {
    if (!user || !accountActionType) return
    setActionExecuting(true)
    try {
      if (accountActionType === 'archive') {
        // Account archiving: Mark status, disable transactions
        await supabase.from('profiles').update({
          kyc_status: 'rejected', // Restrict actions
        }).eq('id', user.id)
      } else if (accountActionType === 'deactivate') {
        // Account deactivation: rename and flag
        await supabase.from('profiles').update({
          full_name: profile?.full_name + ' (Désactivé)',
        }).eq('id', user.id)
      } else if (accountActionType === 'delete') {
        // Permanent deletion of user account
        await supabase.from('profiles').delete().eq('id', user.id)
      }
      
      setActionSuccess(true)
      setTimeout(async () => {
        setShowAccountActionModal(false)
        setActionSuccess(false)
        if (accountActionType === 'delete' || accountActionType === 'deactivate') {
          await signOut()
          navigate('/')
        } else {
          await refreshProfile()
        }
      }, 2500)
    } catch (err) {
      console.error('Account management error:', err)
    } finally {
      setActionExecuting(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setSaving(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64String = event.target?.result as string
        await supabase.from('profiles').update({
          avatar_url: base64String
        }).eq('id', user.id)
        setAvatarUrl(base64String)
        await refreshProfile()
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error uploading profile picture:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleKycDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setKycUploading(true)
    setKycError(null)
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        setKycDocBase64(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setKycError("Erreur lors de la lecture du document.")
    } finally {
      setKycUploading(false)
    }
  }

  const handleKycSubmit = async () => {
    if (!user || !kycFullName || !kycPhone || !kycDocBase64) return
    setKycSubmitting(true)
    setKycError(null)
    try {
      await supabase.from('profiles').update({
        full_name: kycFullName,
        phone: kycPhone,
        id_document_url: kycDocBase64,
        kyc_status: 'verified',
        kyc_verified_at: new Date().toISOString(),
      }).eq('id', user.id)

      await refreshProfile()
      setKycSuccess(true)
      setTimeout(() => {
        setShowKycModal(false)
        setKycSuccess(false)
      }, 2000)
    } catch (err) {
      setKycError("Erreur lors de la soumission de la vérification.")
    } finally {
      setKycSubmitting(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await supabase.from('profiles').update({
        full_name: fullName, phone,
        preferred_language: i18n.language as 'fr' | 'en',
        avatar_url: avatarUrl || null,
      }).eq('id', user.id)
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  if (!user) { navigate('/login'); return null }

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

        {/* Subtle static, abstract decoration pattern */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '150px',
          height: '150px',
          opacity: 0.05,
          pointerEvents: 'none',
          backgroundImage: `url("${getEkangPatternSvg('var(--color-primary)')}")`,
          backgroundSize: 'cover',
          borderRadius: '50%',
          border: '1.5px solid var(--color-primary)',
          animation: 'spin 30s linear infinite',
          zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--color-text)' }}>{t('nav.profile')}</h1>

        <Card style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {/* Real profile photo uploader: click anywhere on the avatar to change it */}
          <label 
            style={{ 
              position: 'relative', 
              width: '96px', 
              height: '96px', 
              margin: '0 auto', 
              display: 'block', 
              cursor: 'pointer',
              transition: 'transform 150ms ease',
            }} 
            title="Changer de photo de profil"
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Photo de profil" 
                style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3.5px solid var(--color-primary)', boxShadow: 'var(--shadow-md)' }} 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 700,
                border: '3px solid var(--color-card)',
                boxShadow: 'var(--shadow-lg)',
              }}>
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              style={{ display: 'none' }} 
            />
          </label>

          <div>
            <h2 style={{ fontSize: '18px', color: 'var(--color-text)', fontWeight: 700 }}>{profile?.full_name}</h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>ID: {user.id.substring(0, 8)}</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
            <Badge variant={profile?.kyc_status === 'verified' ? 'success' : profile?.kyc_status === 'pending' ? 'warning' : 'error'}>
              <ShieldCheck size={12} /> {t(`kyc.status.${profile?.kyc_status || 'pending'}`)}
            </Badge>
            {profile?.kyc_status !== 'verified' && (
              <Button size="sm" variant="primary" style={{ minHeight: '24px', padding: '1px 8px', fontSize: '11px', borderRadius: '4px' }} onClick={() => setShowKycModal(true)}>
                Vérifier
              </Button>
            )}
          </div>
        </Card>

        {/* KYC Verification Requirement Banner */}
        {profile?.kyc_status !== 'verified' && (
          <Card style={{ border: '1px dashed var(--color-warning)', background: 'rgba(255, 115, 0, 0.05)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <ShieldAlert size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>Vérification d'identité (KYC) requise</h4>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Pour vous conformer à la réglementation de la CEMAC et de la COBAC, et sécuriser les transactions de tontines, vous devez soumettre une pièce d'identité valide (CNI ou Passeport).
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowKycModal(true)} style={{ alignSelf: 'flex-start' }}>
              <ShieldCheck size={14} /> Passer la vérification KYC
            </Button>
          </Card>
        )}

        {/* Mon Portefeuille Indicatif */}
        <Card
          style={{
            background: 'rgba(200, 150, 62, 0.06)',
            border: '1px solid rgba(200, 150, 62, 0.35)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
                AS-WALLET
              </h3>
            </div>
            <Badge variant="primary">FCFA (XAF)</Badge>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Solde disponible AS-WALLET</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
              {formatXAF(wallet?.cached_balance || 0)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px', fontSize: '12px' }}>
            <div style={{ background: 'var(--color-card)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', marginBottom: '2px' }}>Total cotisé</div>
              <div style={{ fontWeight: 600 }}>{formatXAF(wallet?.total_contributed || 0)}</div>
            </div>
            <div style={{ background: 'var(--color-card)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', marginBottom: '2px' }}>Total reçu</div>
              <div style={{ fontWeight: 600, color: '#047857' }}>{formatXAF(wallet?.total_received || 0)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="primary" fullWidth onClick={() => openWalletModal('topup')}>
              <ArrowDownLeft size={15} /> Recharger
            </Button>
            <Button size="sm" variant="outline" fullWidth onClick={() => openWalletModal('withdraw')}>
              <ArrowUpRight size={15} /> Retirer
            </Button>
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: '15px', color: 'var(--color-text)', fontWeight: 700, marginBottom: '16px' }}>{t('common.edit')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input id="profile-name-input" label={t('auth.fullName')} value={fullName} onChange={setFullName} aria-label="Nom complet de l'utilisateur" />
            <Input id="profile-phone-input" label={t('auth.phone')} value={phone} onChange={setPhone} aria-label="Téléphone de l'utilisateur" />
            <Select id="profile-lang-select" label="Langue d'affichage" value={i18n.language} onChange={(v) => i18n.changeLanguage(v)} options={[
              { value: 'fr', label: 'Français' },
              { value: 'en', label: 'English' },
            ]} aria-label="Langue de l'application" />
            <Button onClick={handleSave} loading={saving} fullWidth aria-label="Enregistrer les modifications de profil">
              {saved ? t('common.success') : t('common.save')}
            </Button>
          </div>
        </Card>

        {/* Invite Friends Predefined Messages */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={18} color="var(--color-primary)" />
            Inviter des proches
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Faites grandir votre communauté ! Copiez l'un des messages préparés ci-dessous pour l'envoyer à vos amis.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              {
                key: 'whatsapp',
                label: 'WhatsApp (Pidgin & Chaleur)',
                msg: `Akié! Rejoins mon association sur l'appli AssoMboa pour qu'on gère nos tontines sans histoires. C'est fiable, sécurisé et 100% transparent ! Réf: CAM-237. Télécharge ici: https://assomboa.com`,
                color: '#25D366'
              },
              {
                key: 'sms',
                label: 'SMS classique',
                msg: `Salut, rejoins-moi sur l'application AssoMboa pour suivre nos réunions et cotisations de tontine en temps réel. Télécharge ici : https://assomboa.com`,
                color: '#007AFF'
              },
              {
                key: 'email',
                label: 'E-mail formel',
                msg: `Bonjour, je vous invite à rejoindre notre association sur AssoMboa, la plateforme de référence pour la gestion numérique des tontines au Cameroun. Inscription rapide sur : https://assomboa.com`,
                color: '#EA4335'
              }
            ].map((item) => (
              <div key={item.key} style={{ background: 'var(--color-sand)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: item.color }}>{item.label}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    style={{ minHeight: '28px', padding: '2px 10px', fontSize: '11px', borderRadius: '9999px' }} 
                    onClick={() => copyToClipboard(item.msg, item.key)}
                    aria-label={`Copier le message d'invitation pour ${item.label}`}
                  >
                    {inviteCopied === item.key ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
                    {inviteCopied === item.key ? 'Copié' : 'Copier'}
                  </Button>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, fontStyle: 'italic', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                  "{item.msg}"
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Account Security Management */}
        <Card style={{ border: '1px solid rgba(220, 38, 38, 0.2)', background: 'rgba(220, 38, 38, 0.02)', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-error)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} />
            Espace Sécurité & Gestion de Compte
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Prenez le contrôle de vos données. Choisissez entre la suspension temporaire ou le retrait définitif de la plateforme AssoMboa.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                type: 'archive',
                title: 'Archiver le compte',
                desc: 'Gèle temporairement vos tontines et transactions sans supprimer vos historiques pour vos associations.',
                icon: <Archive size={16} />,
                variant: 'outline' as const
              },
              {
                type: 'deactivate',
                title: 'Désactiver le compte',
                desc: 'Rend votre profil invisible et suspend votre participation active. Envoie un signal de secours aux présidents.',
                icon: <UserX size={16} />,
                variant: 'outline' as const
              },
              {
                type: 'delete',
                title: 'Supprimer définitivement',
                desc: 'Efface définitivement toutes vos données d\'AssoMboa conformément au RGPD. Action irréversible.',
                icon: <Trash2 size={16} />,
                variant: 'danger' as const
              }
            ].map((act) => (
              <div key={act.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0' }}>{act.title}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>{act.desc}</p>
                </div>
                <Button 
                  size="sm" 
                  variant={act.variant} 
                  style={{ fontSize: '11px', minHeight: '32px', padding: '4px 10px', flexShrink: 0 }}
                  onClick={() => {
                    setAccountActionType(act.type as 'archive' | 'deactivate' | 'delete')
                    setShowAccountActionModal(true)
                  }}
                  aria-label={`Déclencher l'action ${act.title}`}
                >
                  {act.icon}
                  Action
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              <Mail size={16} /> {user.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              <Phone size={16} /> {profile?.phone || '—'}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>Thème automatique</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Suivre les préférences système</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={followSystem}
                  onChange={(e) => setFollowSystem(e.target.checked)}
                  style={{
                    width: '38px',
                    height: '20px',
                    borderRadius: '9999px',
                    appearance: 'none',
                    background: followSystem ? 'var(--color-primary)' : 'var(--color-border)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 200ms ease',
                    outline: 'none',
                  }}
                  aria-label="Bascule pour le thème automatique"
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: followSystem ? '20px' : '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    transition: 'left 200ms ease',
                    pointerEvents: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </label>
            </div>

            <div style={{ height: '1px', background: 'var(--color-border)', opacity: 0.5 }} />

            <button onClick={toggleTheme} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
              background: 'var(--color-sand)', borderRadius: 'var(--radius-md)', border: 'none',
              cursor: 'pointer', color: 'var(--color-text)', fontSize: '14px', width: '100%',
              opacity: followSystem ? 0.6 : 1,
              transition: 'opacity 200ms ease',
            }} aria-label="Changer le thème de l'application">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                <span>{theme === 'light' ? 'Mode sombre' : 'Mode clair'}</span>
                {followSystem && (
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    (Désactive le mode automatique)
                  </span>
                )}
              </div>
            </button>

            <button onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
              background: 'var(--color-sand)', borderRadius: 'var(--radius-md)', border: 'none',
              cursor: 'pointer', color: 'var(--color-text)', fontSize: '14px', width: '100%',
            }} aria-label="Changer la langue de l'application">
              <Globe size={18} />
              {i18n.language === 'fr' ? 'English' : 'Français'}
            </button>

            <button onClick={() => navigate('/cgu')} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
              background: 'var(--color-sand)', borderRadius: 'var(--radius-md)', border: 'none',
              cursor: 'pointer', color: 'var(--color-text)', fontSize: '14px', width: '100%',
              marginTop: '4px'
            }} aria-label="Consulter les Conditions Générales d'Utilisation">
              <Scale size={18} color="var(--color-primary)" />
              Conditions Générales (CGU)
            </button>

            <button onClick={() => navigate('/mentions-legales')} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
              background: 'var(--color-sand)', borderRadius: 'var(--radius-md)', border: 'none',
              cursor: 'pointer', color: 'var(--color-text)', fontSize: '14px', width: '100%',
              marginTop: '4px'
            }} aria-label="Consulter les Mentions Légales">
              <BookOpen size={18} color="var(--color-primary)" />
              Mentions Légales
            </button>

            <button onClick={() => navigate('/politique-confidentialite')} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
              background: 'var(--color-sand)', borderRadius: 'var(--radius-md)', border: 'none',
              cursor: 'pointer', color: 'var(--color-text)', fontSize: '14px', width: '100%',
              marginTop: '4px'
            }} aria-label="Consulter la Politique de confidentialité">
              <Eye size={18} color="var(--color-primary)" />
              Politique de confidentialité
            </button>
          </div>
        </Card>



        <Button variant="danger" fullWidth onClick={handleLogout} aria-label="Se déconnecter de l'application">
          <LogOut size={16} /> {t('auth.logout')}
        </Button>
        </div>
      </div>

      {/* KYC Verification Wizard Modal */}
      <Modal open={showKycModal} onClose={() => !kycSubmitting && setShowKycModal(false)} title="Vérification d'identité (KYC)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
            Veuillez remplir vos informations officielles telles qu'elles apparaissent sur votre document d'identité national afin de valider instantanément votre compte.
          </p>

          <Input 
            id="kyc-modal-name"
            label="Nom Complet Officiel" 
            value={kycFullName} 
            onChange={setKycFullName} 
            required 
            aria-label="Nom complet pour le KYC" 
          />

          <Input 
            id="kyc-modal-phone"
            label="Numéro de Téléphone (Mobile Money)" 
            value={kycPhone} 
            onChange={setKycPhone} 
            required 
            aria-label="Numéro de téléphone pour le KYC" 
          />

          <Select 
            id="kyc-modal-doctype"
            label="Type de Document d'Identité" 
            value={kycDocType} 
            onChange={setKycDocType} 
            options={[
              { value: 'cni', label: 'Carte Nationale d\'Identité (CNI)' },
              { value: 'passport', label: 'Passeport' },
              { value: 'permit', label: 'Permis de conduire' },
            ]} 
            aria-label="Type de document pour le KYC" 
          />

          <div style={{
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            textAlign: 'center',
            background: 'var(--color-sand)',
            cursor: 'pointer',
            position: 'relative'
          }}>
            {kycDocBase64 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Check size={24} color="var(--color-success)" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>Document chargé avec succès !</span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Cliquez à nouveau pour remplacer</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Upload size={24} color="var(--color-text-muted)" />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Téléverser un scan du document d'identité</span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Format PNG, JPG ou PDF</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              onChange={handleKycDocUpload} 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }} 
            />
          </div>

          {kycError && (
            <div style={{ fontSize: '12px', color: 'var(--color-error)', fontWeight: 500 }}>
              {kycError}
            </div>
          )}

          {kycSuccess ? (
            <div style={{ textAlign: 'center', padding: '10px', color: 'var(--color-success)', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Check size={24} style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '4px', borderRadius: '50%' }} />
              Compte vérifié avec succès !
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <Button 
                variant="ghost" 
                fullWidth 
                disabled={kycSubmitting || kycUploading} 
                onClick={() => setShowKycModal(false)}
              >
                Annuler
              </Button>
              <Button 
                variant="primary" 
                fullWidth 
                loading={kycSubmitting} 
                disabled={kycUploading || !kycFullName || !kycPhone || !kycDocBase64} 
                onClick={handleKycSubmit}
              >
                Soumettre & Vérifier
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal 
        open={showAccountActionModal} 
        onClose={() => !actionExecuting && setShowAccountActionModal(false)} 
        title={`Confirmer l'action de compte`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1.5px solid var(--color-error)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: '13px', display: 'flex', gap: '10px' }}>
            <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-error)' }} />
            <div>
              <span style={{ fontWeight: 700, color: 'var(--color-error)' }}>Avertissement de Sécurité :</span>
              {accountActionType === 'archive' && " Archiver votre compte va bloquer toutes les nouvelles transactions financières dans AssoMboa. Vous pourrez le restaurer à tout moment."}
              {accountActionType === 'deactivate' && " Désactiver rend votre profil anonyme pour les autres membres. Les tontines actives vous concernant sont suspendues et vos administrateurs d'association seront notifiés."}
              {accountActionType === 'delete' && " Supprimer définitivement effacera toutes vos données personnelles de nos serveurs. Vos fonds restants sur AS-WALLET doivent être retirés au préalable."}
            </div>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--color-text)', margin: 0 }}>
            Êtes-vous absolument sûr de vouloir procéder à cette action ?
          </p>

          {actionSuccess ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-success)', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <Check size={32} style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '50%', color: 'var(--color-success)' }} />
              Action réalisée avec succès ! Redirection en cours...
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <Button 
                variant="ghost" 
                fullWidth 
                disabled={actionExecuting} 
                onClick={() => setShowAccountActionModal(false)}
                aria-label="Annuler l'action de compte"
              >
                Annuler
              </Button>
              <Button 
                variant={accountActionType === 'delete' ? 'danger' : 'primary'} 
                fullWidth 
                loading={actionExecuting} 
                onClick={handleAccountAction}
                aria-label="Confirmer définitivement l'action"
              >
                Confirmer
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </AppLayout>
  )
}
