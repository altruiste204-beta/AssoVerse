import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  id?: string
}

export function PageTransition({ children, className = '', style, id }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      id={id}
      className={className}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, filter: 'blur(3px)' }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: 'blur(2px)' }}
      transition={{
        duration: shouldReduceMotion ? 0.15 : 0.25,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}

