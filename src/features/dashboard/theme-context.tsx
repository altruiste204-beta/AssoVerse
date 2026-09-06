import { type ReactNode, createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  followSystem: boolean
  setFollowSystem: (val: boolean) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [followSystem, setFollowSystemState] = useState<boolean>(false)

  useEffect(() => {
    const savedFollowSystem = localStorage.getItem('assomboa-theme-follow-system') === 'true'
    setFollowSystemState(savedFollowSystem)

    if (savedFollowSystem) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const systemTheme = prefersDark ? 'dark' : 'light'
      setTheme(systemTheme)
      document.documentElement.setAttribute('data-theme', systemTheme)
    } else {
      const savedTheme = localStorage.getItem('assomboa-theme') as Theme | null
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initial = savedTheme || (prefersDark ? 'dark' : 'light')
      setTheme(initial)
      document.documentElement.setAttribute('data-theme', initial)
    }
  }, [])

  useEffect(() => {
    if (!followSystem) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const nextTheme = e.matches ? 'dark' : 'light'
      setTheme(nextTheme)
      document.documentElement.setAttribute('data-theme', nextTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [followSystem])

  const setFollowSystem = (val: boolean) => {
    setFollowSystemState(val)
    localStorage.setItem('assomboa-theme-follow-system', val ? 'true' : 'false')

    if (val) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const systemTheme = prefersDark ? 'dark' : 'light'
      setTheme(systemTheme)
      document.documentElement.setAttribute('data-theme', systemTheme)
    } else {
      localStorage.setItem('assomboa-theme', theme)
    }
  }

  const toggleTheme = () => {
    setFollowSystemState(false)
    localStorage.setItem('assomboa-theme-follow-system', 'false')

    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('assomboa-theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, followSystem, setFollowSystem, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
