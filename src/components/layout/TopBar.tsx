import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { MessageCircle, User as UserIcon, Sun, Moon, Globe, Wallet } from 'lucide-react'
import { useTheme } from '@/features/dashboard/theme-context'
import { useAuth } from '@/features/auth/auth-context'
import { useUserWallet } from '@/features/wallet/user-wallet-context'
import { useState, useRef, useEffect } from 'react'

export function TopBar() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { profile, signOut } = useAuth()
  const { openWalletModal } = useUserWallet()
  const [langOpen, setLangOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang)
    setLangOpen(false)
  }

  const navLinks = [
    { label: t('nav.home'), path: '/dashboard' },
    { label: t('nav.associations'), path: '/associations' },
    { label: t('nav.tontines'), path: '/tontines' },
    { label: t('nav.meetings'), path: '/meetings' },
    { label: t('nav.alerts'), path: '/alerts' },
  ]

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      background: 'var(--color-card)',
      borderBottom: '1px solid var(--color-border)',
      padding: '10px 16px',
      zIndex: 90,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        maxWidth: '1080px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        <div
          onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
        >
          <img 
            src="/logo.svg" 
            alt="AssoMboa Logo" 
            style={{ 
              width: '36px', 
              height: '36px', 
              objectFit: 'contain'
            }}
            referrerPolicy="no-referrer"
          />
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-text)',
          }}>
            AssoMboa
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" style={{ alignItems: 'center', gap: '4px' }}>
          {navLinks.map((link) => {
            const active = location.pathname.startsWith(link.path)
            return (
              <motion.button
                key={link.path}
                onClick={() => navigate(link.path)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: active ? 600 : 500,
                  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  background: active ? 'var(--color-primary-light)' : 'transparent',
                  transition: 'background 150ms ease, color 150ms ease',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                {link.label}
              </motion.button>
            )
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => navigate('/messaging')}
            aria-label="Messages"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-sand)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <MessageCircle size={20} />
          </button>

          <div ref={langRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              aria-label="Changer de langue"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-sand)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <Globe size={20} />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    background: 'var(--color-card)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--color-border)',
                    padding: '8px',
                    minWidth: '130px',
                    zIndex: 200,
                  }}
                >
                  <button
                    onClick={() => changeLang('fr')}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      background: i18n.language === 'fr' ? 'var(--color-primary-light)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: i18n.language === 'fr' ? 'var(--color-primary)' : 'var(--color-text)',
                      fontSize: '14px',
                      fontWeight: i18n.language === 'fr' ? 600 : 400,
                    }}
                  >
                    Français
                  </button>
                  <button
                    onClick={() => changeLang('en')}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      background: i18n.language === 'en' ? 'var(--color-primary-light)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: i18n.language === 'en' ? 'var(--color-primary)' : 'var(--color-text)',
                      fontSize: '14px',
                      fontWeight: i18n.language === 'en' ? 600 : 400,
                    }}
                  >
                    English
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Basculer le thème"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-sand)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu utilisateur"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-primary-light)',
                border: '1.5px solid var(--color-primary)',
                cursor: 'pointer',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '14px',
                overflow: 'hidden',
                padding: 0,
              }}
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                profile?.full_name?.charAt(0).toUpperCase() || <UserIcon size={18} />
              )}
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    background: 'var(--color-card)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--color-border)',
                    padding: '8px',
                    minWidth: '200px',
                    zIndex: 200,
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>
                      {profile?.full_name || 'User'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {profile?.phone}
                    </div>
                  </div>
                  <button
                    onClick={() => { openWalletModal('overview'); setMenuOpen(false) }}
                    style={{
                      display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--color-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  <Wallet size={16} />
                  <span>AS-WALLET</span>
                </button>
                <button
                  onClick={() => { navigate('/profile'); setMenuOpen(false) }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                  }}
                >
                  {t('nav.profile')}
                </button>
                <button
                  onClick={() => { signOut(); navigate('/'); setMenuOpen(false) }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--color-error)',
                    fontSize: '14px',
                  }}
                >
                  {t('auth.logout')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </header>
  )
}
