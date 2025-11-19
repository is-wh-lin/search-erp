export function getThemeTransitionClasses(): string {
  return 'transition-colors duration-300 ease-in-out'
}

export function getCardClasses(hover = true): string {
  const base = 'bg-white dark:bg-gray-800 rounded-lg shadow-soft transition-all duration-300'
  return hover ? `${base} hover:shadow-soft-lg` : base
}

export function getButtonClasses(
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed'

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  }

  const variantClasses = {
    primary:
      'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md focus-visible:ring-primary-500',
    secondary:
      'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white focus-visible:ring-gray-500',
    success:
      'bg-success-600 hover:bg-success-700 text-white shadow-sm hover:shadow-md focus-visible:ring-success-500',
    danger:
      'bg-danger-600 hover:bg-danger-700 text-white shadow-sm hover:shadow-md focus-visible:ring-danger-500',
    outline:
      'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20 focus-visible:ring-primary-500',
  }

  return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`
}

export function getInputClasses(hasError = false): string {
  const baseClasses =
    'w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 min-h-[44px] focus:outline-none focus:ring-2'

  if (hasError) {
    return `${baseClasses} border-2 border-danger-500 focus:ring-danger-500 focus:border-danger-500`
  }

  return `${baseClasses} border border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-transparent`
}

export function getBadgeClasses(
  variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'primary'
): string {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
    danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300',
    info: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300',
  }

  return `${baseClasses} ${variantClasses[variant]}`
}

export function getTableRowClasses(isSelected = false, isClickable = true): string {
  const baseClasses = 'transition-colors duration-150'

  if (isSelected) {
    return `${baseClasses} bg-primary-50 dark:bg-primary-900/20`
  }

  if (isClickable) {
    return `${baseClasses} hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer`
  }

  return baseClasses
}

export function getAnimationClasses(
  animation:
    | 'fade-in'
    | 'slide-in-right'
    | 'slide-in-left'
    | 'slide-in-up'
    | 'slide-in-down'
    | 'scale-in'
    | 'bounce-soft'
    | 'pulse-soft'
): string {
  return `animate-${animation}`
}

export function getFocusVisibleClasses(
  color: 'primary' | 'success' | 'danger' = 'primary'
): string {
  const colorClasses = {
    primary: 'focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400',
    success: 'focus-visible:ring-success-500 dark:focus-visible:ring-success-400',
    danger: 'focus-visible:ring-danger-500 dark:focus-visible:ring-danger-400',
  }

  return `focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${colorClasses[color]}`
}

export function getTouchTargetClasses(): string {
  return 'min-w-touch min-h-touch'
}

export function getResponsiveTextClasses(mobile: string, tablet: string, desktop: string): string {
  return `${mobile} md:${tablet} lg:${desktop}`
}

export function getAriaLabel(action: string, target?: string): string {
  return target ? `${action} ${target}` : action
}

export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

export function toggleDarkMode(): void {
  document.documentElement.classList.toggle('dark')
}

export function setDarkMode(enabled: boolean): void {
  if (enabled) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function getContrastColor(hexColor: string): 'light' | 'dark' {
  const hex = hexColor.replace('#', '')

  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  return brightness > 128 ? 'dark' : 'light'
}

export function getGradientClasses(
  from: string,
  to: string,
  direction: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-br' | 'to-bl' = 'to-r'
): string {
  return `bg-gradient-${direction} from-${from} to-${to}`
}
