import { importarBackup, db } from './db'

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
  { key: 'f1', label: 'Frente 1 — Análise Prévia' },
  { key: 'f2', label: 'Frente 2 — Concessionária de Gás' },
  { key: 'f3', label: 'Frente 3 — Investigação de Campo' },
  { key: 'f4', label: 'Frente 4 — Execução e Encerramento' },
]

export function calcularConformidade(checklists) {
  return FRENTES.map(({ key, label }) => {
    let ok = 0, total = 0
    for (const c of checklists) {
      for (const item of c.frentes?.[key] ?? []) {
        total++
        if (item.ok === true) ok++
      }
    }
    const pct = total > 0 ? Math.round((ok / total) * 100) : 0
    return { frente: label, conformidade: pct, ok, total }
  })
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
