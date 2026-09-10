import { useState } from 'react'
import { Card, Input, Button, Badge } from '@/components/ui'
import { getNdopPatternSvg, getEkangPatternSvg } from '@/components/ui/CameroonPattern'
import { 
  Search, HelpCircle, ChevronDown, ChevronUp, Check, 
  ThumbsUp, ThumbsDown, Send, MessageSquare, ArrowLeft,
  Shield, Wallet, Users, FileText
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface FaqItem {
  id: string
  question: string
  answer: string
  category: 'general' | 'wallet' | 'bureau' | 'events'
  usefulCount: number
  uselessCount: number
}

const INITIAL_FAQS: FaqItem[] = [
  {
    id: '1',
    category: 'general',
    question: "Comment fonctionne une tontine sur AssoMboa ?",
    answer: "La tontine est un système d'épargne collective. Les membres cotisent une somme fixe à intervalles réguliers (quotidien, hebdomadaire, mensuel). À chaque cycle ou réunion, les fonds cumulés sont attribués à un ou plusieurs bénéficiaires. L'ordre d'attribution peut être déterminé par tirage au sort, par ordre rotatif prédéfini, ou par un système d'enchères géré de façon transparente par le bureau de l'association.",
    usefulCount: 24,
    uselessCount: 1
  },
  {
    id: '2',
    category: 'wallet',
    question: "Comment recharger mon portefeuille AS-WALLET ?",
    answer: "Pour recharger votre AS-WALLET, rendez-vous sur votre Profil ou dans l'onglet Portefeuille de votre association. Cliquez sur 'Recharger', sélectionnez votre opérateur (Orange Money ou MTN Mobile Money), renseignez votre numéro de téléphone au format camerounais (+237) et le montant souhaité. Validez la transaction puis confirmez-la sur votre téléphone en saisissant votre code secret OM/Momo.",
    usefulCount: 42,
    uselessCount: 2
  },
  {
    id: '3',
    category: 'wallet',
    question: "Quels sont les frais sur les retraits et les dépôts ?",
    answer: "Les dépôts sur AS-WALLET sont entièrement gratuits. Pour les retraits vers vos comptes Mobile Money, des frais réglementaires minimes de 1% sont prélevés pour couvrir les coûts des opérateurs de télécommunication et les frais de compensation de la CEMAC. Aucun frais caché n'est appliqué.",
    usefulCount: 19,
    uselessCount: 0
  },
  {
    id: '4',
    category: 'general',
    question: "Comment inviter un membre à rejoindre mon association ?",
    answer: "Dans la page de votre association ou dans l'onglet 'Actions rapides' de votre profil, vous trouverez un bouton d'invitation. AssoMboa génère un code d'invitation unique et un lien direct. Vous pouvez partager ce lien par WhatsApp, SMS ou Email. Le nouveau membre n'aura qu'à cliquer sur le lien et saisir le code d'invitation pour soumettre sa demande d'adhésion au bureau.",
    usefulCount: 31,
    uselessCount: 1
  },
  {
    id: '5',
    category: 'bureau',
    question: "Quels sont les rôles disponibles dans le Bureau d'une association ?",
    answer: "Une association structurée comporte généralement quatre rôles clés au sein du Bureau administratif :\n\n• Le Président (Propriétaire) : Crée l'association, valide les demandes d'adhésion, approuve les décaissements majeurs et préside les réunions.\n• Le Secrétaire : Rédige et diffuse les procès-verbaux (PV), gère l'agenda des réunions et l'appel des présences.\n• Le Trésorier : Gère la caisse, valide les rechargements physiques, coordonne les distributions et présente les rapports financiers.\n• Le Commissaire aux Comptes : Supervise les flux de cotisations, contrôle l'exactitude des comptes de l'association et approuve les demandes de levée de fonds.",
    usefulCount: 28,
    uselessCount: 0
  },
  {
    id: '6',
    category: 'events',
    question: "Comment fonctionne la caisse d'entraide pour les Événements ?",
    answer: "AssoMboa intègre une caisse d'entraide solidaire. En cas d'événement heureux (naissance, mariage) ou malheureux (décès, maladie grave), un membre peut soumettre une déclaration d'événement. Le bureau étudie la demande selon la charte interne. Une fois approuvée, une cotisation d'assistance obligatoire est levée auprès de chaque membre de l'association, et la somme globale collectée est reversée directement sur l'AS-WALLET du bénéficiaire.",
    usefulCount: 35,
    uselessCount: 2
  },
  {
    id: '7',
    category: 'general',
    question: "Est-ce que AssoMboa respecte les réglementations bancaires ?",
    answer: "Absolument. AssoMboa est conçu en stricte conformité avec les directives de la CEMAC, de la COBAC et des autorités financières locales. La vérification d'identité (KYC) est requise pour tous les membres afin de lutter contre la fraude fiscale et le blanchiment de capitaux, garantissant un environnement d'épargne 100% légal et sécurisé.",
    usefulCount: 45,
    uselessCount: 1
  }
]

export function FaqPage() {
  const navigate = useNavigate()
  const [faqs, setFaqs] = useState<FaqItem[]>(INITIAL_FAQS)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'wallet' | 'bureau' | 'events'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Feedback states
  const [votedIds, setVotedIds] = useState<Record<string, 'up' | 'down'>>({})

  // Question submission states
  const [userQuestion, setUserQuestion] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleVote = (id: string, type: 'up' | 'down') => {
    if (votedIds[id]) return // Prevents double voting
    
    setFaqs(prevFaqs => 
      prevFaqs.map(faq => {
        if (faq.id === id) {
          return {
            ...faq,
            usefulCount: type === 'up' ? faq.usefulCount + 1 : faq.usefulCount,
            uselessCount: type === 'down' ? faq.uselessCount + 1 : faq.uselessCount
          }
        }
        return faq
      })
    )
    setVotedIds(prev => ({ ...prev, [id]: type }))
  }

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userQuestion || !userEmail) return
    
    // Simulate API storage success
    setSubmitSuccess(true)
    setUserQuestion('')
    setUserEmail('')
    setTimeout(() => setSubmitSuccess(false), 5000)
  }

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '20px', padding: '12px' }}>
      {/* Dynamic Background Patterns */}
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
          <Badge variant="primary">Espace Assistance 24/7</Badge>
        </div>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'var(--font-heading)', margin: 0 }}>
            Foire Aux Questions (FAQ)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Retrouvez instantanément les réponses de nos experts sur les fonctionnalités financières, la sécurité et la conformité d'AssoMboa.
          </p>
        </div>

        {/* Search Engine and Navigation Filters */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text"
              placeholder="Rechercher une réponse, un mot-clé (ex: retrait, tontine, bureau)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                fontSize: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-card)',
                color: 'var(--color-text)',
                outline: 'none',
                transition: 'border-color 150ms ease'
              }}
            />
          </div>

          {/* Horizontal Filters Bar */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'all', label: 'Toutes les questions', icon: <HelpCircle size={14} /> },
              { id: 'general', label: 'Tontines & Adhésion', icon: <Users size={14} /> },
              { id: 'wallet', label: 'AS-WALLET & Retraits', icon: <Wallet size={14} /> },
              { id: 'bureau', label: 'Rôles & Bureau', icon: <FileText size={14} /> },
              { id: 'events', label: 'Solidarité & Événements', icon: <Shield size={14} /> }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: activeCategory === cat.id ? 'var(--color-primary)' : 'var(--color-border)',
                  background: activeCategory === cat.id ? 'var(--color-primary-light)' : 'var(--color-card)',
                  color: activeCategory === cat.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  transition: 'all 150ms ease'
                }}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Dynamic Accordion list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map(faq => {
              const isExpanded = expandedId === faq.id
              const userVote = votedIds[faq.id]

              return (
                <Card 
                  key={faq.id}
                  style={{ 
                    padding: '16px', 
                    border: isExpanded ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                    transition: 'all 200ms ease',
                    boxShadow: isExpanded ? 'var(--shadow-md)' : 'none'
                  }}
                >
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <HelpCircle size={18} color={isExpanded ? 'var(--color-primary)' : 'var(--color-text-muted)'} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
                        {faq.question}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '12px', animation: 'fadeIn 200ms ease' }}>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line', margin: '0 0 16px 0' }}>
                        {faq.answer}
                      </p>

                      {/* Vote helpful feedback block */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-sand)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          Cette réponse vous a-t-elle été utile ?
                        </span>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleVote(faq.id, 'up')}
                            disabled={!!userVote}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              background: userVote === 'up' ? 'rgba(16, 185, 129, 0.1)' : '#FFFFFF',
                              border: '1px solid',
                              borderColor: userVote === 'up' ? 'var(--color-success)' : 'var(--color-border)',
                              borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 600,
                              cursor: !!userVote ? 'default' : 'pointer',
                              color: userVote === 'up' ? 'var(--color-success)' : 'var(--color-text-secondary)'
                            }}
                          >
                            <ThumbsUp size={12} /> {faq.usefulCount}
                          </button>
                          
                          <button
                            onClick={() => handleVote(faq.id, 'down')}
                            disabled={!!userVote}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              background: userVote === 'down' ? 'rgba(239, 68, 68, 0.1)' : '#FFFFFF',
                              border: '1px solid',
                              borderColor: userVote === 'down' ? 'var(--color-error)' : 'var(--color-border)',
                              borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 600,
                              cursor: !!userVote ? 'default' : 'pointer',
                              color: userVote === 'down' ? 'var(--color-error)' : 'var(--color-text-secondary)'
                            }}
                          >
                            <ThumbsDown size={12} /> {faq.uselessCount}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })
          ) : (
            <Card style={{ padding: '30px', textAlign: 'center' }}>
              <MessageSquare size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0' }}>Aucune réponse trouvée</h4>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                Essayez d'ajuster vos filtres de catégories ou recherchez un autre terme.
              </p>
            </Card>
          )}
        </div>

        {/* Dynamic question formulation block */}
        <Card style={{ padding: '20px', border: '1.5px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
            <MessageSquare size={20} color="var(--color-primary)" style={{ marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                Vous ne trouvez pas votre réponse ?
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                Posez directement votre question à notre bureau ou support technique. Nous vous répondrons en moins de 24 heures.
              </p>
            </div>
          </div>

          {submitSuccess ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={18} />
              Votre question a été soumise avec succès ! Une notification vous sera envoyée par e-mail.
            </div>
          ) : (
            <form onSubmit={handleQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <Input 
                  id="faq-user-email"
                  label="Votre adresse e-mail" 
                  type="email" 
                  placeholder="exemple@domaine.com" 
                  value={userEmail} 
                  onChange={setUserEmail} 
                  required 
                />
              </div>
              <div>
                <label htmlFor="faq-user-question" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
                  Votre question
                </label>
                <textarea 
                  id="faq-user-question"
                  rows={3}
                  placeholder="Décrivez précisément ce que vous souhaitez savoir..."
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-card)',
                    color: 'var(--color-text)',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>
              <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start' }} disabled={!userEmail || !userQuestion}>
                <Send size={14} /> Envoyer ma question
              </Button>
            </form>
          )}
        </Card>

      </div>
    </div>
  )
}
