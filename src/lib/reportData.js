// Títulos dos itens — espelha exatamente o data.js do app de campo
export const DEFINICOES_FRENTES = {
  f1: [
    'Preenchimento da APR',
    'Baixa cadastro Comgás',
    'Baixa cadastro rede de água',
    'Análise de interferência / Demarcação da rede de água/esgoto na via/passeio',
    'Avaliação de criticidade preliminar',
  ],
  f2: [
    'Acionamento / Protocolo registrado',
    'Presença do técnico em campo',
    'Marcação da rede na superfície pelo técnico da concessionária de gás',
    'Liberação formal recebida',
  ],
  f3: [
    'Sondagem Manual para todos os casos',
    'Utilização de haste de sondagem com ponteira de nylon',
    'Identificação da rede de gás',
    'Identificação da rede de água',
    'Medição de profundidades e afastamentos',
  ],
  f4: [
    'Escavação Manual',
    'Reparo executado Rede Sabesp',
    'Integridade da rede de gás verificada',
    'Recomposição realizada',
    'Relatório final anexado',
  ],
}

export const LABELS_GERAL = [
  { key: 'os',               label: 'Ordem de Serviço' },
  { key: 'descricaoServico', label: 'Descrição do Serviço' },
  { key: 'contrato',         label: 'Contrato' },
  { key: 'endereco',         label: 'Endereço' },
  { key: 'municipio',        label: 'Município',  transform: (v, g) => v === 'outro' ? g.municipioOutro : v },
  { key: 'data',             label: 'Data',       transform: v => fmtData(v) },
  { key: 'equipe',           label: 'Equipe' },
  { key: 'responsavel',      label: 'Fiscal Responsável' },
  { key: 'criticidade',      label: 'Criticidade' },
  { key: 'pressaoGas',       label: 'Pressão do Gás' },
  { key: 'materialGas',      label: 'Material (Gás)' },
  { key: 'diametroGas',      label: 'Diâmetro (Gás)' },
  { key: 'materialAgua',     label: 'Material (Água)' },
  { key: 'diametroAgua',     label: 'Diâmetro (Água)' },
  { key: 'materialEsgoto',   label: 'Material (Esgoto)' },
  { key: 'diametroEsgoto',   label: 'Diâmetro (Esgoto)' },
  { key: 'interferencias',   label: 'Interferências',  transform: v => Array.isArray(v) ? v.join(', ') : v },
  { key: 'imoveisAfetados',  label: 'Imóveis Afetados' },
  { key: 'protocoloGas',     label: 'Protocolo Gás' },
  { key: 'tecnicoGas',       label: 'Técnico da Concessionária' },
]

export function fmtData(d) {
  if (!d) return '—'
  try { const [a, m, dd] = d.split('-'); return `${dd}/${m}/${a}` }
  catch { return d }
}

// Busca fotos de um item. O itemKey do app pode ser "f1_0", "f1-0", etc.
export function fotosDoItem(fotos, frenteKey, idx) {
  return fotos.filter(f =>
    f.itemKey === `${frenteKey}_${idx}` ||
    f.itemKey === `${frenteKey}-${idx}` ||
    f.itemKey === `${frenteKey}.${idx}` ||
    f.itemKey === `${frenteKey}${idx}`
  )
}
