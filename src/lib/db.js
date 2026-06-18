import Dexie from 'dexie'

export const db = new Dexie('gas-gerencial')

db.version(1).stores({
  checklists: 'id, atualizadoEm, *fiscal, *municipio, data',
  fotos: 'id, checklistId, itemKey',
  importacoes: '++id, arquivo, importadoEm, qtd',
})

export async function importarBackup(jsonData) {
  if (!jsonData?.dados?.length) throw new Error('Arquivo sem dados de checklists.')

  let novos = 0
  let atualizados = 0
  let totalFotos = 0

  for (const entrada of jsonData.dados) {
    const { checklist, fotos: fotosEntrada = [] } = entrada
    if (!checklist?.id) continue

    const existing = await db.checklists.get(checklist.id)
    const maisRecente =
      !existing ||
      new Date(checklist.atualizadoEm) > new Date(existing.atualizadoEm)

    // Atualiza checklist só se for mais recente
    if (maisRecente) {
      const { fotos: _fotosEmbutidas, ...checklistSemFotos } = checklist
      const flat = {
        ...checklistSemFotos,
        fiscal: checklist.geral?.responsavel ?? '',
        municipio: checklist.geral?.municipio ?? '',
        data: checklist.geral?.data ?? '',
      }
      await db.checklists.put(flat)
      existing ? atualizados++ : novos++
    }

    // Sempre processa fotos (independente de maisRecente)
    const todasFotos = []

    // 1. Array de fotos no nível da entrada (formato padrão)
    for (let fi = 0; fi < fotosEntrada.length; fi++) {
      const f = fotosEntrada[fi]
      todasFotos.push({
        ...f,
        id: f.id || `${checklist.id}_foto_${fi}`,
        checklistId: f.checklistId || checklist.id,
      })
    }

    // 2. Array de fotos dentro do objeto checklist (checklist.fotos)
    for (let fi = 0; fi < (checklist.fotos ?? []).length; fi++) {
      const f = checklist.fotos[fi]
      const fotoObj = typeof f === 'string' ? { dataUrl: f } : { ...f }
      todasFotos.push({
        ...fotoObj,
        id: fotoObj.id || `${checklist.id}_cl_${fi}`,
        checklistId: checklist.id,
      })
    }

    // 3. Fotos embutidas dentro de cada item da frente (item.fotos = [...])
    for (const [frenteKey, itens] of Object.entries(checklist.frentes ?? {})) {
      if (!Array.isArray(itens)) continue
      for (let idx = 0; idx < itens.length; idx++) {
        const item = itens[idx]
        for (let fi = 0; fi < (item.fotos ?? []).length; fi++) {
          const f = item.fotos[fi]
          const fotoObj = typeof f === 'string' ? { dataUrl: f } : { ...f }
          todasFotos.push({
            ...fotoObj,
            id: fotoObj.id || `${checklist.id}_emb_${frenteKey}_${idx}_${fi}`,
            checklistId: checklist.id,
            itemKey: fotoObj.itemKey || `${frenteKey}_${idx}`,
          })
        }
      }
    }

    console.log(`[import] ${checklist.id}: ${todasFotos.length} fotos | maisRecente=${maisRecente}`)
    if (todasFotos.length) {
      console.log('[import] itemKeys:', todasFotos.map(f => `${f.itemKey ?? '(geral)'}(id=${f.id})`))
      await db.fotos.bulkPut(todasFotos)
      totalFotos += todasFotos.length
    }
  }

  return { novos, atualizados, total: jsonData.dados.length, fotos: totalFotos }
}

export async function estatisticas() {
  const todos = await db.checklists.toArray()
  return {
    total: todos.length,
    fiscais: [...new Set(todos.map(c => c.fiscal).filter(Boolean))],
    municipios: [...new Set(todos.map(c => c.municipio).filter(Boolean))],
    checklists: todos,
  }
}
