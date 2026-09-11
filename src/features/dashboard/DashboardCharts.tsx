import { Card } from '@/components/ui'
import { formatXAF } from '@/lib/utils'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

export interface ChartDataItem {
  date: string
  balance: number
  cotisations: number
}

interface DashboardChartsProps {
  chartData: ChartDataItem[]
}

export function DashboardCharts({ chartData }: DashboardChartsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
      {/* Solde Global Card */}
      <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
            Évolution de la Trésorerie
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Solde global de la caisse au fil du temps
          </p>
        </div>
        <div style={{ width: '100%', height: '220px', fontSize: '11px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14532D" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#14532D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                stroke="var(--color-text-secondary)"
              />
              <YAxis
                tickFormatter={(v) => `${v / 1000}k`}
                tickLine={false}
                axisLine={false}
                stroke="var(--color-text-secondary)"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div
                        style={{
                          background: 'var(--color-card)',
                          border: '1.5px solid var(--color-border)',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          fontSize: '12px',
                          color: 'var(--color-text)',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '2px', color: 'var(--color-text-muted)' }}>{label}</div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#14532D', display: 'inline-block' }} />
                          <span style={{ fontWeight: 500 }}>Trésorerie :</span>
                          <span style={{ fontWeight: 700 }}>{formatXAF(payload[0].value as number)}</span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#14532D"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBalance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cotisations Card */}
      <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
            Évolution des Cotisations
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Cumul des fonds de cotisations collectés
          </p>
        </div>
        <div style={{ width: '100%', height: '220px', fontSize: '11px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCotis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8BC34A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8BC34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                stroke="var(--color-text-secondary)"
              />
              <YAxis
                tickFormatter={(v) => `${v / 1000}k`}
                tickLine={false}
                axisLine={false}
                stroke="var(--color-text-secondary)"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div
                        style={{
                          background: 'var(--color-card)',
                          border: '1.5px solid var(--color-border)',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          fontSize: '12px',
                          color: 'var(--color-text)',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '2px', color: 'var(--color-text-muted)' }}>{label}</div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8BC34A', display: 'inline-block' }} />
                          <span style={{ fontWeight: 500 }}>Cotisations :</span>
                          <span style={{ fontWeight: 700 }}>{formatXAF(payload[0].value as number)}</span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="cotisations"
                stroke="#8BC34A"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCotis)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
