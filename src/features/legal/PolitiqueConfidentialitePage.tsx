import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, ShieldCheck } from 'lucide-react'
import { Button, Card } from '@/components/ui'

export function PolitiqueConfidentialitePage() {
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
              Confidentialité
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
            <Eye size={28} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-text)',
            lineHeight: 1.2,
            margin: '0 0 8px 0',
          }}>
            Politique de confidentialité
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            Dernière mise à jour : 7 septembre 2026 • Plateforme AssoMboa
          </p>
        </div>

        {/* Compliance Banner */}
        <Card style={{
          background: 'rgba(20, 83, 45, 0.04)',
          border: '1.5px solid rgba(20, 83, 45, 0.25)',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}>
          <ShieldCheck size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0' }}>
              Conformité Loi Camerounaise n°2024/017
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Cette politique explique comment AssoMboa collecte, utilise et protège vos données personnelles conformément à la législation en vigueur relative à la protection des données à caractère personnel au Cameroun.
            </p>
          </div>
        </Card>

        {/* Main Document Content */}
        <Card style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <section id="privacy-section-1">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</span>
              Responsable du traitement
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              MFUMU GROUP LLC, représentée par RomAric MFUMU, est responsable du traitement des données collectées via AssoMboa.
              <br />
              Contact dédié aux questions de confidentialité : <a href="mailto:altruiste2.0.4@gmail.com" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>altruiste2.0.4@gmail.com</a>
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="privacy-section-2">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</span>
              Données collectées
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <div>
                <strong style={{ color: 'var(--color-text)' }}>• Données d'identification</strong> : nom complet, numéro de téléphone, adresse e-mail
              </div>
              <div>
                <strong style={{ color: 'var(--color-text)' }}>• Données de vérification (KYC)</strong> : pièce d'identité, informations nécessaires à la vérification d'identité avant création ou adhésion à une association
              </div>
              <div>
                <strong style={{ color: 'var(--color-text)' }}>• Données associatives</strong> : nom et documents de l'association (dont le récépissé préfectoral), rôle au sein du bureau, historique de cotisations et de participation aux Main Levée
              </div>
              <div>
                <strong style={{ color: 'var(--color-text)' }}>• Données de transaction</strong> : montants, dates, statuts des paiements — les identifiants de moyen de paiement eux-mêmes (numéro mobile money, etc.) sont traités directement par NotchPay et ne sont pas stockés par AssoMboa
              </div>
              <div>
                <strong style={{ color: 'var(--color-text)' }}>• Données techniques</strong> : adresse IP, type d'appareil, journaux de connexion, à des fins de sécurité et de détection de fraude
              </div>
            </div>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="privacy-section-3">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</span>
              Finalités du traitement
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>• Créer et sécuriser le compte utilisateur</p>
              <p style={{ margin: 0 }}>• Vérifier l'identité conformément aux exigences KYC avant toute participation financière</p>
              <p style={{ margin: 0 }}>• Permettre la gestion des associations, cotisations, Main Levée et événements</p>
              <p style={{ margin: 0 }}>• Assurer la gouvernance multi-parties du bureau (validation des transactions)</p>
              <p style={{ margin: 0 }}>• Détecter et prévenir la fraude (modération de la messagerie, journal d'audit)</p>
              <p style={{ margin: 0 }}>• Respecter les obligations légales applicables (conservation de justificatifs, réponse aux autorités compétentes si requis par la loi)</p>
            </div>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="privacy-section-4">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>4</span>
              Base légale
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Le traitement repose sur l'exécution du contrat d'utilisation d'AssoMboa (fourniture du service), le consentement explicite recueilli à l'inscription pour le KYC, et l'intérêt légitime d'AssoMboa à prévenir la fraude et assurer la sécurité de la plateforme.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="privacy-section-5">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>5</span>
              Partage des données
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>AssoMboa ne vend aucune donnée personnelle. Les données sont partagées uniquement avec :</p>
              <p style={{ margin: 0 }}>• <strong>Supabase</strong> (hébergement de la base de données et de l'authentification)</p>
              <p style={{ margin: 0 }}>• <strong>NotchPay</strong> (traitement des paiements réels — collecte et versement) : AssoMboa transmet à NotchPay les seules informations nécessaires à l'exécution d'un paiement déjà validé par le bureau de l'association</p>
              <p style={{ margin: 0 }}>• Les autorités compétentes, uniquement si la loi camerounaise l'exige</p>
            </div>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="privacy-section-6">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>6</span>
              Durée de conservation
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Les données sont conservées pendant toute la durée d'activité du compte et de l'association. En cas de cassation "Supprimée" d'une association, les données personnelles associées sont supprimées de manière irréversible ; un export statistique strictement anonymisé (sans nom ni identifiant personnel) peut être conservé à des fins d'archivage interne.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="privacy-section-7">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>7</span>
              Droits des utilisateurs
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Conformément à la loi n°2024/017, chaque utilisateur dispose d'un droit d'accès, de rectification, d'opposition et de suppression de ses données personnelles. Ces droits s'exercent en écrivant à <a href="mailto:altruiste2.0.4@gmail.com" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>altruiste2.0.4@gmail.com</a>
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="privacy-section-8">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>8</span>
              Sécurité
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Les communications transitent en HTTPS/TLS. Les données sont chiffrées au repos au niveau de la base de données. La messagerie interne n'est pas chiffrée de bout en bout, afin de permettre une modération anti-fraude active — ce choix est documenté et assumé, voir la section correspondante des Conditions Générales d'Utilisation.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="privacy-section-9">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>9</span>
              Modifications
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Cette politique peut être mise à jour ; toute modification substantielle sera notifiée aux utilisateurs via l'application.
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
