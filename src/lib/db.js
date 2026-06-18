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

  for (const entrada of jsonData.dados) {
    const { checklist, fotos = [] } = entrada
    if (!checklist?.id) continue

    const existing = await db.checklists.get(checklist.id)
    const maisRecente =
      !existing ||
      new Date(checklist.atualizadoEm) > new Date(existing.atualizadoEm)

    if (maisRecente) {
      // Extrai campos indexáveis do nível superior
      const flat = {
        ...checklist,
        fiscal: checklist.geral?.responsavel ?? '',
        municipio: checklist.geral?.municipio ?? '',
        data: checklist.geral?.data ?? '',
      }
      await db.checklists.put(flat)

      // Normaliza fotos do array raiz garantindo checklistId
      const todasFotos = fotos.map(f => ({
        ...f,
        checklistId: f.checklistId || checklist.id,
      }))

      // Extrai fotos embutidas nos itens das frentes (item.fotos = [...])
      for (const [frenteKey, itens] of Object.entries(checklist.frentes ?? {})) {
        if (!Array.isArray(itens)) continue
        for (let idx = 0; idx < itens.length; idx++) {
          const item = itens[idx]
          for (let fi = 0; fi < (item.fotos ?? []).length; fi++) {
            const f = item.fotos[fi]
            const fotoObj = typeof f === 'string' ? { dataUrl: f } : { ...f }
            if (!fotoObj.id) fotoObj.id = `${checklist.id}_emb_${frenteKey}_${idx}_${fi}`
            fotoObj.checklistId = checklist.id
            fotoObj.itemKey = fotoObj.itemKey || `${frenteKey}_${idx}`
            todasFotos.push(fotoObj)
          }
        }
      }

      if (todasFotos.length) {
        await db.fotos.bulkPut(todasFotos)
      }

      existing ? atualizados++ : novos++
    }
  }

  return { novos, atualizados, total: jsonData.dados.length }
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
