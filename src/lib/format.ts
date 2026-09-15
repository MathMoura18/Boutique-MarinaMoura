const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const money = (value: number) => brl.format(value)

export const onlyDigits = (v: string) => v.replace(/\D/g, '')

const applyPattern = (digits: string, pattern: string) => {
  let out = ''
  let i = 0
  for (const ch of pattern) {
    if (i >= digits.length) break
    if (ch === '#') out += digits[i++]
    else out += ch
  }
  return out
}

export const masks = {
  cpf: (v: string) => applyPattern(onlyDigits(v).slice(0, 11), '###.###.###-##'),
  phone: (v: string) => {
    const d = onlyDigits(v).slice(0, 11)
    return applyPattern(d, d.length > 10 ? '(##) #####-####' : '(##) ####-####')
  },
  cep: (v: string) => applyPattern(onlyDigits(v).slice(0, 8), '#####-###'),
  card: (v: string) => applyPattern(onlyDigits(v).slice(0, 16), '#### #### #### ####'),
  expiry: (v: string) => applyPattern(onlyDigits(v).slice(0, 4), '##/##'),
  cvv: (v: string) => onlyDigits(v).slice(0, 4),
}

export const validators = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  name: (v: string) => v.trim().split(/\s+/).length >= 2,
  phone: (v: string) => onlyDigits(v).length >= 10,
  cep: (v: string) => onlyDigits(v).length === 8,
  cpf: (v: string) => {
    const d = onlyDigits(v)
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
    const calc = (len: number) => {
      let sum = 0
      for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i)
      const r = (sum * 10) % 11
      return r === 10 ? 0 : r
    }
    return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
  },
  card: (v: string) => {
    const d = onlyDigits(v)
    if (d.length < 13) return false
    let sum = 0
    let dbl = false
    for (let i = d.length - 1; i >= 0; i--) {
      let n = Number(d[i])
      if (dbl) {
        n *= 2
        if (n > 9) n -= 9
      }
      sum += n
      dbl = !dbl
    }
    return sum % 10 === 0
  },
  expiry: (v: string) => {
    const [mm, yy] = v.split('/').map(Number)
    if (!mm || yy === undefined || mm > 12 || v.length !== 5) return false
    const now = new Date()
    const exp = new Date(2000 + yy, mm, 0, 23, 59)
    return exp >= now
  },
  cvv: (v: string) => v.length >= 3,
}

export const cardBrand = (v: string): 'visa' | 'master' | 'amex' | 'elo' | null => {
  const d = onlyDigits(v)
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(d)) return 'elo'
  if (/^4/.test(d)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'master'
  if (/^3[47]/.test(d)) return 'amex'
  return null
}
