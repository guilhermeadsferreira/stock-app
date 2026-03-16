/**
 * Converte centavos para string formatada em BRL.
 * Ex: 1299 → "R$ 12,99"
 */
export function centsToBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

/**
 * Converte string BRL para centavos.
 * Ex: "12,99" → 1299
 */
export function brlStringToCents(value: string): number {
  const normalized = value.replace(/[^\d,]/g, '').replace(',', '.')
  const float = parseFloat(normalized)
  if (isNaN(float)) return 0
  return Math.round(float * 100)
}

/**
 * Converte número decimal (input de formulário) para centavos.
 * Ex: 12.99 → 1299
 */
export function floatToCents(value: number): number {
  return Math.round(value * 100)
}

/**
 * Converte centavos para número decimal (para inputs de formulário).
 * Ex: 1299 → 12.99
 */
export function centsToFloat(cents: number): number {
  return cents / 100
}
