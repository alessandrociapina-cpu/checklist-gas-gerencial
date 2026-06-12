import { importarBackup, db } from './db'
import { DEFINICOES_FRENTES } from './reportData'

export async function processarArquivos(arquivos) {
  const resultados = []

  for (const arquivo of arquivos) {
    if (!arquivo.name.endsWith('.json')) {
      resultados.push({ arquivo: arquivo.name, erro: 'Não é um arquivo JSON.' })
      continue
    }

    try {
      const texto = await arquivo.text()
      const json = JSON.parse(texto)

      if (json.app !== 'checklist-gas') {
        resultados.push({ arquivo: arquivo.name, erro: 'Formato não reconhecido (app inválido).' })
        continue
      }

      const { novos, atualizados, total } = await importarBackup(json)

      await db.importacoes.add({
        arquivo: arquivo.name,
        importadoEm: new Date().toISOString(),
        qtd: novos + atualizados,
      })

      resultados.push({ arquivo: arquivo.name, novos, atualizados, total, ok: true })
    } catch (e) {
      resultados.push({ arquivo: arquivo.name, erro: e.message })
    }
  }

  return resultados
}

// Chaves reais do app checklist-gas: f1, f2, f3, f4
export const FRENTES = [
  { key: 'f1', label: 'Frente 1 — Análise Prévia',          labelCurto: 'Frente 1' },
  { key: 'f2', label: 'Frente 2 — Concessionária de Gás',   labelCurto: 'Frente 2' },
  { key: 'f3', label: 'Frente 3 — Investigação de Campo',   labelCurto: 'Frente 3' },
  { key: 'f4', label: 'Frente 4 — Execução e Encerramento', labelCurto: 'Frente 4' },
]

// ─── Conformidade ──────────────────────────────────────────────────────────

export function calcularConformidade(checklists) {
  return FRENTES.map(({ key, label, labelCurto }) => {
    let ok = 0, total = 0
    for (const c of checklists) {
      for (const item of c.frentes?.[key] ?? []) {
        total++
        if (item.ok === true) ok++
      }
    }
    const pct = total > 0 ? Math.round((ok / total) * 100) : 0
    return { frente: label, labelCurto, conformidade: pct, ok, total }
  })
}

export function calcConformidadeChecklist(c) {
  let ok = 0, total = 0
  for (const { key } of FRENTES) {
    for (const item of c.frentes?.[key] ?? []) {
      total++
      if (item.ok === true) ok++
    }
  }
  return total > 0 ? Math.round((ok / total) * 100) : 0
}

export function conformidadePorFiscal(checklists) {
  const map = {}
  for (const c of checklists) {
    const f = c.fiscal || 'Não informado'
    if (!map[f]) map[f] = { ok: 0, total: 0, qtd: 0 }
    map[f].qtd++
    for (const { key } of FRENTES) {
      for (const item of c.frentes?.[key] ?? []) {
        map[f].total++
        if (item.ok === true) map[f].ok++
      }
    }
  }
  return Object.entries(map)
    .map(([fiscal, d]) => ({
      fiscal,
      qtd: d.qtd,
      ok: d.ok,
      total: d.total,
      pct: d.total > 0 ? Math.round((d.ok / d.total) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct)
}

export function tendenciaConformidade(checklists) {
  const map = {}
  for (const c of checklists) {
    const mes = c.data?.substring(0, 7)
    if (!mes) continue
    if (!map[mes]) map[mes] = { ok: 0, total: 0 }
    for (const { key } of FRENTES) {
      for (const item of c.frentes?.[key] ?? []) {
        map[mes].total++
        if (item.ok === true) map[mes].ok++
      }
    }
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, d]) => ({
      mes,
      conformidade: d.total > 0 ? Math.round((d.ok / d.total) * 100) : 0,
    }))
}

// ─── Itens mais reprovados ─────────────────────────────────────────────────

export function itensMaisReprovados(checklists, max = 8) {
  const counts = {}
  for (const c of checklists) {
    for (const { key } of FRENTES) {
      const itens = c.frentes?.[key] ?? []
      itens.forEach((item, i) => {
        const titulo = DEFINICOES_FRENTES[key]?.[i] ?? `${key} item ${i + 1}`
        const k = `${key}_${i}`
        if (!counts[k]) counts[k] = { titulo, reprovacoes: 0, total: 0 }
        counts[k].total++
        if (item.ok === false) counts[k].reprovacoes++
      })
    }
  }
  return Object.values(counts)
    .filter(c => c.reprovacoes > 0)
    .map(c => ({ ...c, pct: Math.round((c.reprovacoes / c.total) * 100) }))
    .sort((a, b) => b.reprovacoes - a.reprovacoes)
    .slice(0, max)
}

export function pendenciasSemJustificativa(checklists) {
  let count = 0
  for (const c of checklists) {
    for (const { key } of FRENTES) {
      for (const item of c.frentes?.[key] ?? []) {
        if (item.ok === false && !item.justificativa?.trim()) count++
      }
    }
  }
  return count
}

// ─── Atividade ────────────────────────────────────────────────────────────

export function ultimaAtividadePorFiscal(checklists) {
  const map = {}
  for (const c of checklists) {
    const f = c.fiscal || 'Não informado'
    if (!map[f]) map[f] = { fiscal: f, ultimaData: '', qtd: 0 }
    map[f].qtd++
    if (c.data && c.data > map[f].ultimaData) map[f].ultimaData = c.data
  }
  return Object.values(map).sort((a, b) =>
    (b.ultimaData || '').localeCompare(a.ultimaData || '')
  )
}

export function agruparPorMes(checklists) {
  const map = {}
  for (const c of checklists) {
    const d = c.data ? c.data.substring(0, 7) : 'sem data'
    map[d] = (map[d] ?? 0) + 1
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, quantidade]) => ({ mes, quantidade }))
}

export function agruparPorFiscal(checklists) {
  const map = {}
  for (const c of checklists) {
    const f = c.fiscal || 'Não informado'
    map[f] = (map[f] ?? 0) + 1
  }
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([fiscal, quantidade]) => ({ fiscal, quantidade }))
}
