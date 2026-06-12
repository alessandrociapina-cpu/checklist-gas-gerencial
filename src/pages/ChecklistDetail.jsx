import { useEffect, useState } from 'react'
import { db } from '../lib/db'

const FRENTE_LABELS = {
  frente1: 'Frente 1 — Análise Prévia',
  frente2: 'Frente 2 — Concessionária de Gás',
  frente3: 'Frente 3 — Investigação de Campo',
  frente4: 'Frente 4 — Execução e Encerramento',
}

export default function ChecklistDetail({ id, onVoltar }) {
  const [checklist, setChecklist] = useState(null)
  const [fotos, setFotos] = useState([])

  useEffect(() => {
    db.checklists.get(id).then(setChecklist)
    db.fotos.where('checklistId').equals(id).toArray().then(setFotos)
  }, [id])

  if (!checklist) return <Spinner />

  const g = checklist.geral ?? {}

  return (
    <div className="max-w-3xl space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button
          onClick={onVoltar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          title="Voltar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-900">
            {g.os ? `OS ${g.os}` : 'Checklist'}
          </h1>
          <p className="text-sm text-gray-500">{g.endereco}</p>
        </div>
      </div>

      {/* Informações gerais */}
      <Secao titulo="Informações Gerais">
        <Grade>
          <Campo label="Fiscal" valor={g.responsavel} />
          <Campo label="Equipe" valor={g.equipe} />
          <Campo label="Data" valor={formatarData(g.data)} />
          <Campo label="Município" valor={g.municipio === 'outro' ? g.municipioOutro : g.municipio} />
          <Campo label="Serviço" valor={g.descricaoServico} span />
          <Campo label="Contrato" valor={g.contrato} />
          <Campo label="Protocolo Gás" valor={g.protocoloGas} />
        </Grade>
      </Secao>

      {/* Frentes */}
      {Object.entries(FRENTE_LABELS).map(([key, label]) => {
        const itens = checklist.frentes?.[key] ?? []
        if (!itens.length) return null
        const ok    = itens.filter(i => i.ok === true || i.ok === 'ok').length
        const total = itens.length
        const pct   = Math.round((ok / total) * 100)
        return (
          <Secao key={key} titulo={label} badge={`${ok}/${total} (${pct}%)`} cor={pct >= 80 ? 'green' : pct >= 50 ? 'yellow' : 'red'}>
            <div className="space-y-2">
              {itens.map((item, i) => {
                const itemOk = item.ok === true || item.ok === 'ok'
                const fotoItem = fotos.filter(f => f.itemKey?.startsWith(key))
                return (
                  <div key={i} className={`rounded-lg px-3 py-2 flex items-start gap-3 ${itemOk ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs
                      ${itemOk ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                      {itemOk ? '✓' : '✗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{item.titulo ?? item.label ?? `Item ${i + 1}`}</p>
                      {item.justificativa && (
                        <p className="text-xs text-orange-700 mt-0.5">Justificativa: {item.justificativa}</p>
                      )}
                      {item.responsavel && (
                        <p className="text-xs text-gray-500 mt-0.5">Responsável: {item.responsavel}</p>
                      )}
                      {item.observacoes && (
                        <p className="text-xs text-gray-500 mt-0.5">Obs: {item.observacoes}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Secao>
        )
      })}

      {/* Cadastro */}
      {checklist.cadastro?.necessita === 'sim' && (
        <Secao titulo="Atualização Cadastral">
          <p className="text-sm text-gray-600 mb-3">
            {checklist.cadastro.registros?.length ?? 0} registro(s) de divergência
          </p>
          {checklist.cadastro.registros?.map((r, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 mb-2 text-sm">
              <p className="font-medium">Rede: {r.rede}</p>
              <p className="text-gray-600">Posição: {r.posicao} | Divergência: {r.divergencias}</p>
              {r.descricao && <p className="text-gray-500 text-xs mt-1">{r.descricao}</p>}
            </div>
          ))}
        </Secao>
      )}

      {/* Assinaturas */}
      {checklist.assinaturas && (
        <Secao titulo="Assinaturas">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(checklist.assinaturas).map(([key, ass]) => {
              if (!ass?.nome && !ass?.img) return null
              return (
                <div key={key} className="border border-gray-200 rounded-lg p-2 text-center">
                  {ass.img && (
                    <img src={ass.img} alt={ass.nome} className="max-h-16 mx-auto mb-1 object-contain" />
                  )}
                  <p className="text-xs text-gray-600 font-medium">{ass.nome || '—'}</p>
                </div>
              )
            })}
          </div>
        </Secao>
      )}
    </div>
  )
}

function Secao({ titulo, children, badge, cor }) {
  const corMap = { green: 'bg-green-100 text-green-700', yellow: 'bg-yellow-100 text-yellow-700', red: 'bg-red-100 text-red-700' }
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="font-semibold text-gray-700 text-sm">{titulo}</h2>
        {badge && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${corMap[cor] ?? 'bg-gray-100 text-gray-600'}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Grade({ children }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">{children}</div>
}

function Campo({ label, valor, span }) {
  if (!valor) return null
  return (
    <div className={span ? 'col-span-2 sm:col-span-3' : ''}>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{valor}</p>
    </div>
  )
}

function formatarData(data) {
  if (!data) return '—'
  try { const [a, m, d] = data.split('-'); return `${d}/${m}/${a}` }
  catch { return data }
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
