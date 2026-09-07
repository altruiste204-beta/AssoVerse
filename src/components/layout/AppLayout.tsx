import { type ReactNode, createContext, useContext } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'

const InsideAppLayoutContext = createContext(false)

export function AppLayout({ children }: { children?: ReactNode }) {
  const isInside = useContext(InsideAppLayoutContext)
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()

  // If already rendered inside an AppLayout parent, avoid duplicating TopBar / BottomNav
  if (isInside) {
    return <>{children || <Outlet />}</>
  }

  return (
    <InsideAppLayoutContext.Provider value={true}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', position: 'relative' }}>
        <TopBar />

        <main
          className="app-container"
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: 'blur(2px)' }}
              transition={{
                duration: shouldReduceMotion ? 0.15 : 0.24,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
              }}
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>
        <OfflineIndicator />
        <BottomNav />
      </div>
    </InsideAppLayoutContext.Provider>
  )
}

