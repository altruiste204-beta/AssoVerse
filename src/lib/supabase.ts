import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const hasValidCredentials = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
)

// In-memory / localStorage mock client for development/demo when Supabase credentials are not provided
function createMockClient() {
  const STORAGE_KEY = 'assomboa_mock_db'
  const AUTH_KEY = 'assomboa_mock_auth'

  const demoUser = {
    id: 'usr-demo-1',
    email: 'altruiste2.0.4@gmail.com',
  }

  const demoProfile = {
    id: 'usr-demo-1',
    full_name: 'Alain Mboa',
    phone: '+237 690 123 456',
    id_document_url: null,
    kyc_status: 'verified',
    kyc_verified_at: '2026-09-01T10:00:00Z',
    preferred_language: 'fr',
    avatar_url: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  }

  const memberProfile = {
    id: 'usr-demo-2',
    full_name: 'Clarisse Ngo',
    phone: '+237 677 890 123',
    id_document_url: null,
    kyc_status: 'verified',
    kyc_verified_at: '2026-09-01T10:00:00Z',
    preferred_language: 'fr',
    avatar_url: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  }

  const initialAssoc = {
    id: 'assoc-1',
    name: 'Tontine Solidarité Yaoundé',
    owner_id: 'usr-demo-1',
    receipt_document_url: null,
    receipt_number: 'RC/YAO/2026/042',
    city: 'Yaoundé',
    region: 'Centre',
    association_type: 'tontine',
    visibility: 'private',
    contribution_frequency: 'monthly',
    contribution_amount: 50000,
    cassation_date: '2026-12-31',
    status: 'active',
    is_premium: true,
    description: 'Tontine d\'entraide et d\'investissement communautaire à Yaoundé',
    created_at: '2026-08-01T08:00:00Z',
    updated_at: '2026-08-01T08:00:00Z',
  }

  const initialAssoc2 = {
    id: 'assoc-2',
    name: 'GIC Agricole des Hauts Plateaux',
    owner_id: 'usr-demo-1',
    receipt_document_url: null,
    receipt_number: 'GIC/OU/2026/118',
    city: 'Bafoussam',
    region: 'Ouest',
    association_type: 'gic',
    visibility: 'public',
    contribution_frequency: 'monthly',
    contribution_amount: 25000,
    cassation_date: null,
    status: 'active',
    is_premium: false,
    description: 'Groupement d\'intérêt commun agropastoral',
    created_at: '2026-08-15T09:00:00Z',
    updated_at: '2026-08-15T09:00:00Z',
  }

  function getDB(): Record<string, any[]> {
    let storedData: Record<string, any[]> | null = null
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) storedData = JSON.parse(stored)
    } catch {
      // ignore
    }

    const isClean = localStorage.getItem('assomboa_db_mode') === 'clean'
    if (isClean && !storedData) {
      storedData = {
        profiles: [],
        associations: [],
        user_wallets: [],
        user_wallet_transactions: [],
        tontine_rounds: [],
        tontine_contributions: [],
        association_members: [],
        bureau_assignments: [],
        wallets: [],
        transactions: [],
        main_levees: [],
        main_levee_contributions: [],
        meetings: [],
        association_events: [],
        conversations: [],
        messages: [],
        transaction_requests: [],
        bureau_approvals: [],
        join_codes: [],
      }
      saveDB(storedData)
    }

    const defaultData: Record<string, any[]> = {
      profiles: [demoProfile, memberProfile],
      associations: [initialAssoc, initialAssoc2],
      user_wallets: [
        {
          id: 'uwal-1',
          user_id: 'usr-demo-1',
          cached_balance: 125000,
          total_contributed: 250000,
          total_received: 600000,
          currency: 'XAF',
          created_at: '2026-08-01T08:00:00Z',
          updated_at: new Date().toISOString(),
        },
      ],
      user_wallet_transactions: [
        {
          id: 'uwt-1',
          user_id: 'usr-demo-1',
          type: 'tontine_payout',
          amount: 600000,
          title: 'Ramassage Tour de Tontine n°2',
          association_name: 'Tontine Solidarité Yaoundé',
          payment_method: 'wallet',
          status: 'success',
          created_at: '2026-08-15T10:00:00Z',
        },
        {
          id: 'uwt-2',
          user_id: 'usr-demo-1',
          type: 'cotisation',
          amount: 50000,
          title: 'Cotisation Tour n°2 - Août',
          association_name: 'Tontine Solidarité Yaoundé',
          payment_method: 'wallet',
          status: 'success',
          created_at: '2026-08-05T09:00:00Z',
        },
        {
          id: 'uwt-3',
          user_id: 'usr-demo-1',
          type: 'deposit',
          amount: 75000,
          title: 'Recharge MTN Mobile Money',
          association_name: null,
          payment_method: 'mtn_momo',
          status: 'success',
          created_at: '2026-09-02T16:00:00Z',
        },
      ],
      tontine_rounds: [
        {
          id: 'round-1',
          association_id: 'assoc-1',
          round_number: 1,
          title: 'Tour n°1 - Juillet 2026',
          beneficiary_id: 'usr-demo-3',
          beneficiary_name: 'Marcelle Tchatchoua',
          pot_amount: 600000,
          contribution_amount: 50000,
          due_date: '2026-07-31',
          status: 'completed',
        },
        {
          id: 'round-2',
          association_id: 'assoc-1',
          round_number: 2,
          title: 'Tour n°2 - Août 2026',
          beneficiary_id: 'usr-demo-1',
          beneficiary_name: 'Alain Mboa (Moi)',
          pot_amount: 600000,
          contribution_amount: 50000,
          due_date: '2026-08-31',
          status: 'completed',
        },
        {
          id: 'round-3',
          association_id: 'assoc-1',
          round_number: 3,
          title: 'Tour n°3 - Septembre 2026',
          beneficiary_id: 'usr-demo-2',
          beneficiary_name: 'Clarisse Ngo',
          pot_amount: 600000,
          contribution_amount: 50000,
          due_date: '2026-09-30',
          status: 'active',
        },
        {
          id: 'round-4',
          association_id: 'assoc-1',
          round_number: 4,
          title: 'Tour n°4 - Octobre 2026',
          beneficiary_id: 'usr-demo-4',
          beneficiary_name: 'Jean-Paul Kamga',
          pot_amount: 600000,
          contribution_amount: 50000,
          due_date: '2026-10-31',
          status: 'upcoming',
        },
      ],
      tontine_contributions: [
        {
          id: 'tc-1',
          round_id: 'round-2',
          user_id: 'usr-demo-1',
          amount: 50000,
          status: 'success',
          paid_at: '2026-08-05T09:00:00Z',
          payment_method: 'wallet',
        },
      ],
      association_members: [
        { id: 'mem-1', association_id: 'assoc-1', user_id: 'usr-demo-1', status: 'active', joined_at: '2026-08-01T08:00:00Z', profile: demoProfile },
        { id: 'mem-2', association_id: 'assoc-1', user_id: 'usr-demo-2', status: 'active', joined_at: '2026-08-02T09:00:00Z', profile: memberProfile },
        { id: 'mem-3', association_id: 'assoc-2', user_id: 'usr-demo-1', status: 'active', joined_at: '2026-08-15T09:00:00Z', profile: demoProfile },
      ],
      bureau_assignments: [
        { id: 'ba-1', association_id: 'assoc-1', user_id: 'usr-demo-1', role: 'proprio', profile: demoProfile },
        { id: 'ba-2', association_id: 'assoc-1', user_id: 'usr-demo-2', role: 'secretariat', profile: memberProfile },
        { id: 'ba-3', association_id: 'assoc-2', user_id: 'usr-demo-1', role: 'proprio', profile: demoProfile },
      ],
      wallets: [
        { id: 'wal-1', association_id: 'assoc-1', cached_balance: 650000 },
        { id: 'wal-2', association_id: 'assoc-2', cached_balance: 175000 },
      ],
      transactions: [
        { id: 'tx-1', association_id: 'assoc-1', amount: 50000, type: 'collection', status: 'success', created_at: '2026-09-02T14:30:00Z' },
        { id: 'tx-2', association_id: 'assoc-1', amount: 50000, type: 'collection', status: 'success', created_at: '2026-08-02T11:00:00Z' },
      ],
      main_levees: [
        {
          id: 'ml-1',
          association_id: 'assoc-1',
          title: 'Main-levée Scolaire Rentrée 2026',
          beneficiary_name: 'Clarisse Ngo',
          beneficiary_phone: '+237 677 890 123',
          target_amount: 250000,
          collected_amount: 150000,
          deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
          mode: 'flexible',
          status: 'active',
          created_by: 'usr-demo-1',
          created_at: '2026-09-01T10:00:00Z',
          main_levee_contributions: [
            { id: 'mlc-1', main_levee_id: 'ml-1', contributor_id: 'usr-demo-1', amount: 50000, status: 'success', created_at: '2026-09-01T11:00:00Z' },
            { id: 'mlc-2', main_levee_id: 'ml-1', contributor_id: 'usr-demo-2', amount: 100000, status: 'success', created_at: '2026-09-02T09:00:00Z' },
          ],
        },
      ],
      main_levee_contributions: [
        { id: 'mlc-1', main_levee_id: 'ml-1', contributor_id: 'usr-demo-1', amount: 50000, status: 'success', created_at: '2026-09-01T11:00:00Z' },
        { id: 'mlc-2', main_levee_id: 'ml-1', contributor_id: 'usr-demo-2', amount: 100000, status: 'success', created_at: '2026-09-02T09:00:00Z' },
      ],
      meetings: [
        {
          id: 'mtg-1',
          association_id: 'assoc-1',
          title: 'Assemblée Générale Mensuelle',
          description: 'Ordre du jour: Bilan financier et validation de la main-levée',
          platform: 'meet',
          link: 'https://meet.google.com/abc-defg-hij',
          scheduled_at: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
          duration_minutes: 60,
          created_by: 'usr-demo-1',
          created_at: '2026-09-01T08:00:00Z',
        },
      ],
      association_events: [
        {
          id: 'ev-1',
          association_id: 'assoc-1',
          title: 'Mariage coutumier de Paul',
          event_type: 'heureux',
          target_amount: 100000,
          collected_amount: 75000,
          deadline: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
          status: 'active',
          created_by: 'usr-demo-1',
          created_at: '2026-09-02T08:00:00Z',
        },
      ],
      conversations: [
        { id: 'conv-1', association_id: 'assoc-1' },
      ],
      messages: [
        { id: 'msg-1', conversation_id: 'conv-1', sender_id: 'usr-demo-2', content: 'Bonjour à tous, bienvenue sur AssoMboa!', created_at: new Date(Date.now() - 3600 * 1000).toISOString(), sender: memberProfile },
        { id: 'msg-2', conversation_id: 'conv-1', sender_id: 'usr-demo-1', content: 'Bonjour Clarisse! Toutes les cotisations sont à jour.', created_at: new Date().toISOString(), sender: demoProfile },
      ],
      transaction_requests: [
        {
          id: 'tr-1',
          association_id: 'assoc-1',
          requested_by: 'usr-demo-1',
          type: 'collection',
          amount: 50000,
          description: 'Versement mensuel tontine',
          beneficiary_name: 'Trésorerie AssoMboa',
          beneficiary_phone: '+237 690 123 456',
          required_approvals: 2,
          status: 'pending',
          created_at: '2026-09-03T10:00:00Z',
          approvals: [
            { id: 'ap-1', transaction_request_id: 'tr-1', approver_id: 'usr-demo-1', approved: true, profile: demoProfile },
          ],
        },
      ],
      bureau_approvals: [
        { id: 'ap-1', transaction_request_id: 'tr-1', approver_id: 'usr-demo-1', approved: true, profile: demoProfile },
      ],
      join_codes: [
        { id: 'jc-1', code: 'MBOA-2026', association_id: 'assoc-1', created_by: 'usr-demo-1', is_active: true, created_at: new Date().toISOString() },
      ],
    }
    if (storedData) {
      let changed = false
      for (const key of Object.keys(defaultData)) {
        if (!storedData[key]) {
          storedData[key] = defaultData[key]
          changed = true
        }
      }
      if (changed) saveDB(storedData)
      return storedData
    }

    saveDB(defaultData)
    return defaultData
  }

  function saveDB(data: Record<string, any[]>) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore
    }
  }

  function getStoredAuth(): { user: any; session: any } | null {
    try {
      const stored = localStorage.getItem(AUTH_KEY)
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }

    const isClean = localStorage.getItem('assomboa_db_mode') === 'clean'
    if (isClean) {
      return null
    }

    // Default logged in demo session
    return {
      user: demoUser,
      session: {
        access_token: 'mock-token',
        user: demoUser,
      },
    }
  }

  function saveAuth(auth: { user: any; session: any } | null) {
    try {
      if (auth) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
      } else {
        localStorage.removeItem(AUTH_KEY)
      }
    } catch {
      // ignore
    }
  }

  const authListeners: Array<(event: string, session: any) => void> = []

  const auth = {
    async getSession() {
      const current = getStoredAuth()
      return { data: { session: current?.session ?? null }, error: null }
    },
    async getUser() {
      const current = getStoredAuth()
      return { data: { user: current?.user ?? null }, error: null }
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.push(callback)
      const current = getStoredAuth()
      if (current?.session) {
        setTimeout(() => callback('SIGNED_IN', current.session), 0)
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const index = authListeners.indexOf(callback)
              if (index !== -1) authListeners.splice(index, 1)
            },
          },
        },
      }
    },
    async signUp({ email, options }: { email: string; password?: string; options?: { data?: any } }) {
      const id = `usr-${Date.now()}`
      const user = { id, email }
      const session = { access_token: `token-${id}`, user }
      saveAuth({ user, session })

      const db = getDB()
      const newProfile = {
        id,
        full_name: options?.data?.full_name || email.split('@')[0],
        phone: options?.data?.phone || '',
        id_document_url: null,
        kyc_status: 'verified',
        kyc_verified_at: new Date().toISOString(),
        preferred_language: 'fr',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      db.profiles = db.profiles || []
      db.profiles.push(newProfile)
      saveDB(db)

      authListeners.forEach((fn) => fn('SIGNED_IN', session))
      return { data: { user, session }, error: null }
    },
    async signInWithPassword({ email }: { email: string; password?: string }) {
      const current = getStoredAuth()
      const user = current?.user || { id: 'usr-demo-1', email }
      const session = { access_token: 'mock-token', user }
      saveAuth({ user, session })
      authListeners.forEach((fn) => fn('SIGNED_IN', session))
      return { data: { user, session }, error: null }
    },
    async signOut() {
      saveAuth(null)
      authListeners.forEach((fn) => fn('SIGNED_OUT', null))
      return { error: null }
    },
  }

  function createQueryBuilder(table: string) {
    let filters: Array<(row: any) => boolean> = []
    let sorter: ((a: any, b: any) => number) | null = null
    let limitCount: number | null = null
    let isSingle = false
    let isMaybeSingle = false
    let isHead = false

    const builder: any = {
      select(_columns = '*', options?: { count?: string; head?: boolean }) {
        if (options?.head) isHead = Boolean(options.head)
        return builder
      },
      insert(rows: any | any[]) {
        const rowList = Array.isArray(rows) ? rows : [rows]
        const db = getDB()
        if (!db[table]) db[table] = []
        const createdList = rowList.map((r) => ({
          id: r.id || `${table.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          created_at: r.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...r,
        }))
        db[table].push(...createdList)
        saveDB(db)
        return {
          ...builder,
          select() {
            return {
              ...builder,
              single: async () => ({ data: createdList[0] || null, error: null }),
              maybeSingle: async () => ({ data: createdList[0] || null, error: null }),
            }
          },
          then(resolve: any) {
            return resolve({ data: createdList, error: null })
          },
        }
      },
      update(updates: any) {
        return {
          ...builder,
          eq(col: string, val: any) {
            const db = getDB()
            const rows = db[table] || []
            let count = 0
            rows.forEach((row) => {
              if (row[col] === val) {
                Object.assign(row, updates, { updated_at: new Date().toISOString() })
                count++
              }
            })
            saveDB(db)
            return {
              ...builder,
              then(resolve: any) {
                return resolve({ data: null, count, error: null })
              },
            }
          },
        }
      },
      delete() {
        return {
          ...builder,
          eq(col: string, val: any) {
            const db = getDB()
            if (db[table]) {
              db[table] = db[table].filter((r) => r[col] !== val)
              saveDB(db)
            }
            return {
              ...builder,
              then(resolve: any) {
                return resolve({ data: null, error: null })
              },
            }
          },
        }
      },
      eq(col: string, val: any) {
        filters.push((r) => r[col] === val)
        return builder
      },
      neq(col: string, val: any) {
        filters.push((r) => r[col] !== val)
        return builder
      },
      gte(col: string, val: any) {
        filters.push((r) => r[col] >= val)
        return builder
      },
      lte(col: string, val: any) {
        filters.push((r) => r[col] <= val)
        return builder
      },
      in(col: string, vals: any[]) {
        filters.push((r) => vals.includes(r[col]))
        return builder
      },
      order(col: string, { ascending = true }: { ascending?: boolean } = {}) {
        sorter = (a: any, b: any) => {
          if (a[col] < b[col]) return ascending ? -1 : 1
          if (a[col] > b[col]) return ascending ? 1 : -1
          return 0
        }
        return builder
      },
      limit(n: number) {
        limitCount = n
        return builder
      },
      single() {
        isSingle = true
        return builder
      },
      maybeSingle() {
        isMaybeSingle = true
        return builder
      },
      async then(resolve: (res: { data: any; error: any; count?: number }) => any) {
        const db = getDB()
        let rows = [...(db[table] || [])]

        for (const f of filters) {
          rows = rows.filter(f)
        }

        if (sorter) {
          rows.sort(sorter)
        }

        const totalCount = rows.length

        if (limitCount !== null) {
          rows = rows.slice(0, limitCount)
        }

        // Auto-populate relationships
        if (table === 'messages') {
          const profiles = db.profiles || []
          rows = rows.map((m) => ({
            ...m,
            sender: m.sender || profiles.find((p) => p.id === m.sender_id) || demoProfile,
          }))
        } else if (table === 'bureau_assignments' || table === 'association_members') {
          const profiles = db.profiles || []
          rows = rows.map((a) => ({
            ...a,
            profile: a.profile || profiles.find((p) => p.id === a.user_id) || demoProfile,
          }))
        } else if (table === 'transaction_requests') {
          const approvals = db.bureau_approvals || []
          const profiles = db.profiles || []
          rows = rows.map((tr) => ({
            ...tr,
            approvals: tr.approvals || approvals
              .filter((ap) => ap.transaction_request_id === tr.id)
              .map((ap) => ({ ...ap, profile: ap.profile || profiles.find((p) => p.id === ap.approver_id) })),
          }))
        } else if (table === 'main_levees') {
          const contributions = db.main_levee_contributions || []
          rows = rows.map((ml) => ({
            ...ml,
            contributions: ml.contributions || contributions.filter((c) => c.main_levee_id === ml.id),
            main_levee_contributions: ml.main_levee_contributions || contributions.filter((c) => c.main_levee_id === ml.id),
          }))
        }

        if (isHead) {
          return resolve({ data: null, count: totalCount, error: null })
        }

        if (isSingle) {
          return resolve({ data: rows[0] || null, count: totalCount, error: rows[0] ? null : { message: 'Row not found' } })
        }

        if (isMaybeSingle) {
          return resolve({ data: rows[0] || null, count: totalCount, error: null })
        }

        return resolve({ data: rows, count: totalCount, error: null })
      },
    }

    return builder
  }

  const storage = {
    from(_bucket: string) {
      return {
        async upload(path: string, _file: any) {
          return { data: { path }, error: null }
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400#${encodeURIComponent(path)}` } }
        },
      }
    },
  }

  return {
    auth,
    from: createQueryBuilder,
    storage,
    channel(_name: string) {
      const ch: any = {
        on(_event: string, _filter: any, _callback: (payload: any) => void) {
          return ch
        },
        subscribe(_callback?: (status: string) => void) {
          return ch
        },
        unsubscribe() {
          return Promise.resolve()
        },
      }
      return ch
    },
    removeChannel(_channel: any) {
      return Promise.resolve('ok')
    },
    removeAllChannels() {
      return Promise.resolve(['ok'])
    },
    getChannels() {
      return []
    },
    functions: {
      async invoke(_name: string, _options?: any) {
        return { data: { status: 'success' }, error: null }
      },
    },
  }
}

export const supabase = hasValidCredentials
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (createMockClient() as any)

