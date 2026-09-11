import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { AuthProvider, useAuth } from '@/features/auth/auth-context'
import { AssociationProvider } from '@/features/associations/association-context'
import { ThemeProvider } from '@/features/dashboard/theme-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageTransition } from '@/components/layout/PageTransition'
import { UserWalletProvider } from '@/features/wallet/user-wallet-context'
import { Spinner, ErrorBoundary } from '@/components/ui'
import { getNdopPatternSvg, getEkangPatternSvg } from '@/components/ui/CameroonPattern'
import { lazyWithRetry } from '@/lib/lazyWithRetry'
import type { ReactNode } from 'react'

// Chargées à la demande avec retry automatique en cas de coupure réseau mobile ou rafraîchissement Vite :
// chaque écran devient son propre chunk JS, téléchargé seulement quand l'utilisateur y navigue réellement.
const LandingPage = lazyWithRetry(() => import('@/features/auth/LandingPage'))
const AuthPage = lazyWithRetry(() => import('@/features/auth/AuthPage'))
const UserWalletModal = lazyWithRetry(() => import('@/features/wallet/UserWalletModal'))
const KycPage = lazyWithRetry(() => import('@/features/auth/KycPage'))
const ProfilePage = lazyWithRetry(() => import('@/features/auth/ProfilePage'))
const DashboardPage = lazyWithRetry(() => import('@/features/dashboard/DashboardPage'))
const AlertsPage = lazyWithRetry(() => import('@/features/dashboard/AlertsPage'))
const AssociationsPage = lazyWithRetry(() => import('@/features/associations/AssociationsPage'))
const TontinesPage = lazyWithRetry(() => import('@/features/tontines/TontinesPage'))
const EventsPage = lazyWithRetry(() => import('@/features/events/EventsPage'))
const BureauPage = lazyWithRetry(() => import('@/features/bureau/BureauPage'))
// Cassation embarque jspdf + html2canvas (lourd) : particulièrement rentable à isoler ici.
const CassationPage = lazyWithRetry(() => import('@/features/cassation/CassationPage'))
const MeetingsPage = lazyWithRetry(() => import('@/features/meetings/MeetingsPage'))
const MessagingPage = lazyWithRetry(() => import('@/features/messaging/MessagingPage'))
const CguPage = lazyWithRetry(() => import('@/features/legal/CguPage'))
const MentionsLegalesPage = lazyWithRetry(() => import('@/features/legal/MentionsLegalesPage'))
const PolitiqueConfidentialitePage = lazyWithRetry(() => import('@/features/legal/PolitiqueConfidentialitePage'))
const FaqPage = lazyWithRetry(() => import('@/features/help/FaqPage'))
const HelpPage = lazyWithRetry(() => import('@/features/help/HelpPage'))

function RouteFallback() {
  return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><Spinner size={32} /></div>
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><Spinner size={40} /></div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><Spinner size={40} /></div>

  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <UserWalletModal />
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <PageTransition><LandingPage /></PageTransition>} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <PageTransition><AuthPage mode="login" /></PageTransition>} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <PageTransition><AuthPage mode="signup" /></PageTransition>} />
          <Route path="/kyc" element={<ProtectedRoute><PageTransition><KycPage /></PageTransition></ProtectedRoute>} />
          <Route path="/cgu" element={<PageTransition><CguPage /></PageTransition>} />
          <Route path="/mentions-legales" element={<PageTransition><MentionsLegalesPage /></PageTransition>} />
          <Route path="/politique-confidentialite" element={<PageTransition><PolitiqueConfidentialitePage /></PageTransition>} />

          {/* Authenticated routes with persistent AppLayout and smooth section transitions */}
          <Route
            element={
              <ProtectedRoute>
                <AssociationProvider>
                  <AppLayout />
                </AssociationProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/associations" element={<AssociationsPage />} />
            <Route path="/tontines" element={<TontinesPage />} />
            <Route path="/main-levee" element={<TontinesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/bureau" element={<BureauPage />} />
            <Route path="/cassation" element={<CassationPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/messaging" element={<MessagingPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/aide" element={<HelpPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserWalletProvider>
          {/* Static, abstract background pattern overlays */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url("${getNdopPatternSvg()}")`,
            backgroundRepeat: 'repeat',
            backgroundAttachment: 'fixed',
            opacity: 0.12,
            pointerEvents: 'none',
            zIndex: 0,
          }} />

          {/* Fixed static, abstract geometric design motifs (immobile on scroll, quiet background only) */}
          <div style={{
            position: 'fixed',
            top: '12%',
            right: '-100px',
            width: '320px',
            height: '320px',
            opacity: 0.05,
            pointerEvents: 'none',
            backgroundImage: `url("${getEkangPatternSvg('#F4C430')}")`,
            backgroundSize: 'cover',
            borderRadius: '50%',
            animation: 'spin 45s linear infinite',
            zIndex: 0,
          }} />

          <div style={{
            position: 'fixed',
            bottom: '10%',
            left: '-120px',
            width: '280px',
            height: '280px',
            opacity: 0.04,
            pointerEvents: 'none',
            backgroundImage: `url("${getNdopPatternSvg('#14532D')}")`,
            backgroundSize: 'cover',
            borderRadius: '50%',
            animation: 'spin 60s linear infinite',
            zIndex: 0,
          }} />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </UserWalletProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
