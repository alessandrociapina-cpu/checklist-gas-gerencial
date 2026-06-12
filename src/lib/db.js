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

      if (fotos.length) {
        await db.fotos.bulkPut(fotos)
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
