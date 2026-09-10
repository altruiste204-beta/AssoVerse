import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { supabase } from '@/lib/supabase'
import { Button, Input, Card } from '@/components/ui'
import { ShieldCheck, CheckCircle2, Clock, Camera, AlertCircle } from 'lucide-react'

export function KycPage() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [docType, setDocType] = useState<'cni' | 'passeport' | 'permis'>('cni')
  
  // Base64 compressed image states
  const [cniImg, setCniImg] = useState<string | null>(null)
  const [selfieImg, setSelfieImg] = useState<string | null>(null)
  const [livenessImg, setLivenessImg] = useState<string | null>(null)
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  // For showing submission status from kyc_submissions table
  const [submission, setSubmission] = useState<any>(null)

  const loadKycSubmission = async () => {
    if (!user) return
    try {
      const { data, error: fetchErr } = await supabase
        .from('kyc_submissions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (fetchErr) throw fetchErr
      setSubmission(data)
    } catch (err) {
      console.error("Error loading KYC submission:", err)
    }
  }

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
    }
    loadKycSubmission()
  }, [profile, user])

  if (!user) {
    navigate('/login')
    return null
  }

  // Image compression function
  const compressAndSet = (file: File, setter: (val: string) => void) => {
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const maxDim = 1280

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setError('Impossible de créer le contexte canvas.')
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7) // Compress to JPEG with 0.7 quality (perfect for 3G!)
        setter(dataUrl)
      }
      img.onerror = () => setError('Impossible de charger l\'image.')
      img.src = e.target?.result as string
    }
    reader.onerror = () => setError('Erreur de lecture du fichier.')
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0]
    if (file) {
      compressAndSet(file, setter)
    }
  }

  const handleSubmit = async () => {
    if (!fullName.trim() || !phone.trim() || !cniImg || !selfieImg || !livenessImg) {
      setError("Veuillez remplir tous les champs et capturer les 3 photos requises.")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        // Fallback for mock environment
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone,
            kyc_status: 'pending',
          })
          .eq('id', user.id)

        await supabase
          .from('kyc_submissions')
          .upsert({
            user_id: user.id,
            document_type: docType,
            cni_path: 'mock_cni_path',
            selfie_path: 'mock_selfie_path',
            liveness_path: 'mock_liveness_path',
            status: 'pending',
          })

        setSuccessMsg("Vérification KYC soumise avec succès (environnement démo).")
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const response = await fetch(
          `${supabaseUrl}/functions/v1/submit-kyc-liveness`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              document_type: docType,
              cni_base64: cniImg,
              selfie_base64: selfieImg,
              liveness_base64: livenessImg,
            }),
          }
        )

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || "Une erreur est survenue lors de la soumission.")
        }

        // Update local profile properties
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone,
          })
          .eq('id', user.id)

        setSuccessMsg("Votre dossier de vérification KYC (Liveness check) a été soumis et est en cours d'examen.")
      }

      await refreshProfile()
      await loadKycSubmission()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion au serveur KYC.")
    } finally {
      setSubmitting(false)
    }
  }

  const kycStatus = profile?.kyc_status || 'pending'
  const isKycVerified = profile?.kyc_verified || kycStatus === 'verified'

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '640px', width: '100%', margin: '0 auto' }} className="animate-slide-up">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <ShieldCheck size={32} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '24px', color: 'var(--color-text)', marginBottom: '8px', fontWeight: 600 }}>
            Vérification d'identité KYC & Liveness
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Pour sécuriser AssoMboa et valider vos transactions de plus de 50 000 XAF, merci de compléter la vérification liveness.
          </p>
        </div>

        {isKycVerified ? (
          <Card style={{ textAlign: 'center', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <CheckCircle2 size={56} color="var(--color-success)" />
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)' }}>Votre identité est vérifiée</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '400px' }}>
              Félicitations, votre compte est entièrement certifié. Vous pouvez à présent effectuer tous vos versements, cotisations et retraits sans aucune limite.
            </p>
            <Button onClick={() => navigate('/dashboard')} style={{ marginTop: '8px' }}>
              Retour au tableau de bord
            </Button>
          </Card>
        ) : kycStatus === 'pending' && (submission?.status === 'pending' || !submission) ? (
          <Card style={{ textAlign: 'center', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Clock size={56} color="var(--color-warning)" />
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)' }}>Examen en cours</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '400px' }}>
              Nous vérifions actuellement vos pièces d'identité et votre liveness. Cette étape prend généralement moins de 24 heures. Vous serez notifié dès validation.
            </p>
            <Button onClick={() => navigate('/dashboard')} variant="secondary">
              Retour à l'accueil
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {kycStatus === 'rejected' && (
              <div style={{
                padding: '16px',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '12px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}>
                <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#991B1B', margin: '0 0 4px 0' }}>
                    Dossier KYC rejeté
                  </h4>
                  <p style={{ fontSize: '13px', color: '#7F1D1D', margin: 0, lineHeight: 1.4 }}>
                    Motif : {submission?.rejection_reason || "Les documents fournis ne sont pas lisibles ou ne correspondent pas aux critères de liveness."}
                  </p>
                </div>
              </div>
            )}

            {successMsg && (
              <div style={{
                padding: '16px',
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: '12px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}>
                <CheckCircle2 size={20} color="#16A34A" />
                <span style={{ fontSize: '14px', color: '#14532D', fontWeight: 500 }}>
                  {successMsg}
                </span>
              </div>
            )}

            <Card style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', margin: 0 }}>
                  Informations Personnelles
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="md:grid-cols-2">
                  <Input
                    label="Nom complet (comme indiqué sur la pièce)"
                    value={fullName}
                    onChange={setFullName}
                    required
                  />
                  <Input
                    label="Numéro de téléphone"
                    value={phone}
                    onChange={setPhone}
                    required
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                    Type de document d'identité *
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {(['cni', 'passeport', 'permis'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDocType(type)}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: `1px solid ${docType === type ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          background: docType === type ? 'var(--color-primary-light)' : 'var(--color-card)',
                          color: docType === type ? 'var(--color-primary)' : 'var(--color-text)',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                          textTransform: 'uppercase',
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', margin: '12px 0 0 0' }}>
                  Captures Liveness & Pièces (JPEG/PNG, max 3Mo)
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Photo 1: CNI Recto */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                        1. Recto de votre {docType.toUpperCase()}
                      </span>
                      {cniImg && <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 500 }}>Prêt</span>}
                    </div>
                    
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '140px',
                      border: `2px dashed ${cniImg ? 'var(--color-success)' : 'var(--color-border)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: 'var(--color-bg-light)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'border-color 150ms ease',
                    }}>
                      {cniImg ? (
                        <>
                          <img src={cniImg} alt="CNI Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Camera size={14} color="#fff" />
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                          <Camera size={24} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
                          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'block' }}>
                            Prendre en photo le recto
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleFileChange(e, setCniImg)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {/* Photo 2: Simple Selfie */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                        2. Selfie simple (Visage centré, éclairé)
                      </span>
                      {selfieImg && <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 500 }}>Prêt</span>}
                    </div>
                    
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '140px',
                      border: `2px dashed ${selfieImg ? 'var(--color-success)' : 'var(--color-border)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: 'var(--color-bg-light)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'border-color 150ms ease',
                    }}>
                      {selfieImg ? (
                        <>
                          <img src={selfieImg} alt="Selfie Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Camera size={14} color="#fff" />
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                          <Camera size={24} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
                          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'block' }}>
                            Prendre un selfie
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={(e) => handleFileChange(e, setSelfieImg)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {/* Photo 3: Selfie with Doc + Date */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                        3. Selfie en tenant votre {docType.toUpperCase()} + un papier avec la date du jour
                      </span>
                      {livenessImg && <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 500 }}>Prêt</span>}
                    </div>
                    
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '140px',
                      border: `2px dashed ${livenessImg ? 'var(--color-success)' : 'var(--color-border)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: 'var(--color-bg-light)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'border-color 150ms ease',
                    }}>
                      {livenessImg ? (
                        <>
                          <img src={livenessImg} alt="Liveness Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Camera size={14} color="#fff" />
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                          <Camera size={24} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
                          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'block' }}>
                            Prendre le selfie de contrôle liveness
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={(e) => handleFileChange(e, setLivenessImg)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                </div>

                {error && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--color-error)',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontSize: '13px',
                    lineHeight: 1.4,
                  }}>
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  fullWidth
                  size="lg"
                  loading={submitting}
                  disabled={!cniImg || !selfieImg || !livenessImg || !fullName || !phone}
                  style={{ marginTop: '12px' }}
                >
                  Soumettre mon dossier liveness
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '13px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    </div>
  )
}
