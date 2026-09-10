import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import { useTheme } from '@/features/dashboard/theme-context'
import { useUserWallet } from '@/features/wallet/user-wallet-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button, Card, Input, Badge, Select, Modal } from '@/components/ui'
import { getEkangPatternSvg, getNdopPatternSvg } from '@/components/ui/CameroonPattern'
import { formatXAF } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { ActivityLogSection } from './ActivityLogSection'
import { Mail, Phone, ShieldCheck, Sun, Moon, Globe, LogOut, Wallet, ArrowDownLeft, ArrowUpRight, Trash2, Archive, UserX, Copy, Share2, ShieldAlert, Check, Upload, Scale, BookOpen, Eye, ArrowLeft, ChevronRight, User, Lock, Settings, HelpCircle, PhoneCall } from 'lucide-react'

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
  const [bureauTitle, setBureauTitle] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBureauTitle() {
      if (!user) return
      try {
        // 1. Check if user is Altruiste / requested CEO
        if (user.email === 'altruiste2.0.4@gmail.com') {
          setBureauTitle('CEO AssoMboa')
          return
        }

        // 2. Otherwise query bureau assignments for this user
        const { data: assignments } = await supabase
          .from('bureau_assignments')
          .select('role, association_id')
          .eq('user_id', user.id)

        if (assignments && assignments.length > 0) {
          // Fetch association name for the first assignment
          const assocId = assignments[0].association_id
          const role = assignments[0].role
          const { data: assoc } = await supabase
            .from('associations')
            .select('name')
            .eq('id', assocId)
            .single()

          if (assoc) {
            const assocName = assoc.name
            let roleName = ''
            if (role === 'proprio') roleName = 'Président (Propriétaire)'
            else if (role === 'secretariat') roleName = 'Secrétaire'
            else if (role === 'tresorerie') roleName = 'Trésorier'
            else if (role === 'commission_comptes') roleName = 'Commissaire aux comptes'
            else roleName = role

            setBureauTitle(`${roleName} - ${assocName}`)
            return
          }
        }

        // 3. Alternatively check if they own an association
        const { data: ownedAssocs } = await supabase
          .from('associations')
          .select('name')
          .eq('owner_id', user.id)

        if (ownedAssocs && ownedAssocs.length > 0) {
          setBureauTitle(`Président - ${ownedAssocs[0].name}`)
          return
        }

        setBureauTitle(null)
      } catch (e) {
        console.error("Error fetching bureau title:", e)
      }
    }
    fetchBureauTitle()
  }, [user])

  // Settings subviews
  const [activeSubView, setActiveSubView] = useState<'main' | 'personal_info' | 'langue' | 'apparence' | 'actions' | 'securite'>('main')

  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)

  // 2FA State
  const [mfaEnabled, setMfaEnabled] = useState(() => localStorage.getItem('assomboa_2fa_enabled') === 'true')
  const [showMfaSetup, setShowMfaSetup] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState<string | null>(null)

  // Delete confirmation name state
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('')

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setInviteCopied(key)
    setTimeout(() => setInviteCopied(null), 2000)
  }

  const handlePasswordChange = async () => {
    setPasswordError(null)
    setPasswordSuccess(false)
    if (!newPassword || !confirmPassword) {
      setPasswordError("Veuillez remplir tous les champs du mot de passe.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas.")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit faire au moins 6 caractères.")
      return
    }
    setUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error(err)
      setPasswordError(err.message || "Erreur lors de la mise à jour du mot de passe.")
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handleMfaSetupConfirm = () => {
    setMfaError(null)
    if (mfaCode.trim().length !== 6) {
      setMfaError("Code de vérification invalide. Saisissez 6 chiffres.")
      return
    }
    localStorage.setItem('assomboa_2fa_enabled', 'true')
    setMfaEnabled(true)
    setShowMfaSetup(false)
    setMfaCode('')
  }

  const handleDisableMfa = () => {
    localStorage.removeItem('assomboa_2fa_enabled')
    setMfaEnabled(false)
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
      console.error(err)
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
      console.error(err)
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
          
          {/* Header with back button for subviews */}
          {activeSubView === 'main' ? (
            <h1 style={{ fontSize: '22px', color: 'var(--color-text)' }}>{t('nav.profile')}</h1>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0 10px 0' }}>
              <button 
                onClick={() => setActiveSubView('main')} 
                style={{ 
                  background: 'var(--color-primary-light)', 
                  border: 'none', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  color: 'var(--color-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'opacity 150ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                aria-label="Retourner au menu principal du profil"
              >
                <ArrowLeft size={16} /> Retour
              </button>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
                {activeSubView === 'personal_info' && "Informations personnelles"}
                {activeSubView === 'langue' && "Langue"}
                {activeSubView === 'apparence' && "Apparence"}
                {activeSubView === 'actions' && "Actions rapides"}
                {activeSubView === 'securite' && "Sécurité et connexion"}
              </h1>
            </div>
          )}

          {activeSubView === 'main' && (
            <>
              {/* User Bio Card */}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Badge variant={profile?.kyc_status === 'verified' ? 'success' : profile?.kyc_status === 'pending' ? 'warning' : 'error'}>
                      <ShieldCheck size={12} /> {t(`kyc.status.${profile?.kyc_status || 'pending'}`)}
                    </Badge>
                    {profile?.kyc_status !== 'verified' && (
                      <Button size="sm" variant="primary" style={{ minHeight: '24px', padding: '1px 8px', fontSize: '11px', borderRadius: '4px' }} onClick={() => setShowKycModal(true)}>
                        Vérifier
                      </Button>
                    )}
                  </div>
                  {bureauTitle && (
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      color: 'var(--color-primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      background: 'var(--color-primary-light)', 
                      padding: '4px 10px', 
                      borderRadius: 'var(--radius-sm)',
                      letterSpacing: '0.01em',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                      {bureauTitle}
                    </div>
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

              {/* Categorized Menus */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Paramètres du compte block */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>
                    Paramètres du compte
                  </h3>
                  <Card style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {[
                        { icon: <User size={18} />, title: "Informations personnelles", target: 'personal_info' as const },
                        { icon: <Globe size={18} />, title: "Langue", target: 'langue' as const },
                        { icon: <Eye size={18} />, title: "Apparence", target: 'apparence' as const },
                        { icon: <Settings size={18} />, title: "Actions rapides", target: 'actions' as const },
                        { icon: <Lock size={18} />, title: "Sécurité et connexion", target: 'securite' as const },
                      ].map((item, idx, arr) => (
                        <div key={item.target}>
                          <div 
                            onClick={() => setActiveSubView(item.target)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 16px',
                              cursor: 'pointer',
                              transition: 'background-color 150ms ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary-light)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(107, 114, 128, 0.08)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.icon}
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{item.title}</span>
                            </div>
                            <ChevronRight size={18} color="var(--color-text-secondary)" />
                          </div>
                          {idx < arr.length - 1 && <div style={{ height: '1px', background: 'var(--color-border)', margin: '0 16px', opacity: 0.5 }} />}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Obtenir de l'aide block */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>
                    Obtenir de l'aide
                  </h3>
                  <Card style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {/* FAQ Button */}
                      <div 
                        onClick={() => navigate('/faq')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                          cursor: 'pointer',
                          transition: 'background-color 150ms ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary-light)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(107, 114, 128, 0.08)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <HelpCircle size={18} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>Consulter la FAQ</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Foire aux questions dynamique & interactive</span>
                          </div>
                        </div>
                        <ChevronRight size={18} color="var(--color-text-secondary)" />
                      </div>

                      <div style={{ height: '1px', background: 'var(--color-border)', margin: '0 16px', opacity: 0.5 }} />

                      {/* Help Manual Button */}
                      <div 
                        onClick={() => navigate('/aide')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                          cursor: 'pointer',
                          transition: 'background-color 150ms ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary-light)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(107, 114, 128, 0.08)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BookOpen size={18} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>Manuel complet d'utilisation</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Guides exhaustifs de toutes les fonctionnalités</span>
                          </div>
                        </div>
                        <ChevronRight size={18} color="var(--color-text-secondary)" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Nous trouver block */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>
                    Nous trouver
                  </h3>
                  <Card style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(107, 114, 128, 0.08)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PhoneCall size={18} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>Nous contacter</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>care-assomboa@outlook.com | +237 679 293 824</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ height: '1px', background: 'var(--color-border)', margin: '0 16px', opacity: 0.5 }} />

                      <div 
                        style={{
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(107, 114, 128, 0.08)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Share2 size={18} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>Suivez-nous</span>
                          </div>
                        </div>

                        {/* Social network list with real branded monochrome favicons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px', paddingLeft: '48px' }}>
                          {/* Facebook */}
                          <a 
                            href="https://facebook.com" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title="Facebook : AssoMboa App"
                            style={{ 
                              color: 'var(--color-text-secondary)',
                              display: 'inline-flex',
                              transition: 'color 150ms ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                          >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ flexShrink: 0 }}>
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </a>

                          {/* Instagram */}
                          <a 
                            href="https://instagram.com" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title="Instagram : AssoMboa App"
                            style={{ 
                              color: 'var(--color-text-secondary)',
                              display: 'inline-flex',
                              transition: 'color 150ms ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                          >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ flexShrink: 0 }}>
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                            </svg>
                          </a>

                          {/* TikTok */}
                          <a 
                            href="https://tiktok.com" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title="TikTok : AssoMboa Live"
                            style={{ 
                              color: 'var(--color-text-secondary)',
                              display: 'inline-flex',
                              transition: 'color 150ms ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                          >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ flexShrink: 0 }}>
                              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.95.17 1.92.3 2.89.3v3.91a11.13 11.13 0 01-4.43-1.12c-.03 2.21-.01 4.43-.02 6.64-.13 3.42-2.82 6.16-6.21 6.06-3.41-.12-6.04-3.03-5.75-6.43.23-2.66 2.37-4.78 5.03-4.88v4.01c-1.07.13-1.8 1.11-1.6 2.16.16.85.91 1.46 1.77 1.4 1.17-.08 1.95-1.17 1.84-2.32V0c1.01.02 2.01.01 3.02.02z"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Mentions légales block */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>
                    Mentions légales
                  </h3>
                  <Card style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {[
                        { title: "Conditions Générales (CGU)", icon: <Scale size={18} />, action: () => navigate('/cgu') },
                        { title: "Mentions Légales", icon: <BookOpen size={18} />, action: () => navigate('/mentions-legales') },
                        { title: "Politique de confidentialité", icon: <Eye size={18} />, action: () => navigate('/politique-confidentialite') },
                      ].map((item, idx, arr) => (
                        <div key={item.title}>
                          <div 
                            onClick={item.action}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 16px',
                              cursor: 'pointer',
                              transition: 'background-color 150ms ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary-light)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(107, 114, 128, 0.08)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.icon}
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{item.title}</span>
                            </div>
                            <ChevronRight size={18} color="var(--color-text-secondary)" />
                          </div>
                          {idx < arr.length - 1 && <div style={{ height: '1px', background: 'var(--color-border)', margin: '0 16px', opacity: 0.5 }} />}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Logout option directly as a beautiful card row */}
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                  <div 
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'background-color 150ms ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LogOut size={18} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#EF4444' }}>Se déconnecter</span>
                    </div>
                    <ChevronRight size={18} color="#EF4444" style={{ opacity: 0.7 }} />
                  </div>
                </Card>

                {/* Footer Section */}
                <div style={{ textAlign: 'center', padding: '10px 0 20px 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  <div>VERSION 1.0.0</div>
                  <div style={{ marginTop: '2px' }}>&copy; AssoMboa. Tous droits réservés.</div>
                </div>

              </div>
            </>
          )}

          {/* SUBVIEW: Informations personnelles */}
          {activeSubView === 'personal_info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Card>
                <h3 style={{ fontSize: '15px', color: 'var(--color-text)', fontWeight: 700, marginBottom: '16px' }}>Modifier le profil</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Input id="profile-name-input" label={t('auth.fullName')} value={fullName} onChange={setFullName} aria-label="Nom complet de l'utilisateur" />
                  <Input id="profile-phone-input" label={t('auth.phone')} value={phone} onChange={setPhone} aria-label="Téléphone de l'utilisateur" />
                  <Button onClick={handleSave} loading={saving} fullWidth aria-label="Enregistrer les modifications de profil">
                    {saved ? t('common.success') : t('common.save')}
                  </Button>
                </div>
              </Card>

              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    <Mail size={16} /> <span style={{ fontWeight: 500 }}>{user.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    <Phone size={16} /> <span style={{ fontWeight: 500 }}>{profile?.phone || '—'}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* SUBVIEW: Langue */}
          {activeSubView === 'langue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 16px 10px 16px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Sélectionnez votre langue</h2>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', marginBottom: 0 }}>
                    Sélectionnez votre langue préférée pour l'interface de AssoMboa.
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    { label: "Par défaut (Système)", key: 'system' as const },
                    { label: "Français", key: 'fr' as const },
                    { label: "English", key: 'en' as const },
                  ].map((option) => {
                    const isSelected = option.key === 'system' 
                      ? i18n.language !== 'fr' && i18n.language !== 'en'
                      : i18n.language === option.key;

                    return (
                      <div 
                        key={option.key}
                        onClick={() => {
                          if (option.key !== 'system') {
                            i18n.changeLanguage(option.key);
                          } else {
                            // Reset or choose user language
                            const sysLang = navigator.language.startsWith('en') ? 'en' : 'fr';
                            i18n.changeLanguage(sysLang);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          cursor: 'pointer',
                          borderTop: '1px solid var(--color-border)',
                          transition: 'background-color 150ms ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary-light)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                          {option.label}
                        </span>
                        
                        {/* Custom Radio Dot exactly like model */}
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 150ms ease'
                        }}>
                          {isSelected && (
                            <div style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-primary)'
                            }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* SUBVIEW: Apparence */}
          {activeSubView === 'apparence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Card>
                <h3 style={{ fontSize: '15px', color: 'var(--color-text)', fontWeight: 700, margin: 0 }}>Thème de l'application</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', marginBottom: '16px' }}>
                  Si "Système" est sélectionné, l'application AssoMboa adoptera le mode clair ou sombre de votre téléphone.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' }}>
                  {/* Système */}
                  <div 
                    onClick={() => {
                      setFollowSystem(true);
                    }}
                    style={{
                      border: followSystem ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'var(--color-card)',
                      boxShadow: followSystem ? '0 4px 12px rgba(20, 83, 45, 0.08)' : 'none',
                      transition: 'all 150ms ease'
                    }}
                  >
                    {/* Abstract dual color split preview */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'linear-gradient(135deg, #F3F4F6 50%, #1F2937 50%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--color-border)',
                    }}>
                      <Settings size={18} color={theme === 'light' ? '#4B5563' : '#F3F4F6'} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
                      Système
                    </span>
                    {/* Radio dot */}
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: `2px solid ${followSystem ? 'var(--color-primary)' : 'var(--color-text-secondary)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {followSystem && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                      )}
                    </div>
                  </div>

                  {/* Clair */}
                  <div 
                    onClick={() => {
                      setFollowSystem(false);
                      if (theme !== 'light') {
                        toggleTheme();
                      }
                    }}
                    style={{
                      border: (!followSystem && theme === 'light') ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'var(--color-card)',
                      boxShadow: (!followSystem && theme === 'light') ? '0 4px 12px rgba(20, 83, 45, 0.08)' : 'none',
                      transition: 'all 150ms ease'
                    }}
                  >
                    {/* Bright sun preview */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#F9FAFB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--color-border)',
                    }}>
                      <Sun size={20} color="#F59E0B" />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
                      Clair
                    </span>
                    {/* Radio dot */}
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: `2px solid ${(!followSystem && theme === 'light') ? 'var(--color-primary)' : 'var(--color-text-secondary)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {!followSystem && theme === 'light' && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                      )}
                    </div>
                  </div>

                  {/* Sombre */}
                  <div 
                    onClick={() => {
                      setFollowSystem(false);
                      if (theme !== 'dark') {
                        toggleTheme();
                      }
                    }}
                    style={{
                      border: (!followSystem && theme === 'dark') ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'var(--color-card)',
                      boxShadow: (!followSystem && theme === 'dark') ? '0 4px 12px rgba(20, 83, 45, 0.08)' : 'none',
                      transition: 'all 150ms ease'
                    }}
                  >
                    {/* Dark moon preview */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#1F2937',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--color-border)',
                    }}>
                      <Moon size={20} color="#6366F1" />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
                      Sombre
                    </span>
                    {/* Radio dot */}
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: `2px solid ${(!followSystem && theme === 'dark') ? 'var(--color-primary)' : 'var(--color-text-secondary)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {!followSystem && theme === 'dark' && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                      )}
                    </div>
                  </div>
                </div>

              </Card>
            </div>
          )}

          {/* SUBVIEW: Actions rapides */}
          {activeSubView === 'actions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            </div>
          )}

          {/* SUBVIEW: Sécurité et connexion */}
          {activeSubView === 'securite' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* SECTION 1: GESTION DE LA CONNEXION */}
              <Card style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                  <Lock size={18} color="var(--color-primary)" />
                  1. Gestion de la Connexion
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Password Modifier Sub-section */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>Modifier le mot de passe</h4>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                      Pour des raisons de sécurité, utilisez un mot de passe fort combinant des lettres, chiffres et caractères spéciaux.
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <Input 
                        id="new-password"
                        label="Nouveau mot de passe"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={setNewPassword}
                        required
                      />
                      <Input 
                        id="confirm-password"
                        label="Confirmer le nouveau mot de passe"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        required
                      />
                    </div>

                    {passwordError && (
                      <div style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: 500, marginBottom: '10px' }}>
                        ⚠️ {passwordError}
                      </div>
                    )}

                    {passwordSuccess && (
                      <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 500, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Votre mot de passe a été mis à jour avec succès.
                      </div>
                    )}

                    <Button 
                      size="sm"
                      variant="primary"
                      onClick={handlePasswordChange}
                      loading={updatingPassword}
                      disabled={!newPassword || !confirmPassword}
                    >
                      Mettre à jour le mot de passe
                    </Button>
                  </div>

                  {/* 2FA Sub-section */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>Double authentification (2FA par facteur)</h4>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                      Ajoutez une couche de sécurité supplémentaire à votre compte en exigeant un code de vérification à chaque connexion.
                    </p>

                    {mfaEnabled ? (
                      <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }}></span>
                            Double authentification active
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Sécurisé via authentificateur d'application tiers.</div>
                        </div>
                        <Button size="sm" variant="outline" style={{ color: 'var(--color-error)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={handleDisableMfa}>
                          Désactiver la 2FA
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ background: 'rgba(107, 114, 128, 0.04)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-text-muted)' }}></span>
                              Double authentification inactive
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Activez pour protéger votre AS-WALLET contre les accès non autorisés.</div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => setShowMfaSetup(true)}>
                            Activer la 2FA
                          </Button>
                        </div>

                        {showMfaSetup && (
                          <div style={{ background: 'var(--color-sand)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 150ms ease' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>Configurer la double authentification</span>
                            <ol style={{ fontSize: '11px', color: 'var(--color-text-secondary)', paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <li>Scannez le QR Code temporaire avec Google Authenticator ou Duo Mobile.</li>
                              <li>Saisissez le code à 6 chiffres généré par votre application pour valider la liaison.</li>
                            </ol>
                            
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#FFFFFF', padding: '12px', borderRadius: 'var(--radius-sm)', width: 'fit-content', border: '1px solid var(--color-border)' }}>
                              <div style={{ width: '80px', height: '80px', background: '#000', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', border: '4px solid white' }}>
                                <div style={{ background: 'white' }}></div><div style={{ background: 'black' }}></div><div style={{ background: 'white' }}></div><div style={{ background: 'black' }}></div>
                                <div style={{ background: 'black' }}></div><div style={{ background: 'white' }}></div><div style={{ background: 'black' }}></div><div style={{ background: 'white' }}></div>
                                <div style={{ background: 'white' }}></div><div style={{ background: 'black' }}></div><div style={{ background: 'white' }}></div><div style={{ background: 'black' }}></div>
                                <div style={{ background: 'black' }}></div><div style={{ background: 'white' }}></div><div style={{ background: 'black' }}></div><div style={{ background: 'white' }}></div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ fontSize: '10px', color: '#4B5563', fontFamily: 'monospace' }}>Clé secrète: ASSOMBOA2FAKEY</span>
                                <Input 
                                  id="mfa-code"
                                  label="Saisir le code à 6 chiffres"
                                  placeholder="123456"
                                  value={mfaCode}
                                  onChange={setMfaCode}
                                />
                              </div>
                            </div>

                            {mfaError && (
                              <div style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: 500 }}>
                                ⚠️ {mfaError}
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Button size="sm" variant="outline" onClick={() => setShowMfaSetup(false)}>Annuler</Button>
                              <Button size="sm" variant="primary" onClick={handleMfaSetupConfirm} disabled={!mfaCode}>Confirmer la liaison</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* SECTION 2: JOURNAL D'ACTIVITÉ */}
              <ActivityLogSection 
                userId={user?.id} 
                onJumpToPassword={() => {
                  const el = document.getElementById('new-password')
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    el.focus()
                  }
                }}
              />

              {/* SECTION 3: ZONE DE SÉCURITÉ */}
              <Card style={{ border: '1px solid rgba(220, 38, 38, 0.2)', background: 'rgba(220, 38, 38, 0.01)', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-error)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(220, 38, 38, 0.15)', paddingBottom: '8px' }}>
                  <ShieldAlert size={18} color="var(--color-error)" />
                  3. Zone de Sécurité
                </h3>
                
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                  Gérez la confidentialité et le retrait de votre compte de la plateforme. Veuillez lire attentivement les conséquences de chaque action proposée.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* ARCHIVE COMPTE */}
                  <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Archive size={16} color="var(--color-text-secondary)" />
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Archiver mes informations</h4>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                      Archiver vos données gèle temporairement vos tontines et transactions de manière sécurisée sans détruire votre historique d'association. Cela vous permet de faire une pause tout en préservant l'historique de vos cotisations pour le groupe. Vous pouvez réactiver votre compte à tout moment.
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      style={{ width: 'fit-content', fontSize: '11px' }}
                      onClick={() => {
                        setAccountActionType('archive')
                        setShowAccountActionModal(true)
                      }}
                    >
                      Archiver mes informations
                    </Button>
                  </div>

                  {/* DESACTIVER COMPTE */}
                  <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserX size={16} color="var(--color-text-secondary)" />
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Désactiver mon compte</h4>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                      Désactiver votre compte rend votre profil anonyme et suspend votre participation active. Vos informations et profils sont cachés des autres membres. Les administrateurs de vos associations seront informés de cette suspension temporaire. Vous ne recevrez plus de notifications de relance de cotisation de tontine.
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      style={{ width: 'fit-content', fontSize: '11px' }}
                      onClick={() => {
                        setAccountActionType('deactivate')
                        setShowAccountActionModal(true)
                      }}
                    >
                      Désactiver mon compte
                    </Button>
                  </div>

                  {/* SUPPRIMER COMPTE (STYLE GITHUB) */}
                  <div style={{ background: 'rgba(239, 68, 68, 0.02)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Trash2 size={16} color="var(--color-error)" />
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-error)', margin: 0 }}>Supprimer définitivement</h4>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                      La suppression est définitive et détruit irréversiblement toutes vos données personnelles, historiques de tontines, cotisations passées et accès à AssoMboa. Cette action est irréversible et aucune récupération ne sera possible. Veuillez vous assurer d'avoir retiré tous vos fonds actifs de votre AS-WALLET avant de procéder.
                    </p>
                    
                    <div style={{ borderTop: '1px solid rgba(239, 68, 68, 0.15)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label htmlFor="confirm-delete-name" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text)' }}>
                        Pour confirmer, saisissez exactement votre nom : <strong style={{ textDecoration: 'underline', color: 'var(--color-error)' }}>{profile?.full_name || 'Utilisateur'}</strong>
                      </label>
                      
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input 
                          id="confirm-delete-name"
                          type="text"
                          placeholder="Saisissez votre nom officiel ici"
                          value={deleteConfirmationName}
                          onChange={(e) => setDeleteConfirmationName(e.target.value)}
                          style={{
                            flex: 1,
                            fontSize: '12px',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1.5px solid rgba(239, 68, 68, 0.25)',
                            background: 'var(--color-card)',
                            color: 'var(--color-text)',
                            outline: 'none',
                            transition: 'border-color 150ms ease'
                          }}
                        />
                        <Button 
                          size="sm" 
                          variant="danger"
                          disabled={deleteConfirmationName !== (profile?.full_name || '')}
                          onClick={() => {
                            setAccountActionType('delete')
                            setShowAccountActionModal(true)
                          }}
                          style={{ fontSize: '11px', opacity: deleteConfirmationName !== (profile?.full_name || '') ? 0.5 : 1 }}
                        >
                          Supprimer mon compte
                        </Button>
                      </div>
                    </div>
                  </div>

                </div>
              </Card>
            </div>
          )}

          {/* SUBVIEW: Consulter la FAQ */}


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
