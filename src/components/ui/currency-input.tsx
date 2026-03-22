import { useEffect, useState } from 'react'
import { Input } from './input'

interface CurrencyInputProps {
  value: number        // float recebido do react-hook-form (ex: 59.90)
  onChange: (value: number) => void
  onBlur?: () => void
  disabled?: boolean
  placeholder?: string
}

/**
 * Input de moeda estilo ATM: o usuário digita apenas dígitos e o valor
 * é formatado automaticamente como centavos (ex: 5→0,05 → 59→0,59 → 5990→59,90).
 * Reporta um float para o react-hook-form; a conversão final para centavos
 * fica em floatToCents() no submit.
 */
export function CurrencyInput({ value, onChange, onBlur, disabled, placeholder = '0,00' }: CurrencyInputProps) {
  const [cents, setCents] = useState(() => Math.round(value * 100))

  // Sincroniza quando o form reseta os valores externamente
  useEffect(() => {
    setCents(Math.round(value * 100))
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    const newCents = Math.min(parseInt(digits || '0', 10), 9_999_999) // max R$ 99.999,99
    setCents(newCents)
    onChange(newCents / 100)
  }

  const display = (cents / 100).toFixed(2).replace('.', ',')

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder}
      onFocus={(e) => e.target.select()}
    />
  )
}
