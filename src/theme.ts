export const colors = {
  brand: {
    DEFAULT: '#FF5500',
    hover: '#E04B00',
    subtle: '#FFF1EA',
    glow: 'rgba(255, 85, 0, 0.15)',
  },
  semantic: {
    success: '#059669',
    successBg: '#ECFDF5',
    successBorder: '#A7F3D0',
    warning: '#D97706',
    warningBg: '#FFFBEB',
    warningBorder: '#FDE68A',
    danger: '#DC2626',
    dangerBg: '#FEF2F2',
    dangerBorder: '#FECACA',
    info: '#2563EB',
    infoBg: '#EFF6FF',
    infoBorder: '#BFDBFE',
    neutral: '#64748B',
    neutralBg: '#F8FAFC',
    neutralBorder: '#E2E8F0',
  },
  surface: {
    base: '#FFFFFF',
    subtle: '#F8FAFC',
    border: '#E2E8F0',
    dark: '#0F172A',
  },
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
  },
};

export const typeScale = {
  micro: 'text-xs',      // 12px
  small: 'text-sm',      // 14px
  body: 'text-base',     // 16px
  subtitle: 'text-lg',   // 18px
  title: 'text-xl',      // 20px
  heading: 'text-2xl',   // 24px
  display: 'text-3xl',   // 30px
};

export const spacing = {
  cardPadding: 'p-5',
  compactPadding: 'p-3.5',
  sectionGap: 'gap-6',
  itemGap: 'gap-3',
};

export const radius = {
  card: 'rounded-2xl',
  control: 'rounded-xl',
  badge: 'rounded-full',
};

export const ui = {
  // Contenedores Estándar
  card: 'bg-white rounded-2xl border border-slate-100/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-5',
  cardCompact: 'bg-white rounded-xl border border-slate-100/90 shadow-sm p-3.5',
  cardSubtle: 'bg-slate-50/70 rounded-xl border border-slate-200/60 p-4',
  
  // Botones
  btnPrimary: 'bg-[#FF5500] hover:bg-[#E04B00] text-white font-semibold text-xs rounded-xl px-4 py-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2',
  btnSecondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl px-4 py-2 transition-all cursor-pointer shadow-2xs active:scale-[0.99] flex items-center justify-center gap-2',
  btnGhost: 'text-slate-600 hover:bg-slate-100 font-medium text-xs rounded-xl px-3 py-1.5 transition-colors cursor-pointer flex items-center justify-center gap-1.5',
  btnDanger: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-xl px-3.5 py-2 transition-colors cursor-pointer',

  // Badges Semánticos Unificados
  badgeSuccess: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5',
  badgeWarning: 'bg-amber-50 text-amber-700 border border-amber-200/70 text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5',
  badgeDanger: 'bg-rose-50 text-rose-700 border border-rose-200/70 text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5',
  badgeInfo: 'bg-blue-50 text-blue-700 border border-blue-200/70 text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5',
  badgeNeutral: 'bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5',
  badgeBrand: 'bg-orange-50 text-[#FF5500] border border-orange-200/70 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1.5',

  // Inputs y Formularios
  input: 'w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all placeholder:text-slate-400',
  select: 'w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all cursor-pointer',
  
  // Tablas
  tableHeader: 'bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 border-b border-slate-200/80 text-left',
  tableCell: 'px-4 py-3 text-xs text-slate-700 border-b border-slate-100',
  tableRowHover: 'hover:bg-slate-50/60 transition-colors',
};

export const tokens = {
  colors,
  typeScale,
  spacing,
  radius,
  ui,
};

