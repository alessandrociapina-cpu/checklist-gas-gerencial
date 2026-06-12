import { useEffect, useState } from 'react'
import { db } from '../lib/db'

export default function ChecklistsPage({ onDetalhe }) {
  const [checklists, setChecklists] = useState(null)
  const [busca, setBusca] = useState('')
  const [fiscal, setFiscal] = useState('')
  const [fiscais, setFiscais] = useState([])
  const [ordenar, setOrdenar] = useState('data_desc')

  useEffect(() => {
    db.checklists.toArray().then(todos => {
      setChecklists(todos)
      const fs = [...new Set(todos.map(c => c.fiscal).filter(Boolean))].sort()
      setFiscais(fs)
    })
  }, [])

  if (!checklists) return <Spinner />

  let filtrados = checklists
  if (busca) {
    const q = busca.toLowerCase()
    filtrados = filtrados.filter(c =>
      c.geral?.os?.toLowerCase().includes(q) ||
      c.geral?.endereco?.toLowerCase().includes(q) ||
      c.fiscal?.toLowerCase().includes(q) ||
      c.municipio?.toLowerCase().includes(q)
    )
  }
  if (fiscal) filtrados = filtrados.filter(c => c.fiscal === fiscal)

  filtrados = [...filtrados].sort((a, b) => {
    if (ordenar === 'data_desc') return (b.data || '').localeCompare(a.data || '')
    if (ordenar === 'data_asc')  return (a.data || '').localeCompare(b.data || '')
    if (ordenar === 'fiscal')    return (a.fiscal || '').localeCompare(b.fiscal || '')
    return 0
  })

  return (
    <div className="max-w-5xl space-y-5">
      <h1 className="text-2xl font-bold text-brand-900">Checklists</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar por OS, endereço, fiscal…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={fiscal}
          onChange={e => setFiscal(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todos os fiscais</option>
          {fiscais.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          value={ordenar}
          onChange={e => setOrdenar(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="data_desc">Mais recentes</option>
          <option value="data_asc">Mais antigos</option>
          <option value="fiscal">Por fiscal</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400">
            {checklists.length === 0
              ? 'Nenhum checklist importado ainda.'
              : 'Nenhum checklist corresponde aos filtros.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{filtrados.length} checklist{filtrados.length !== 1 ? 's' : ''}</p>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">OS / Endereço</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Fiscal</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Município</th>
                  <th className="px-4 py-3 font-medium text-right">Conformidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map(c => {
                  const conformidade = calcConformidade(c)
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onDetalhe(c.id)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {c.data ? formatarData(c.data) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 truncate max-w-xs">
                          {c.geral?.os ? `OS ${c.geral.os}` : '—'}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{c.geral?.endereco}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{c.fiscal || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.municipio || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                          ${conformidade >= 80 ? 'bg-green-100 text-green-700'
                            : conformidade >= 50 ? 'bg-yellow-100 text-yellow-700'
                            : conformidade > 0  ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-500'}`}>
                          {conformidade > 0 ? `${conformidade}%` : '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function calcConformidade(c) {
  let ok = 0, total = 0
  for (const f of ['frente1', 'frente2', 'frente3', 'frente4']) {
    for (const item of c.frentes?.[f] ?? []) {
      total++
      if (item.ok === true || item.ok === 'ok') ok++
    }
  }
  return total > 0 ? Math.round((ok / total) * 100) : 0
}

function formatarData(data) {
  try {
    const [a, m, d] = data.split('-')
    return `${d}/${m}/${a}`
  } catch { return data }
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
