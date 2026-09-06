export const colors = {
  primary: {
    50: '#E7F5D0',
    100: '#D4EEB3',
    200: '#B7DE8A',
    300: '#98CE66',
    400: '#4C8C3A',
    500: '#14532D',
    600: '#124A28',
    700: '#0F3F22',
    800: '#0C331B',
    900: '#082212',
  },
  accent: {
    50: '#FFFBEB',
    100: '#FFF3C4',
    200: '#FCE588',
    300: '#FAD453',
    400: '#F7CC3B',
    500: '#F4C430',
    600: '#DBAE20',
    700: '#B8901A',
    800: '#8A6400',
    900: '#6B5000',
  },
  lime: {
    50: '#F5FAEF',
    100: '#E7F5D0',
    200: '#D2EBAE',
    300: '#B4DD82',
    400: '#8BC34A',
    500: '#6FA637',
    600: '#578529',
    700: '#436620',
    800: '#324D18',
    900: '#233611',
  },
  success: {
    50: '#E7F5D0',
    100: '#D4EEB3',
    500: '#14532D',
    600: '#124A28',
    700: '#0F3F22',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FFF3C4',
    500: '#8A6400',
    600: '#6B5000',
    700: '#523D00',
  },
  error: {
    50: '#FBEAE9',
    100: '#F5CFCC',
    500: '#B3261E',
    600: '#8F1E18',
    700: '#6B1712',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#FAF9F4',
    100: '#F0F2EB',
    200: '#DCE8D2',
    300: '#C3D1B9',
    400: '#9BAD91',
    500: '#728065',
    600: '#556B5A',
    700: '#3F5245',
    800: '#26332A',
    900: '#152A1B',
  },
}

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
}

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
}

export const fontFamily = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  heading: "'Poppins', 'Inter', sans-serif",
}

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.08)',
  md: '0 4px 12px rgba(0,0,0,0.10)',
  lg: '0 10px 30px rgba(0,0,0,0.14)',
}

export const transitions = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '400ms ease',
}

export type Theme = typeof colors
