// Mirrors the design tokens in ../src/index.css.
export const colors = {
  green900: '#0b3d2c',
  green700: '#14563c',
  green600: '#1b6b46',
  green100: '#e4efe7',
  gold: '#d4af37',
  goldDark: '#b8941f',
  teeGreen: '#8bc34a',
  brandAccent: '#4e9e35',
  cream: '#f7f5ee',
  paper: '#ffffff',
  ink: '#1c241f',
  muted: '#6c7a70',
  line: '#dcd7c9',
  hair: '#e8e3d6',
  danger: '#c0533b',
} as const

export const fonts = {
  sans: 'Poppins_400Regular',
  sansMedium: 'Poppins_500Medium',
  sansSemi: 'Poppins_600SemiBold',
  sansBold: 'Poppins_700Bold',
  serif: 'CormorantGaramond_600SemiBold',
  serifBold: 'CormorantGaramond_700Bold',
} as const

export const radius = 14

export const shadow = {
  shadowColor: '#0b3d2c',
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const
