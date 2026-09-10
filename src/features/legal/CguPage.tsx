import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Scale, ShieldAlert, PhoneCall, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { Button, Card } from '@/components/ui'

export function CguPage() {
  const navigate = useNavigate()
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

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
              CGU Officiel
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
            <Scale size={28} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-text)',
            lineHeight: 1.2,
            margin: '0 0 8px 0',
          }}>
            Conditions Générales d'Utilisation
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            Dernière mise à jour : 7 septembre 2026 • Plateforme AssoMboa
          </p>
        </div>

        {/* Essential Warning Callout */}
        <Card style={{
          background: 'rgba(200, 150, 62, 0.04)',
          border: '1.5px solid rgba(200, 150, 62, 0.25)',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}>
          <ShieldAlert size={22} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0' }}>
              Clause Essentielle de Gestion de Fonds
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              <strong>AssoMboa n'est à aucun moment dépositaire des fonds de ses utilisateurs.</strong> La plateforme agit exclusivement comme un outil d'organisation et d'orchestration technique. Tout mouvement financier réel est exécuté de manière sécurisée par notre prestataire agréé <strong>NotchPay</strong>.
            </p>
          </div>
        </Card>

        {/* Main Document Content */}
        <Card style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <section id="cgu-section-1">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</span>
              Objet
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Les présentes CGU régissent l'utilisation de l'application AssoMboa, éditée par ROMARIC MFUMU, destinée à la gestion des associations, tontines, GIC et ONG au Cameroun.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-2">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</span>
              Acceptation
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              L'inscription sur AssoMboa vaut acceptation pleine et entière des présentes CGU. Si l'utilisateur n'accepte pas ces conditions, il doit s'abstenir d'utiliser l'application.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-3">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</span>
              Conditions d'inscription et de création d'association
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>
                • L'inscription nécessite une vérification d'identité (KYC).
              </p>
              <p style={{ margin: 0 }}>
                • La création d'une association sur AssoMboa suppose que celle-ci existe déjà légalement, avec un récépissé préfectoral en cours de validité, conformément à la loi n°90/053 du 19 décembre 1990 relative à la liberté d'association (modifiée en 2020 et 2021). AssoMboa se réserve le droit de vérifier et rejeter tout document non conforme.
              </p>
            </div>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-4">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>4</span>
              Rôle d'AssoMboa concernant les fonds — clause essentielle
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              <strong>AssoMboa n'est à aucun moment dépositaire des fonds de ses utilisateurs.</strong> La plateforme agit exclusivement comme un outil d'organisation et d'orchestration technique. Tout mouvement financier réel (cotisation, Main Levée, remboursement) est exécuté par NotchPay, prestataire de paiement tiers agréé. AssoMboa ne garantit pas la disponibilité du service de paiement fourni par NotchPay et ne saurait être tenue responsable d'un dysfonctionnement propre à ce prestataire.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-5">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>5</span>
              Fonctionnement — gouvernance du bureau
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Toute transaction financière initiée sur une association (versement d'une Main Levée, paiement d'un événement) requiert l'accord d'un nombre minimal de membres du bureau, tel que défini dans l'application. Aucune transaction n'est exécutée sans ce nombre d'accords.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-6">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>6</span>
              Main Levée
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Une Main Levée peut être configurée en mode "flexible" (le montant collecté, même partiel, est versé au bénéficiaire à l'échéance) ou "tout ou rien" (remboursement automatique des contributeurs si l'objectif n'est pas atteint à l'échéance). Le mode est choisi par le créateur de la Main Levée et affiché clairement aux contributeurs avant toute participation. Une commission de 2% est prélevée sur le montant collecté uniquement en cas de réussite.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-7">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>7</span>
              Cassation d'une association
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Le propriétaire d'une association peut, à tout moment, initier sa cassation selon trois modalités : suppression définitive (avec export statistique anonymisé conservé), désactivation réversible, ou renouvellement. Les conséquences de chaque choix sont irréversibles une fois confirmées, à l'exception de la désactivation.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-8">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>8</span>
              Messagerie
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              La messagerie intégrée n'est pas chiffrée de bout en bout. AssoMboa se réserve le droit de modérer les échanges en cas de signalement ou de suspicion de fraude, dans le respect de la Politique de confidentialité.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-9">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>9</span>
              Abonnement Premium
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              AssoMboa propose une offre gratuite (une association gérée en tant que propriétaire) et une offre Premium payante (associations illimitées, exports avancés, rappels automatiques, badge de vérification). Les modalités tarifaires précises sont communiquées dans l'application et peuvent évoluer avec préavis.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-10">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>10</span>
              Responsabilités de l'utilisateur
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              L'utilisateur s'engage à fournir des informations exactes, à ne pas usurper l'identité d'un tiers, à ne pas utiliser AssoMboa à des fins frauduleuses, et à respecter les autres membres des associations auxquelles il participe.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-11">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>11</span>
              Suspension et résiliation
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              AssoMboa se réserve le droit de suspendre ou clôturer un compte en cas de manquement grave aux présentes CGU, notamment en cas de fraude avérée ou de fourniture de faux documents (récépissé préfectoral falsifié, etc.).
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-12">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>12</span>
              Limitation de responsabilité
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              AssoMboa met en œuvre les moyens raisonnables pour assurer la disponibilité et la sécurité du service, sans garantie de résultat. AssoMboa ne saurait être tenue responsable des pertes résultant d'un défaut du réseau mobile, d'une défaillance du prestataire de paiement, ou d'une décision prise par le bureau d'une association.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-13">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>13</span>
              Droit applicable et litiges
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Les présentes CGU sont soumises au droit camerounais. Tout litige relatif à leur interprétation ou leur exécution relève de la compétence exclusive des juridictions camerounaises, sauf disposition légale impérative contraire.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-14">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>14</span>
              Modification des CGU
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              MFUMU GROUP LLC peut modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle via l'application, avant son entrée en vigueur.
            </p>
          </section>

          <hr style={{ border: '0', height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: 0 }} />

          <section id="cgu-section-15">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <span style={{ fontSize: '13px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(20, 83, 45, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>15</span>
              Contact
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              <PhoneCall size={16} color="var(--color-primary)" />
              <span>Pour toute question relative aux présentes CGU : <a href="mailto:altruiste2.0.4@gmail.com" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>altruiste2.0.4@gmail.com</a></span>
            </div>
          </section>

        </Card>

        {/* Foire Aux Questions (FAQ) Section */}
        <Card style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(20, 83, 45, 0.08)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                Foire Aux Questions (FAQ)
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                Vos questions fréquentes sur la gestion associative et les paiements
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            {[
              {
                question: "Comment fonctionne la validation multi-parties par le bureau ?",
                answer: "Pour garantir la sécurité et la transparence financière d'une association, chaque retrait ou décaissement doit faire l'objet d'une validation démocratique par la majorité des membres du Bureau (Président, Secrétaire, Trésorier). Tant que le nombre requis de signatures électroniques n'est pas réuni, les fonds restent bloqués sur l'infrastructure de paiement sécurisée de NotchPay."
              },
              {
                question: "Comment les cotisations et transactions NotchPay sont-elles gérées ?",
                answer: "NotchPay est notre partenaire de paiement agréé au Cameroun. Les fonds des utilisateurs et des associations transitent exclusivement par les serveurs sécurisés de NotchPay via Mobile Money (MTN MoMo, Orange Money) ou carte de crédit. AssoMboa n'héberge, ne détient, ni ne manipule jamais directement d'argent."
              },
              {
                question: "Qu'est-ce que le processus de vérification KYC et est-il obligatoire ?",
                answer: "Oui, le KYC (Know Your Customer) est obligatoire pour participer financièrement aux cotisations ou Main Levée. Il consiste à vérifier l'identité réelle d'un membre (par carte d'identité nationale ou passeport) pour lutter contre l'usurpation d'identité et les fraudes associatives au Cameroun."
              },
              {
                question: "Que se passe-t-il si une association décide de prononcer une Cassation ?",
                answer: "En cas de cassation (liquidation ou suppression), l'historique de l'association est clôturé. Les fonds restants dans la caisse de l'association sont redistribués ou restitués de façon irréversible selon les modalités validées par les signatures conjointes du Bureau."
              },
              {
                question: "Mes informations personnelles sont-elles protégées au Cameroun ?",
                answer: "Absolument. Vos données sont traitées dans le strict respect de la loi camerounaise n°2024/017 relative à la protection des données à caractère personnel. Elles sont chiffrées au repos et ne sont jamais revendues ou partagées avec des tiers non autorisés."
              }
            ].map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: isOpen ? 'rgba(20, 83, 45, 0.02)' : 'transparent',
                    transition: 'all 200ms ease',
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--color-text)',
                      fontWeight: 600,
                      fontSize: '14px',
                      gap: '12px',
                    }}
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    {isOpen ? (
                      <ChevronUp size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                    ) : (
                      <ChevronDown size={18} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                    )}
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                      style={{
                        padding: '0 16px 16px 16px',
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.6,
                        borderTop: '1px solid rgba(0,0,0,0.03)',
                      }}
                    >
                      {item.answer}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
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
