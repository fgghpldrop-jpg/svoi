/**
 * СВОИ — Design Tokens
 * Urban Glassmorphism · Dark Theme
 *
 * Inspired by Telegram / iOS 17 / Zenly
 */

export const colors = {
  // ── Backgrounds ──
  bg: {
    primary: '#0F1115',       // Графитовая основа
    secondary: '#16181D',     // Приподнятые поверхности
    tertiary: '#1C1F26',      // Карточки
    elevated: '#22252E',      // Активные элементы
    glass: 'rgba(15,17,21,0.72)',  // Glassmorphism overlay
    glassLight: 'rgba(255,255,255,0.04)',
  },

  // ── Borders ──
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.08)',
    strong: 'rgba(255,255,255,0.12)',
    accent: 'rgba(16,185,129,0.3)',
  },

  // ── Text ──
  text: {
    primary: '#F2F3F5',       // Основной текст
    secondary: '#8E8E93',     // Вторичный / muted
    tertiary: '#5A5A5E',      // Подсказки / disabled
    inverse: '#0F1115',       // Текст на светлом фоне
  },

  // ── Accent: Emerald ──
  accent: {
    primary: '#10B981',       // Изумрудный
    secondary: '#059669',     // Pressed state
    tertiary: '#047857',      // Deep
    dim: 'rgba(16,185,129,0.12)',  // Фон бейджа
    glow: 'rgba(16,185,129,0.4)',  // Glow-эффект
  },

  // ── Semantic ──
  semantic: {
    // Каждая секция меню имеет свой tint
    chat: {
      bg: 'rgba(59,130,246,0.12)',
      icon: '#3B82F6',
    },
    clans: {
      bg: 'rgba(139,92,246,0.12)',
      icon: '#8B5CF6',
    },
    pulse: {
      bg: 'rgba(249,115,22,0.12)',
      icon: '#F97316',
    },
    market: {
      bg: 'rgba(236,72,153,0.12)',
      icon: '#EC4899',
    },
    settings: {
      bg: 'rgba(142,142,147,0.10)',
      icon: '#8E8E93',
    },
  },

  // ── Status ──
  status: {
    online: '#34D399',        // Зелёная пульсация «гуляю»
    offline: '#5A5A5E',
    danger: '#EF4444',
    warning: '#F59E0B',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 22,
  full: 9999,
} as const;

export const typography = {
  // Inter / SF Pro — геометричный гротеск
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  size: {
    caption2: 11,
    caption: 12,
    footnote: 13,
    body: 15,
    callout: 16,
    headline: 17,
    title3: 20,
    title2: 22,
    title1: 28,
    largeTitle: 34,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const blur = {
  glass: 40,       // backdrop-filter: blur(40px)
  overlay: 24,
  subtle: 12,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 0,
  }),
} as const;

export const animation = {
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  springBouncy: {
    damping: 12,
    stiffness: 280,
    mass: 0.6,
  },
  timing: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
} as const;
