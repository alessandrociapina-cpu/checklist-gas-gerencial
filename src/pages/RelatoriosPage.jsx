import { useEffect, useState } from 'react'
import { estatisticas } from '../lib/db'
import { agruparPorFiscal, agruparPorMes, calcularConformidade } from '../lib/importService'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend, Cell, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar,
} from 'recharts'

const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

export default function RelatoriosPage() {
  const [dados, setDados] = useState(null)
  const [periodo, setPeriodo] = useState('todos')

  useEffect(() => { estatisticas().then(setDados) }, [])

  if (!dados) return <Spinner />

  let checklists = dados.checklists
  if (periodo !== 'todos') {
    const limite = new Date()
    limite.setMonth(limite.getMonth() - parseInt(periodo))
    checklists = checklists.filter(c => c.data && new Date(c.data) >= limite)
  }

  const porMes        = agruparPorMes(checklists)
  const porFiscal     = agruparPorFiscal(checklists)
  const conformidade  = calcularConformidade(checklists)
  const porMunicipio  = agruparPorMunicipio(checklists)

  const semDados = dados.total === 0

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-brand-900">Relatórios</h1>
        <select
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="todos">Todo o período</option>
          <option value="1">Último mês</option>
          <option value="3">Últimos 3 meses</option>
          <option value="6">Últimos 6 meses</option>
          <option value="12">Último ano</option>
        </select>
      </div>

      {semDados ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400">Nenhum dado disponível. Importe checklists primeiro.</p>
        </div>
      ) : (
        <>
          {/* Evolução temporal */}
          <Painel titulo="Evolução de checklists por mês">
            {porMes.length > 1 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={porMes} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="quantidade"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Checklists"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <BarChart data={porMes} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Checklists" />
              </BarChart>
            )}
          </Painel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Produção por fiscal */}
            <Painel titulo="Produção por fiscal">
              {porFiscal.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={porFiscal} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="fiscal" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} name="Checklists">
                      {porFiscal.map((_, i) => (
                        <Cell key={i} fill={CORES[i % CORES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Vazio />
              )}
            </Painel>

            {/* Conformidade por frente */}
            <Painel titulo="Conformidade por frente de trabalho (%)">
              {conformidade.some(c => c.total > 0) ? (
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={conformidade} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="frente" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Conformidade %"
                      dataKey="conformidade"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                    <Tooltip formatter={v => `${v}%`} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <Vazio />
              )}
            </Painel>
          </div>

          {/* Tabela de conformidade detalhada */}
          <Painel titulo="Itens por frente — detalhamento">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium">Frente</th>
                    <th className="pb-2 font-medium text-right">Itens OK</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                    <th className="pb-2 font-medium text-right">Conformidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {conformidade.map(row => (
                    <tr key={row.frente}>
                      <td className="py-2 font-medium text-gray-700">{row.frente}</td>
                      <td className="py-2 text-right text-green-600 font-medium">{row.ok}</td>
                      <td className="py-2 text-right text-gray-500">{row.total}</td>
                      <td className="py-2 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                          ${row.conformidade >= 80 ? 'bg-green-100 text-green-700'
                            : row.conformidade >= 50 ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'}`}>
                          {row.conformidade}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Painel>

          {/* Atividade por município */}
          {porMunicipio.length > 0 && (
            <Painel titulo="Atividade por município">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={porMunicipio} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="municipio" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Checklists" />
                </BarChart>
              </ResponsiveContainer>
            </Painel>
          )}

          {/* Ranking de fiscais */}
          <Painel titulo="Ranking de produção — fiscais">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium w-8">#</th>
                    <th className="pb-2 font-medium">Fiscal</th>
                    <th className="pb-2 font-medium text-right">Checklists</th>
                    <th className="pb-2 font-medium text-right">Participação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {porFiscal.map((row, i) => (
                    <tr key={row.fiscal}>
                      <td className="py-2 text-gray-400 font-medium">{i + 1}</td>
                      <td className="py-2 font-medium text-gray-700">{row.fiscal}</td>
                      <td className="py-2 text-right font-bold text-brand-600">{row.quantidade}</td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-brand-500 h-1.5 rounded-full"
                              style={{ width: `${Math.round((row.quantidade / checklists.length) * 100)}%` }}
                            />
                          </div>
                          <span className="text-gray-500 text-xs w-8">
                            {Math.round((row.quantidade / checklists.length) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Painel>
        </>
      )}
    </div>
  )
}

function agruparPorMunicipio(checklists) {
  const map = {}
  for (const c of checklists) {
    const m = c.municipio || c.geral?.municipioOutro || 'Não informado'
    if (m && m !== 'Não informado') map[m] = (map[m] ?? 0) + 1
  }
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([municipio, quantidade]) => ({ municipio, quantidade }))
}

function Painel({ titulo, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h2 className="font-semibold text-gray-700 mb-4">{titulo}</h2>
      {children}
    </div>
  )
}

function Vazio() {
  return <p className="text-gray-400 text-sm text-center py-8">Sem dados suficientes.</p>
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
