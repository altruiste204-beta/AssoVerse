import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from '@/features/auth/auth-context'
import { AssociationProvider } from '@/features/associations/association-context'
import { ThemeProvider } from '@/features/dashboard/theme-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageTransition } from '@/components/layout/PageTransition'
import { LandingPage } from '@/features/auth/LandingPage'
import { AuthPage } from '@/features/auth/AuthPage'
import { UserWalletProvider } from '@/features/wallet/user-wallet-context'
import { UserWalletModal } from '@/features/wallet/UserWalletModal'
import { Spinner } from '@/components/ui'
import { getNdopPatternSvg, getEkangPatternSvg } from '@/components/ui/CameroonPattern'
import type { ReactNode } from 'react'

// Chargées à la demande : chaque écran devient son propre chunk JS,
// téléchargé seulement quand l'utilisateur y navigue réellement.
// Réduit fortement le poids initial pour la connectivité mobile camerounaise.
const KycPage = lazy(() => import('@/features/auth/KycPage').then(m => ({ default: m.KycPage })))
const ProfilePage = lazy(() => import('@/features/auth/ProfilePage').then(m => ({ default: m.ProfilePage })))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AlertsPage = lazy(() => import('@/features/dashboard/AlertsPage').then(m => ({ default: m.AlertsPage })))
const AssociationsPage = lazy(() => import('@/features/associations/AssociationsPage').then(m => ({ default: m.AssociationsPage })))
const TontinesPage = lazy(() => import('@/features/tontines/TontinesPage').then(m => ({ default: m.TontinesPage })))
const EventsPage = lazy(() => import('@/features/events/EventsPage').then(m => ({ default: m.EventsPage })))
const BureauPage = lazy(() => import('@/features/bureau/BureauPage').then(m => ({ default: m.BureauPage })))
// Cassation embarque jspdf + html2canvas (lourd) : particulièrement rentable à isoler ici.
const CassationPage = lazy(() => import('@/features/cassation/CassationPage').then(m => ({ default: m.CassationPage })))
const MeetingsPage = lazy(() => import('@/features/meetings/MeetingsPage').then(m => ({ default: m.MeetingsPage })))
const MessagingPage = lazy(() => import('@/features/messaging/MessagingPage').then(m => ({ default: m.MessagingPage })))
const CguPage = lazy(() => import('@/features/legal/CguPage').then(m => ({ default: m.CguPage })))
const MentionsLegalesPage = lazy(() => import('@/features/legal/MentionsLegalesPage').then(m => ({ default: m.MentionsLegalesPage })))
const PolitiqueConfidentialitePage = lazy(() => import('@/features/legal/PolitiqueConfidentialitePage').then(m => ({ default: m.PolitiqueConfidentialitePage })))

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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
