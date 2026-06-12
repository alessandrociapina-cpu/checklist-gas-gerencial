import { useEffect, useState } from 'react'
import { estatisticas } from '../lib/db'
import { agruparPorFiscal, agruparPorMes, calcularConformidade, pendenciasSemJustificativa } from '../lib/importService'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

export default function Dashboard({ onNavegar, onInstalar, isInstalled }) {
  const [dados, setDados] = useState(null)

  useEffect(() => {
    estatisticas().then(setDados)
  }, [])

  if (!dados) return <Spinner />

  const porMes    = agruparPorMes(dados.checklists).slice(-6)
  const porFiscal = agruparPorFiscal(dados.checklists).slice(0, 5)
  const semDados  = dados.total === 0

  const confFrentes  = calcularConformidade(dados.checklists)
  const totalOk      = confFrentes.reduce((s, r) => s + r.ok, 0)
  const totalIt      = confFrentes.reduce((s, r) => s + r.total, 0)
  const confGeral    = totalIt > 0 ? Math.round((totalOk / totalIt) * 100) : 0
  const semJust      = pendenciasSemJustificativa(dados.checklists)

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-brand-900">Dashboard</h1>

      {/* Banner de instalação */}
      {onInstalar && !isInstalled && (
        <div className="bg-brand-900 text-white rounded-xl p-4 flex items-center gap-4">
          <img src={`${import.meta.env.BASE_URL}icons/icon-96.png`} alt="" className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Instalar como aplicativo</p>
            <p className="text-sm text-blue-200">Acesso rápido, funciona offline após instalação</p>
          </div>
          <button
            onClick={onInstalar}
            className="flex-shrink-0 bg-white text-brand-900 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50"
          >
            Instalar
          </button>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card titulo="Checklists" valor={dados.total} cor="blue" />
        <Card titulo="Fiscais"    valor={dados.fiscais.length}    cor="green" />
        <Card titulo="Municípios" valor={dados.municipios.length} cor="purple" />
        <Card titulo="Este mês"   valor={contagemMesAtual(dados.checklists)} cor="orange" />
        <Card
          titulo="Conformidade"
          valor={`${confGeral}%`}
          cor={confGeral >= 80 ? 'green' : confGeral >= 50 ? 'orange' : 'red'}
        />
      </div>

      {/* Alerta de pendências sem justificativa */}
      {semJust > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span><strong>{semJust}</strong> pendência{semJust > 1 ? 's' : ''} sem justificativa registrada.</span>
        </div>
      )}

      {semDados ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-lg mb-3">Nenhum dado importado ainda.</p>
          <button
            onClick={() => onNavegar('importar')}
            className="bg-brand-600 text-white px-5 py-2 rounded-lg hover:bg-brand-700 font-medium"
          >
            Importar primeiro arquivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Checklists por mês */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-700 mb-4">Checklists por mês</h2>
            {porMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={porMes} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Sem dados de data.</p>
            )}
          </div>

          {/* Top fiscais */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-700 mb-4">Top fiscais</h2>
            {porFiscal.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={porFiscal} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="fiscal" type="category" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Sem fiscais cadastrados.</p>
            )}
          </div>
        </div>
      )}

      {/* Lista de fiscais */}
      {dados.fiscais.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Fiscais ativos</h2>
          <div className="flex flex-wrap gap-2">
            {dados.fiscais.map(f => (
              <span key={f} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ titulo, valor, cor }) {
  const cores = {
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    green:  'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    red:    'bg-red-50 text-red-700 border-red-100',
  }
  return (
    <div className={`rounded-xl border p-4 ${cores[cor]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{titulo}</p>
      <p className="text-3xl font-bold mt-1">{valor}</p>
    </div>
  )
}

function contagemMesAtual(checklists) {
  const mesAtual = new Date().toISOString().substring(0, 7)
  return checklists.filter(c => c.data?.startsWith(mesAtual)).length
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
