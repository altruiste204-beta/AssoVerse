import { useState } from 'react'
import { Card, Badge, Button } from '@/components/ui'
import { getNdopPatternSvg } from '@/components/ui/CameroonPattern'
import { 
  ArrowLeft, BookOpen, Wallet, Users, Shield, 
  FileText, Calendar, MessageSquare, AlertCircle, Sparkles, Check
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HelpSection {
  id: string
  title: string
  category: string
  icon: React.ReactNode
  summary: string
  details: string[]
  tips: string
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'wallet',
    category: 'Finances',
    title: 'AS-WALLET & Transactions',
    icon: <Wallet size={18} />,
    summary: 'Portefeuille électronique sécurisé conforme aux exigences réglementaires de la CEMAC et de la COBAC pour la gestion des flux financiers des tontines.',
    details: [
      'Rechargements OM / MoMo : Alimentez instantanément votre solde disponible depuis vos comptes de monnaie électronique (Orange Money Cameroun et MTN Mobile Money).',
      'Retraits direct d\'argent : Récupérez vos parts de tontine reçues directement sur votre Mobile Money personnel en moins de 5 minutes avec un taux de commission unifié de 1%.',
      'Validation de caisse physique : Permet aux membres de verser des cotisations en espèces directement auprès du trésorier de l\'association, qui valide ensuite manuellement le dépôt sur l\'AS-WALLET de l\'utilisateur.',
      'Suivi des flux financiers : Historique complet, immuable et téléchargeable de toutes les cotisations versées, des gains de tontines collectés et des frais appliqués.'
    ],
    tips: 'Astuce : Effectuez vos demandes de rechargement en amont des réunions de tontines pour que votre solde soit prêt au moment de l\'appel à cotisation.'
  },
  {
    id: 'tontines',
    category: 'Associations',
    title: 'Associations, Tontines & Cycles',
    icon: <Users size={18} />,
    summary: 'Création d\'associations, adhésion sécurisée et administration automatisée des cycles de tontine réguliers (mensuels, hebdomadaires, etc.).',
    details: [
      'Création et Visibilité : Créez des associations publiques visibles de tous pour attirer de nouveaux membres, ou totalement privées/secrètes accessibles uniquement via lien d\'invitation.',
      'Code d\'adhésion unique : Invitez de nouveaux membres grâce à des codes uniques et des modèles de messages optimisés pour WhatsApp, Email et SMS.',
      'Attribution et Enchères : Algorithme d\'attribution de la tontine aux membres par tirage au sort transparent, par ordre rotatif prédéfini, ou par enchères compétitives.',
      'Gestion des Retards de Cotisation : Calcul automatique des impayés, système d\'alerte et de relance en un clic pour les membres en retard de cotisation.'
    ],
    tips: 'Astuce : Le président peut à tout moment modifier l\'ordre d\'attribution ou suspendre un membre en cas d\'accord amiable au sein du groupe.'
  },
  {
    id: 'bureau',
    category: 'Gouvernance',
    title: 'Rôles & Gouvernance du Bureau',
    icon: <FileText size={18} />,
    summary: 'Définition stricte des rôles administratifs pour une gouvernance transparente et sans contestation possible.',
    details: [
      'Président (Propriétaire) : Détient les pleins pouvoirs d\'administration, valide les adhésions des membres, initie les cycles et approuve les PV.',
      'Secrétaire : Responsable de l\'organisation, de l\'agenda, de l\'appel des présences lors des réunions, et de la rédaction officielle des procès-verbaux (PV).',
      'Trésorier : Rapproche les flux de caisse physique, valide les dépôts hors-ligne et exécute les décaissements de fonds attribués.',
      'Commissaire aux Comptes : Supervise la conformité financière globale et valide l\'authenticité des transactions de la caisse d\'entraide ou des levées de fonds.'
    ],
    tips: 'Astuce : Une bonne répartition des rôles évite la surcharge de travail et assure une transparence financière totale devant les membres.'
  },
  {
    id: 'mainlevee',
    category: 'Investissements',
    title: 'Levées de Fonds (Main-Levée)',
    icon: <Sparkles size={18} />,
    summary: 'Système d\'investissement collectif par "main-levée" permettant le financement de projets majeurs ou d\'achats de groupe.',
    details: [
      'Lancement de projet : Création de campagnes d\'investissement avec objectif financier à atteindre et date limite de collecte.',
      'Deux Modes de Fonctionnement : Mode "Flexible" (les fonds collectés sont versés même si l\'objectif n\'est pas atteint) ou mode "Tout ou Rien" (remboursement automatique des membres si l\'objectif échoue).',
      'Participation instantanée : Les membres investissent directement le montant de leur choix depuis le solde disponible de leur AS-WALLET.',
      'Reversement & Suivi : À l\'échéance, les fonds cumulés sont reversés sur l\'AS-WALLET du porteur de projet ou réinvestis directement.'
    ],
    tips: 'Astuce : Utilisez le mode "Tout ou Rien" pour les projets d\'achat groupé où le prix d\'achat final est fixe et non négociable.'
  },
  {
    id: 'events',
    category: 'Entraide',
    title: 'Événements & Caisse d\'Entraide Solidaire',
    icon: <Shield size={18} />,
    summary: 'Gestion informatisée de la caisse de solidarité sociale pour accompagner les membres lors d\'événements de vie (Heureux ou Malheureux).',
    details: [
      'Déclaration simplifiée : Soumission d\'un événement (naissance, mariage, décès, sinistre) avec justificatifs directement depuis l\'application.',
      'Validation du Bureau : Les membres du bureau étudient et votent la conformité de l\'événement par rapport à la charte interne.',
      'Cotisation d\'entraide automatique : Prélèvement direct ou appel à cotisation obligatoire d\'un montant fixe défini par la charte auprès de chaque membre.',
      'Décaissement immédiat : Reversement direct du fond de solidarité constitué sur l\'AS-WALLET du membre bénéficiaire.'
    ],
    tips: 'Astuce : La caisse d\'entraide d\'AssoMboa remplace avantageusement les enveloppes physiques et garantit que chaque membre contribue équitablement.'
  },
  {
    id: 'meetings',
    category: 'Gouvernance',
    title: 'Réunions & Procès-Verbaux (PV)',
    icon: <Calendar size={18} />,
    summary: 'Planification, exécution des réunions virtuelles ou physiques, appel des présences et historisation des PV.',
    details: [
      'Planification de Réunions : Programmation des réunions avec date, heure, ordre du jour et lien d\'accès visioconférence (Google Meet, Zoom, WhatsApp ou présence physique).',
      'Appel des Présences numérique : Le secrétaire effectue l\'appel en direct pour marquer les membres présents, absents excusés ou absents injustifiés.',
      'Rédaction de PV collaborative : Saisie en temps réel de l\'ordre du jour, des résolutions adoptées et des conclusions de la réunion.',
      'Approbation de PV : Vote électronique ou signature virtuelle des membres pour valider officiellement le PV de la réunion précédente.'
    ],
    tips: 'Astuce : Les PV approuvés sont archivés à vie dans l\'application et restent consultables par tous les membres à tout moment.'
  },
  {
    id: 'messaging',
    category: 'Communication',
    title: 'Messagerie & Alertes de Relance',
    icon: <MessageSquare size={18} />,
    summary: 'Espace de communication sécurisé et instantané pour coordonner la vie de l\'association et envoyer des rappels automatiques.',
    details: [
      'Canaux de discussion dédiés : Groupes de discussion sécurisés pour chaque association afin de débattre des projets sans polluer vos conversations privées WhatsApp.',
      'Relances Automatiques : Le bureau peut déclencher en un clic des alertes de retard de paiement envoyées par rappels SMS et alertes aux membres.',
      'Notifications de Sécurité : Alertes immédiates en cas de connexion sur un nouvel appareil, de rechargement validé ou de demande de KYC approuvée.'
    ],
    tips: 'Astuce : Utilisez les canaux de messagerie d\'AssoMboa pour garder l\'historique des débats de l\'association séparé de vos discussions personnelles.'
  }
]

export function HelpPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('wallet')

  const currentSection = HELP_SECTIONS.find(sec => sec.id === activeTab) || HELP_SECTIONS[0]

  return (
    <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '20px', padding: '12px' }}>
      {/* Dynamic NDOP Background */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: `url("${getNdopPatternSvg('var(--color-primary)')}")`,
        backgroundRepeat: 'repeat', backgroundSize: '140px 140px',
        opacity: 0.01, pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button 
            onClick={() => navigate('/profile')} 
            style={{ 
              background: 'var(--color-primary-light)', border: 'none', 
              borderRadius: 'var(--radius-md)', padding: '8px 14px', 
              cursor: 'pointer', color: 'var(--color-primary)',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', fontWeight: 600, transition: 'opacity 150ms ease'
            }}
          >
            <ArrowLeft size={16} /> Profil
          </button>
          <Badge variant="success">Manuel Complet d'Utilisation</Badge>
        </div>

        {/* Hero Banner Section */}
        <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'var(--font-heading)', margin: 0 }}>
            Centre d'Aide AssoMboa
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Explorez le guide officiel et détaillé pour maîtriser l'intégralité des fonctionnalités d'épargne, de tontines et de gouvernance d'AssoMboa.
          </p>
        </div>

        {/* Layout split: Left side Navigation, Right side Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="md:grid-cols-[250px_1fr]">
          
          {/* Navigation Sidebar */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', paddingLeft: '4px' }}>
              Fonctionnalités
            </span>
            
            {HELP_SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === section.id ? 'var(--color-primary-light)' : 'transparent',
                  color: activeTab === section.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: activeTab === section.id ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 150ms ease'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: activeTab === section.id ? 'rgba(200,150,62,0.15)' : 'rgba(107,114,128,0.06)' }}>
                  {section.icon}
                </span>
                {section.title}
              </button>
            ))}
          </Card>

          {/* Exhaustive Content Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card style={{ padding: '24px', border: '1.5px solid var(--color-primary)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                    {currentSection.icon}
                  </span>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {currentSection.category}
                    </span>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                      {currentSection.title}
                    </h2>
                  </div>
                </div>
                <Badge variant="accent">{currentSection.id.toUpperCase()}</Badge>
              </div>

              {/* Sub-Description */}
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '20px', fontStyle: 'italic', background: 'var(--color-sand)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                {currentSection.summary}
              </p>

              {/* Exhaustive details checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
                  Fonctionnement total & complet :
                </h3>
                
                {currentSection.details.map((detail, idx) => {
                  const [title, desc] = detail.split(' : ')
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }}>
                        <Check size={10} />
                      </span>
                      <p style={{ fontSize: '12.5px', color: 'var(--color-text)', margin: 0, lineHeight: 1.5 }}>
                        <strong style={{ fontWeight: 650 }}>{title}</strong> : {desc}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Tips banner card */}
              <div style={{ background: 'rgba(200, 150, 62, 0.05)', border: '1px dashed rgba(200, 150, 62, 0.4)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AlertCircle size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '11.5px', color: 'var(--color-primary)', fontWeight: 600, lineHeight: 1.4 }}>
                  {currentSection.tips}
                </span>
              </div>

            </Card>

            {/* Quick Contact Box */}
            <Card style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <BookOpen size={24} color="var(--color-primary)" />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                    Besoin de plus de conseils ?
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Consultez notre FAQ dynamique ou écrivez à notre service d'accompagnement direct.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/faq')}>
                Consulter la FAQ
              </Button>
            </Card>
          </div>

        </div>

      </div>
    </div>
  )
}
