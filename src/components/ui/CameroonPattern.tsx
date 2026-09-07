import { useMemo } from 'react'

// Traditional Cameroon-inspired geometric patterns (Ndop and Ekang masks)
// These SVG components and pattern definitions are designed to be extremely elegant, high contrast, and authentic.

// Ndop textile patterns are characterized by repeating diamond grids, concentric squares, chevrons, and animal symbols (lizards, frogs, tortoises, or masks).
// Ekang masks are characterized by elongated geometry, stylized slit eyes, high brows, and symmetric paint scarifications.

export function getNdopPatternSvg(color = 'rgba(143, 1, 0, 0.06)'): string {
  // Returns a base64 encoded or raw inline SVG pattern for use in backgrounds
  const svg = `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <!-- Ndop grid pattern -->
    <path d="M 0,40 L 40,0 L 80,40 L 40,80 Z" fill="none" stroke="${color}" stroke-width="1" />
    <path d="M 10,40 L 40,10 L 70,40 L 40,70 Z" fill="none" stroke="${color}" stroke-width="0.75" stroke-dasharray="2,2" />
    <!-- Centered traditional dot / cross -->
    <circle cx="40" cy="40" r="3" fill="${color}" />
    <path d="M 40,32 L 40,48 M 32,40 L 48,40" stroke="${color}" stroke-width="0.75" />
    <!-- Chevrons at corners -->
    <path d="M 0,0 L 8,8 M 80,0 L 72,8 M 0,80 L 8,72 M 80,80 L 72,72" stroke="${color}" stroke-width="1" />
    <path d="M 0,20 L 20,0 M 60,0 L 80,20 M 0,60 L 20,80 M 60,80 L 80,60" stroke="${color}" stroke-width="0.5" />
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function getEkangPatternSvg(color = 'rgba(255, 115, 0, 0.04)'): string {
  // Another stylized Cameroon pattern featuring Beti-Ekang abstract lines and shield shapes
  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <!-- Elongated shield silhouettes and linear motifs -->
    <path d="M 50,5 L 50,95 M 5,50 L 95,50" stroke="${color}" stroke-width="0.5" />
    <!-- Concentric diamond accents -->
    <path d="M 50,20 L 80,50 L 50,80 L 20,50 Z" fill="none" stroke="${color}" stroke-width="1.2" />
    <path d="M 50,28 L 72,50 L 50,72 L 28,50 Z" fill="none" stroke="${color}" stroke-width="0.6" stroke-dasharray="3,3" />
    <!-- Small geometric accents -->
    <circle cx="50" cy="50" r="4" fill="none" stroke="${color}" stroke-width="1" />
    <path d="M 10,10 L 25,25 M 90,10 L 75,25 M 10,90 L 25,75 M 90,90 L 75,75" stroke="${color}" stroke-width="0.8" />
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// Generates a complete, beautiful SVG Cameroon Cultural Avatar
export function generateCameroonAvatar(seed: string): string {
  // Use a simple hash function of the seed to determine random parameters
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const getRand = (min: number, max: number, offset = 0) => {
    const val = Math.abs((hash + offset) % 1000) / 1000
    return min + val * (max - min)
  }

  // Determine design combinations from the seed
  const bgType = Math.abs(hash) % 3 // 0 = Royal Bordeaux, 1 = Golden Sahel, 2 = Grassfields Blue
  const maskType = Math.abs(hash + 1) % 3 // 0 = Ekang Long Mask, 1 = Bamileke Beaded, 2 = Bamum Bronze
  const scarColor = Math.abs(hash + 2) % 2 === 0 ? '#F4C430' : '#14532D' // Orange or Bordeaux
  const crownDetail = Math.abs(hash + 3) % 2 === 0

  // 1. Backgrounds
  let bgFill = '#14532D'
  let bgAccent = 'rgba(255, 115, 0, 0.25)'
  let themeName = 'Bordeaux Royal'

  if (bgType === 1) {
    bgFill = '#D97706'
    bgAccent = 'rgba(143, 1, 0, 0.3)'
    themeName = 'Sahel Doré'
  } else if (bgType === 2) {
    bgFill = '#1E3A8A'
    bgAccent = 'rgba(255, 115, 0, 0.3)'
    themeName = 'Ndop Grassfields'
  }

  // Draw traditional Ndop background pattern overlay
  const ndopOverlay = `
    <!-- Ndop Background Pattern Overlay -->
    <g opacity="0.18" stroke="#FFFFFF" stroke-width="1.2" fill="none">
      <path d="M 0,100 L 100,0 L 200,100 L 100,200 Z" />
      <path d="M 20,100 L 100,20 L 180,100 L 100,180 Z" stroke-dasharray="2,2" />
      <circle cx="100" cy="100" r="5" fill="#FFFFFF" />
      <path d="M 100,80 L 100,120 M 80,100 L 120,100" />
      <path d="M 0,0 L 20,20 M 200,0 L 180,20 M 0,200 L 20,180 M 200,200 L 180,180" />
      <!-- Small animal geometric symbols -->
      <path d="M 30,30 L 40,25 L 50,30 L 40,35 Z" fill="rgba(255,255,255,0.2)" />
      <path d="M 150,30 L 160,25 L 170,30 L 160,35 Z" fill="rgba(255,255,255,0.2)" />
    </g>
  `

  // 2. Headwear (Feather Crown "Aghout" or Beaded Cap)
  let headwearSvg = ''
  if (crownDetail) {
    headwearSvg = `
      <!-- Aghout feathered crown -->
      <g stroke="${scarColor}" stroke-width="1.5" fill="none">
        <path d="M 60,45 C 50,15, 150,15, 140,45 Z" fill="${bgFill}" opacity="0.9" />
        <!-- Radiating feathers -->
        <path d="M 100,30 L 100,5" stroke="#F4C430" stroke-width="3" />
        <path d="M 85,32 L 70,10 M 115,32 L 130,10" stroke="${scarColor}" stroke-width="2.5" />
        <path d="M 72,36 L 50,20 M 128,36 L 150,20" stroke="#F4C430" stroke-width="2.5" />
        <circle cx="100" cy="5" r="4" fill="#F4C430" stroke="none" />
        <circle cx="70" cy="10" r="3" fill="${scarColor}" stroke="none" />
        <circle cx="130" cy="10" r="3" fill="${scarColor}" stroke="none" />
        <circle cx="50" cy="20" r="3" fill="#F4C430" stroke="none" />
        <circle cx="150" cy="20" r="3" fill="#F4C430" stroke="none" />
      </g>
    `
  } else {
    headwearSvg = `
      <!-- Beaded royal cap with chevrons -->
      <g fill="${scarColor}">
        <path d="M 65,45 C 65,25, 135,25, 135,45 Z" />
        <!-- Bead chevrons -->
        <path d="M 75,38 L 100,48 L 125,38" fill="none" stroke="#FFFFFF" stroke-width="2" />
        <path d="M 80,30 L 100,40 L 120,30" fill="none" stroke="#F4C430" stroke-width="2.2" />
        <circle cx="100" cy="24" r="6" fill="#FFFFFF" />
      </g>
    `
  }

  // 3. Mask Base & Facial Geometry
  let faceSvg = ''
  if (maskType === 0) {
    // Elongated Beti-Ekang style mask
    faceSvg = `
      <!-- Ekang style mask base -->
      <g filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.35))">
        <path d="M 65,45 C 65,45, 60,110, 100,165 C 140,110, 135,45, 135,45 Z" fill="#2E251E" stroke="#1A1512" stroke-width="2" />
        <!-- Central nose ridge line -->
        <path d="M 100,45 L 100,125" stroke="#1A1512" stroke-width="4" stroke-linecap="round" />
        <path d="M 94,125 L 100,132 L 106,125" stroke="#1A1512" stroke-width="4.5" stroke-linecap="round" fill="none" />
        <!-- High symmetric eyebrows -->
        <path d="M 70,75 Q 100,60 130,75" fill="none" stroke="#1A1512" stroke-width="4" stroke-linecap="round" />
        <path d="M 72,77 Q 100,64 128,77" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" />
        <!-- Stylized high-contrast slit eyes -->
        <path d="M 75,90 L 92,90 M 108,90 L 125,90" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
        <path d="M 77,90 L 90,90 M 110,90 L 123,90" stroke="#000000" stroke-width="1.2" stroke-linecap="round" />
        <!-- Beti-Ekang white linear paint scarifications -->
        <path d="M 70,110 L 88,118 M 130,110 L 112,118" stroke="${scarColor}" stroke-width="2.5" stroke-linecap="round" />
        <path d="M 72,122 L 86,128 M 128,122 L 114,128" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
        <!-- Elegant lips -->
        <rect x="92" y="142" width="16" height="4" rx="2" fill="${scarColor}" />
      </g>
    `
  } else if (maskType === 1) {
    // Bamileke Beaded Mask (Oval, high-contrast circular eyes and concentric shapes)
    faceSvg = `
      <!-- Bamileke beaded mask base -->
      <g filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.35))">
        <ellipse cx="100" cy="105" rx="36" ry="52" fill="#1C1917" stroke="#000000" stroke-width="2.5" />
        <!-- Concentric beaded eye circles -->
        <circle cx="82" cy="95" r="12" fill="none" stroke="#FFFFFF" stroke-width="2.2" />
        <circle cx="82" cy="95" r="7" fill="none" stroke="${scarColor}" stroke-width="2" />
        <circle cx="82" cy="95" r="2" fill="#FFFFFF" />
        
        <circle cx="118" cy="95" r="12" fill="none" stroke="#FFFFFF" stroke-width="2.2" />
        <circle cx="118" cy="95" r="7" fill="none" stroke="${scarColor}" stroke-width="2" />
        <circle cx="118" cy="95" r="2" fill="#FFFFFF" />
        
        <!-- Chevron nose -->
        <path d="M 100,85 L 94,118 L 100,126 L 106,118 Z" fill="${scarColor}" opacity="0.95" />
        <path d="M 100,85 L 100,125" stroke="#FFFFFF" stroke-width="1" />
        
        <!-- Royal cheek chevrons -->
        <path d="M 70,125 L 82,135 L 72,145" fill="none" stroke="#FFFFFF" stroke-width="2" />
        <path d="M 130,125 L 118,135 L 128,145" fill="none" stroke="#FFFFFF" stroke-width="2" />
        
        <!-- Open stylized mouth -->
        <ellipse cx="100" cy="142" rx="10" ry="5" fill="#FFFFFF" />
        <ellipse cx="100" cy="142" rx="7" ry="2" fill="#14532D" />
      </g>
    `
  } else {
    // Bamum Bronze / Terracotta style (Bold structural cheeks, stylized crown accent)
    faceSvg = `
      <!-- Bamum style mask base -->
      <g filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.35))">
        <path d="M 66,50 C 66,50, 58,110, 80,150 C 90,162, 110,162, 120,150 C 142,110, 134,50, 134,50 Z" fill="#451A03" stroke="#270B00" stroke-width="2" />
        <!-- Traditional bronze facial scarifications -->
        <g stroke="${scarColor}" stroke-width="1.8" fill="none" stroke-linecap="round">
          <!-- Forehead vertical stripes -->
          <path d="M 94,55 L 94,75 M 100,53 L 100,75 M 106,55 L 106,75" />
          <!-- Cheeks stripes radiating -->
          <path d="M 72,110 C 80,115, 90,118, 92,125" />
          <path d="M 128,110 C 120,115, 110,118, 108,125" stroke="#F4C430" />
          <path d="M 74,122 C 82,126, 90,128, 92,135" stroke="#F4C430" />
          <path d="M 126,122 C 118,126, 110,128, 108,135" />
        </g>
        <!-- Expressive bronze eyes -->
        <ellipse cx="84" cy="92" rx="10" ry="7" fill="#FEF3C7" stroke="#270B00" stroke-width="1.5" />
        <circle cx="84" cy="92" r="3" fill="#270B00" />
        
        <ellipse cx="116" cy="92" rx="10" ry="7" fill="#FEF3C7" stroke="#270B00" stroke-width="1.5" />
        <circle cx="116" cy="92" r="3" fill="#270B00" />
        
        <!-- Wide noble nose -->
        <path d="M 97,85 L 97,118 Q 100,124 103,118 L 103,85 Z" fill="#270B00" />
        <!-- Wide smiling bronze mouth -->
        <path d="M 88,140 Q 100,152 112,140" fill="none" stroke="#FEF3C7" stroke-width="3" stroke-linecap="round" />
      </g>
    `
  }

  // 4. Combine into final SVG
  const finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <!-- Rounded Avatar Mask and Clip -->
    <defs>
      <clipPath id="avatarClip">
        <circle cx="100" cy="100" r="96" />
      </clipPath>
    </defs>
    
    <!-- Outer delicate border -->
    <circle cx="100" cy="100" r="98" fill="none" stroke="${bgFill}" stroke-width="2" />
    <circle cx="100" cy="100" r="95" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3" />

    <!-- Cliped visual area -->
    <g clip-path="url(#avatarClip)">
      <!-- Background Fill -->
      <rect x="0" y="0" width="200" height="200" fill="${bgFill}" />
      
      ${ndopOverlay}
      
      <!-- Cameroon traditional mask group -->
      <g transform="translate(0, 5)">
        ${headwearSvg}
        ${faceSvg}
      </g>
      
      <!-- Tiny traditional decorative symbols at bottom -->
      <g stroke="#FFFFFF" stroke-width="0.8" fill="none" opacity="0.25">
        <path d="M 90,192 L 100,185 L 110,192" />
        <path d="M 85,195 L 100,187 L 115,195" />
      </g>
    </g>
  </svg>`

  return finalSvg
}

// Helper to convert raw SVG to safe data URI
export function getCameroonAvatarDataUri(seed: string): string {
  const svg = generateCameroonAvatar(seed)
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

interface CameroonAvatarProps {
  seed: string
  size?: number
  style?: React.CSSProperties
  className?: string
}

export function CameroonAvatar({ seed, size = 64, style, className }: CameroonAvatarProps) {
  const isUrl = seed?.startsWith('http://') || seed?.startsWith('https://') || seed?.startsWith('data:')
  const avatarDataUri = useMemo(() => {
    if (isUrl) return seed
    return getCameroonAvatarDataUri(seed || 'assomboa-default')
  }, [seed, isUrl])
  
  return (
    <img
      src={avatarDataUri}
      alt={`Avatar (${isUrl ? 'Image' : seed})`}
      referrerPolicy="no-referrer"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid var(--color-primary)',
        padding: '2px',
        background: 'var(--color-card)',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
      className={className}
    />
  )
}
