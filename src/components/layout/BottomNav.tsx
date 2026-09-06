import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Home, Users, HandCoins, Calendar, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    { icon: Home, label: t('nav.home'), path: '/dashboard' },
    { icon: Users, label: t('nav.associations'), path: '/associations' },
    { icon: HandCoins, label: t('nav.tontines'), path: '/tontines', center: true },
    { icon: Calendar, label: t('nav.meetings'), path: '/meetings' },
    { icon: Bell, label: t('nav.alerts'), path: '/alerts' },
  ]

  return (
    <nav
      className="mobile-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--color-card)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
        zIndex: 100,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
      }}
    >
      {items.map((item) => {
        const active = location.pathname.startsWith(item.path)
        const Icon = item.icon
        return (
          <motion.button
            key={item.path}
            onClick={() => navigate(item.path)}
            whileTap={{ scale: 0.9 }}
            className={cn('nav-item')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              touchAction: 'manipulation',
            }}
          >
            <motion.div
              animate={{
                scale: active ? (item.center ? 1.06 : 1.04) : 1,
              }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              style={{
                width: item.center ? '52px' : '40px',
                height: item.center ? '52px' : '40px',
                borderRadius: item.center ? '50%' : 'var(--radius-md)',
                background: item.center ? 'linear-gradient(135deg, #14532D 0%, #F4C430 100%)' : active ? 'var(--color-primary-light)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: item.center ? '-24px' : '0',
                boxShadow: item.center ? 'var(--shadow-md)' : 'none',
                border: item.center ? '3px solid var(--color-card)' : 'none',
                transition: 'background 200ms ease',
              }}
            >
              <Icon
                size={item.center ? 24 : 22}
                color={item.center ? '#FFFFFF' : active ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                strokeWidth={active ? 2.5 : 2}
              />
            </motion.div>
            <span style={{
              fontSize: '10px',
              fontWeight: active ? 700 : 500,
              color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
              transition: 'color 150ms ease',
            }}>
              {item.label}
            </span>
          </motion.button>
        )
      })}
    </nav>
  )
}

