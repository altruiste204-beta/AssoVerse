import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

function parseStyleString(str: string): React.CSSProperties {
  const props: Record<string, string> = {}
  str.split(';').forEach((decl) => {
    const [key, ...valParts] = decl.split(':')
    if (key && valParts.length) {
      const camelKey = key.trim().replace(/-([a-z])/g, (_, c) => c)
      props[camelKey] = valParts.join(':').trim()
    }
  })
  return props as React.CSSProperties
}

function parseVariantStyle(str: string): React.CSSProperties {
  return parseStyleString(str)
}

function parseSizeStyle(str: string): React.CSSProperties {
  return parseStyleString(str)
}

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  style?: React.CSSProperties
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'background: var(--color-primary); color: var(--color-primary-text); font-weight: 600;',
  secondary: 'background: var(--color-sand); color: var(--color-text); font-weight: 500;',
  outline: 'background: transparent; color: var(--color-primary); border: 1.5px solid var(--color-primary); font-weight: 600;',
  ghost: 'background: transparent; color: var(--color-text-secondary); font-weight: 500;',
  danger: 'background: var(--color-error); color: #FFFFFF; font-weight: 600;',
  accent: 'background: var(--color-accent); color: var(--color-accent-text); font-weight: 600;',
  success: 'background: var(--color-success); color: #FFFFFF; font-weight: 600;',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'padding: 6px 16px; font-size: 13px; min-height: 36px; border-radius: 9999px;',
  md: 'padding: 10px 24px; font-size: 14px; min-height: 42px; border-radius: 9999px;',
  lg: 'padding: 14px 32px; font-size: 16px; min-height: 48px; border-radius: 9999px;',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  loading,
  onClick,
  type = 'button',
  className,
  style,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(className)}
      style={{
        fontWeight: 500,
        transition: 'all 150ms ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled || loading ? 0.6 : 1,
        ...parseVariantStyle(variantStyles[variant]),
        ...parseSizeStyle(sizeStyles[size]),
        ...style,
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) e.currentTarget.style.transform = 'scale(0.97)'
      }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {loading && <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 600ms linear infinite' }} />}
      {children}
    </button>
  )
}

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

export function Card({ children, className, onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(className)}
      style={{
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: '20px',
        transition: 'all 250ms ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface InputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  multiline?: boolean
  rows?: number
  error?: string
  style?: React.CSSProperties
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
  multiline,
  rows = 3,
  error,
  style,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
}: InputProps) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 15px',
    border: `1.5px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-card)',
    color: 'var(--color-text)',
    fontSize: '15px',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    outline: 'none',
    ...style,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          style={inputStyle}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedby}
          aria-invalid={!!error}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--color-primary)'
            e.target.style.boxShadow = '0 0 0 3px var(--color-focus-ring)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--color-border)'
            e.target.style.boxShadow = 'none'
          }}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={inputStyle}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedby}
          aria-invalid={!!error}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--color-primary)'
            e.target.style.boxShadow = '0 0 0 3px var(--color-focus-ring)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--color-border)'
            e.target.style.boxShadow = 'none'
          }}
        />
      )}
      {error && <span style={{ fontSize: '12px', color: 'var(--color-error)' }}>{error}</span>}
    </div>
  )
}

interface SelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  required?: boolean
  disabled?: boolean
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

export function Select({
  label,
  value,
  onChange,
  options,
  required,
  disabled,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
}: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        style={{
          width: '100%',
          padding: '11px 15px',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-card)',
          color: 'var(--color-text)',
          fontSize: '15px',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary)'
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-focus-ring)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'primary' | 'accent'
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const colors: Record<string, React.CSSProperties> = {
    default: { background: 'var(--color-sand)', color: 'var(--color-text-secondary)' },
    success: { background: 'var(--color-success)', color: '#FFFFFF' },
    warning: { background: 'var(--color-warning)', color: '#FFFFFF' },
    error: { background: 'var(--color-error)', color: '#FFFFFF' },
    primary: { background: 'var(--color-primary)', color: 'var(--color-primary-text)' },
    accent: { background: 'var(--color-accent)', color: 'var(--color-accent-text)' },
  }
  return (
    <span style={{
      ...colors[variant],
      padding: size === 'sm' ? '3px 9px' : '5px 12px',
      fontSize: size === 'sm' ? '11px' : '12px',
      borderRadius: '9999px',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      letterSpacing: '0.2px',
    }}>
      {children}
    </span>
  )
}

interface ProgressBarProps {
  value: number
  max: number
  color?: string
  height?: number
}

export function ProgressBar({ value, max, color, height = 8 }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{
      width: '100%',
      height: `${height}px`,
      background: 'var(--color-border)',
      borderRadius: '9999px',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: color || 'var(--color-primary)',
        borderRadius: '9999px',
        transition: 'width 600ms ease',
        animation: 'progressFill 800ms ease',
      }} />
    </div>
  )
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: number
}

export function Modal({ open, onClose, title, children, maxWidth = 520 }: ModalProps) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-dialog"
        style={{
          maxWidth: `${maxWidth}px`,
        }}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-heading)', margin: 0 }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Fermer"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                background: 'var(--color-sand)',
                border: 'none',
                transition: 'all 150ms ease',
              }}
            >
              <X size={17} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

interface SpinnerProps {
  size?: number
}

export function Spinner({ size = 24 }: SpinnerProps) {
  return (
    <div style={{
      width: size,
      height: size,
      border: `3px solid var(--color-border)`,
      borderTopColor: 'var(--color-primary)',
      borderRadius: '50%',
      animation: 'spin 600ms linear infinite',
      margin: '0 auto',
    }} />
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      gap: '12px',
    }}>
      {icon && <div style={{ opacity: 0.4, fontSize: '48px' }}>{icon}</div>}
      <h3 style={{ fontSize: '18px', color: 'var(--color-text)' }}>{title}</h3>
      {description && <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '300px' }}>{description}</p>}
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  )
}

export * from './CameroonPattern'
export * from './ErrorBoundary'

