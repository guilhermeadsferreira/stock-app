/**
 * Formata número de telefone para padrão brasileiro.
 * Ex: "11999887766" → "(11) 99988-7766"
 *     "1133224455" → "(11) 3322-4455"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return phone
}
