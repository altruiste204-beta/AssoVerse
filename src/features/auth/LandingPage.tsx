import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { useTheme } from '@/features/dashboard/theme-context'
import { motion } from 'motion/react'
import {
  Users, HandCoins, ShieldCheck, Heart, TrendingUp, Scale,
  Globe, Sun, Moon, ArrowRight, Building2, BookOpen, Eye,
} from 'lucide-react'

export function LandingPage() {
  const { t } = useTranslation()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const features = [
    { icon: Users, title: t('landing.feature1.title'), desc: t('landing.feature1.desc') },
    { icon: HandCoins, title: t('landing.feature2.title'), desc: t('landing.feature2.desc') },
    { icon: ShieldCheck, title: t('landing.feature3.title'), desc: t('landing.feature3.desc') },
    { icon: Heart, title: t('landing.feature4.title'), desc: t('landing.feature4.desc') },
    { icon: TrendingUp, title: t('landing.feature5.title'), desc: t('landing.feature5.desc') },
    { icon: Scale, title: t('landing.feature6.title'), desc: t('landing.feature6.desc') },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative', overflowX: 'hidden' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--color-card)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/logo.png" 
            alt="AssoMboa Logo" 
            style={{ 
              width: '42px', 
              height: '42px', 
              objectFit: 'contain',
              borderRadius: '8px',
            }}
            referrerPolicy="no-referrer"
          />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
            AssoMboa
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--color-border)',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
            }}
          >
            <Globe size={16} />
          </button>
          <button
            onClick={toggleTheme}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--color-border)',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
            }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
            {t('landing.login')}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '64px 24px 48px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: 'var(--color-primary-light)',
            borderRadius: '9999px',
            marginBottom: '24px',
          }}
        >
          <Building2 size={14} color="var(--color-primary)" />
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-primary)' }}>
            {t('landing.tagline')}
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            fontSize: 'clamp(32px, 6vw, 52px)',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: '16px',
            lineHeight: 1.1,
          }}
        >
          {t('landing.title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{
            fontSize: '18px',
            color: 'var(--color-text-muted)',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}
        >
          {t('landing.description')}
        </motion.p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Button size="lg" onClick={() => navigate('/signup')} style={{ borderRadius: '9999px', padding: '14px 32px' }}>
              {t('landing.getStarted')}
              <ArrowRight size={18} />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Button variant="outline" size="lg" onClick={() => navigate('/login')} style={{ borderRadius: '9999px', padding: '14px 32px' }}>
              {t('landing.login')}
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* No funds banner */}
      <section style={{
        maxWidth: '800px',
        margin: '0 auto 64px',
        padding: '0 24px',
      }}>
        <div style={{
          background: 'var(--color-primary)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ShieldCheck size={28} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h3 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '4px' }}>
              {t('landing.noFunds.title')}
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
              {t('landing.noFunds.desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 24px 80px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          {features.map((feat, i) => {
            const Icon = feat.icon
            return (
              <div
                key={i}
                className="animate-slide-up"
                style={{
                  background: 'var(--color-card)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 250ms ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  <Icon size={24} color="var(--color-primary)" />
                </div>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--color-text)' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {feat.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 24px 80px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', color: 'var(--color-text)', marginBottom: '12px' }}>
          {t('landing.tagline')}
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          {t('landing.description')}
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          style={{ display: 'inline-block' }}
        >
          <Button size="lg" onClick={() => navigate('/signup')} style={{ borderRadius: '9999px', padding: '14px 32px' }}>
            {t('landing.getStarted')}
            <ArrowRight size={18} />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--color-card)',
        borderTop: '1px solid var(--color-border)',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={14} /> AssoMboa
          </span>
          <button
            onClick={() => navigate('/cgu')}
            style={{
              fontSize: '13px',
              color: 'var(--color-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'underline',
              fontWeight: 500,
              padding: 0,
            }}
          >
            <Scale size={14} /> Conditions Générales (CGU)
          </button>
          <button
            onClick={() => navigate('/mentions-legales')}
            style={{
              fontSize: '13px',
              color: 'var(--color-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'underline',
              fontWeight: 500,
              padding: 0,
            }}
          >
            <BookOpen size={14} /> Mentions Légales
          </button>
          <button
            onClick={() => navigate('/politique-confidentialite')}
            style={{
              fontSize: '13px',
              color: 'var(--color-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'underline',
              fontWeight: 500,
              padding: 0,
            }}
          >
            <Eye size={14} /> Politique de confidentialité
          </button>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Scale size={14} /> Loi n°2024/017
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> NotchPay
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          © 2026 AssoMboa — MFUMU GROUP LLC.
        </p>
      </footer>
    </div>
  )
}
