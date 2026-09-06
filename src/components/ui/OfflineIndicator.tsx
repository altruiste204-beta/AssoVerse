import React from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { WifiOff } from 'lucide-react'

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      id="offline-indicator-banner"
      style={{
        position: 'fixed',
        bottom: '84px', // Sits perfectly above the bottom navigation bar
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'rgba(217, 119, 6, 0.95)', // Sahel Doré / Amber hue matching branding
        backdropFilter: 'blur(8px)',
        color: '#FFFFFF',
        padding: '8px 16px',
        borderRadius: '9999px', // Fully rounded buttons/badges
        fontSize: '12px',
        fontWeight: 600,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'pulse 2s infinite',
        whiteSpace: 'nowrap',
      }}
    >
      <WifiOff size={14} />
      <span>Mode hors-ligne — Consultation des données locales</span>
    </div>
  )
}
