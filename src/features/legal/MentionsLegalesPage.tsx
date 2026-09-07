import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Shield, Globe, Award, Mail } from 'lucide-react'
import { Button, Card } from '@/components/ui'

export function MentionsLegalesPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'var(--color-background)',
        color: 'var(--color-text)',
        padding: '24px 16px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Navigation / Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', minHeight: '32px' }}
            aria-label="Retourner à la page précédente"
          >
            <ArrowLeft size={16} />
            Retour
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', background: 'rgba(20, 83, 45, 0.08)', padding: '4px 12px', borderRadius: '12px' }}>
              Mentions Légales
            </span>
          </div>
        </div>

        {/* Title Block */}
        <div style={{ textAlign: 'center', marginTop: '8px', marginBottom: '8px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: 'var(--shadow-md)',
          }}>
            <BookOpen size={28} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-text)',
            lineHeight: 1.2,
            margin: '0 0 8px 0',
          }}>
            Mentions Légales
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            Dernière mise à jour : 7 septembre 2026 • Plateforme AssoMboa
          </p>
        </div>

        {/* Main Document Content */}
        <Card style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <section id="legal-section-editor">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <Shield size={18} color="var(--color-primary)" />
              Éditeur de l'application
            </h3>
            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              <p style={{ margin: '0 0 6px 0' }}>L'application AssoMboa est éditée par :</p>
              <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: 'var(--color-text)' }}>ROMARIC MFUMU</p>
              <p style={{ margin: '0 0 6px 0' }}>Représentée par RomAric MFUMU</p>
              <p style={{ margin: '0 0 6px 0' }}>Adresse : Etunelinga, SANGMELIMA CAMEROUN</p>
              <p style={{ margin: 0 }}>
                E-mail de contact : <a href="mailto:altruiste2.0.4@gmail.com" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>altruiste2.0.4@gmail.com</a>
              </p>
            </div>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="legal-section-director">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <Award size={18} color="var(--color-primary)" />
              Directeur de la publication
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              <strong>RomAric MFUMU</strong>
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="legal-section-hosting">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <Globe size={18} color="var(--color-primary)" />
              Hébergement
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>
                • <strong>Application (frontend)</strong> : Netlify, Inc., 44 Tehama Street, San Francisco, CA 94105, États-Unis
              </p>
              <p style={{ margin: 0 }}>
                • <strong>Base de données et backend</strong> : Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992 (infrastructure hébergée sur des serveurs pouvant se situer hors du Cameroun — voir la Politique de confidentialité pour le détail des transferts de données)
              </p>
              <p style={{ margin: 0 }}>
                • <strong>Traitement des paiements</strong> : NotchPay (Cameroun) — les fonds des utilisateurs transitent exclusivement par cette plateforme agréée ; AssoMboa n'héberge ni ne détient à aucun moment de fonds.
              </p>
            </div>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="legal-section-ip">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <Award size={18} color="var(--color-primary)" />
              Propriété intellectuelle
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              L'ensemble des éléments constituant AssoMboa (structure, textes, graphismes, logo, base de données, code source) est la propriété exclusive de <strong>MFUMU GROUP LLC</strong>, sauf mention contraire. Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite préalable, est interdite.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="legal-section-contact">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <Mail size={18} color="var(--color-primary)" />
              Contact
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Pour toute question relative à ces mentions légales : <a href="mailto:altruiste2.0.4@gmail.com" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>altruiste2.0.4@gmail.com</a>
            </p>
          </section>

        </Card>

        {/* Action Button to go back */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Button
            variant="primary"
            onClick={handleBack}
            style={{ minWidth: '180px' }}
          >
            Retourner à l'application
          </Button>
        </div>

      </div>
    </motion.div>
  )
}
