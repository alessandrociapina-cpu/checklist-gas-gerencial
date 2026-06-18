import { useEffect, useState } from 'react'
import { db } from '../lib/db'
import { FRENTES } from '../lib/importService'
import { DEFINICOES_FRENTES, LABELS_GERAL, fmtData, fotosDoItem } from '../lib/reportData'

export default function ChecklistDetail({ id, onVoltar, autoPrint = false }) {
  const [checklist, setChecklist] = useState(null)
  const [fotos, setFotos] = useState([])
  const [lightbox, setLightbox] = useState(null) // dataUrl da foto ampliada

  useEffect(() => {
    db.checklists.get(id).then(c => {
      console.log('[detail] checklist:', c?.id, '| frentes:', Object.keys(c?.frentes ?? {}))
      setChecklist(c)
    })
    db.fotos.where('checklistId').equals(id).toArray().then(fts => {
      console.log(`[detail] fotos no banco para "${id}": ${fts.length}`, fts.map(f => f.itemKey ?? '(geral)'))
      setFotos(fts)
    })
  }, [id])

  useEffect(() => {
    if (autoPrint && checklist) {
      const t = setTimeout(() => window.print(), 500)
      return () => clearTimeout(t)
    }
  }, [autoPrint, checklist])

  if (!checklist) return <Spinner />

  const g = checklist.geral ?? {}

  // totais gerais
  let totalOk = 0, totalItens = 0
  FRENTES.forEach(({ key }) => {
    const itens = checklist.frentes?.[key] ?? []
    totalItens += itens.length
    totalOk    += itens.filter(i => i.ok === true).length
  })
  const pctGeral = totalItens > 0 ? Math.round((totalOk / totalItens) * 100) : 0
  const totalFotos = fotos.length

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>

      {/* ── Lightbox ───────────────────────────────────────── */}
      {lightbox && (
        <div
          className="no-print fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightbox}
            alt="Foto ampliada"
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Toolbar (só em tela) ───────────────────────────── */}
      <div className="no-print flex items-center gap-3 mb-4">
        <button onClick={onVoltar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Voltar">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-semibold text-brand-900 flex-1 truncate">
          {g.os ? `OS ${g.os}` : 'Checklist'} — {g.endereco}
        </span>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir / PDF
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          RELATÓRIO — igual ao emitido em campo
      ══════════════════════════════════════════════════════ */}
      <div className="rel-page">

        {/* Cabeçalho */}
        <div className="rel-header">
          <div className="rel-header-logo">
            <img src={`${import.meta.env.BASE_URL}icons/icon-96.png`} alt=""
              style={{ width: 52, height: 52, borderRadius: 10 }} />
          </div>
          <div className="rel-header-info">
            <h1>Checklist de Fiscalização de Interferência</h1>
            <p>
              {g.os && <><strong>OS:</strong> {g.os}&ensp;</>}
              {g.municipio && <><strong>Município:</strong> {g.municipio === 'outro' ? g.municipioOutro : g.municipio}&ensp;</>}
              <strong>Data:</strong> {fmtData(g.data)}
              {g.equipe && <>&ensp;<strong>Equipe:</strong> {g.equipe}</>}
            </p>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="rel-resumo">
          <Card cor={pctGeral >= 80 ? 'verde' : pctGeral >= 50 ? 'laranja' : 'vermelho'}
            valor={`${pctGeral}%`} label="Conformidade" />
          <Card cor="azul"    valor={totalOk}              label="Itens OK" />
          <Card cor="laranja" valor={totalItens - totalOk} label="Pendências" />
          <Card cor="neutro"  valor={totalFotos}           label="Fotos" />
          {g.criticidade && <Card cor="neutro" valor={g.criticidade} label="Criticidade" />}
        </div>

        {/* Informações gerais */}
        <Secao titulo="Informações Gerais">
          <table className="rel-tabela">
            <tbody>
              {LABELS_GERAL.map(({ key, label, transform }) => {
                const val = g[key]
                if (!val && val !== 0) return null
                const display = transform ? transform(val, g) : val
                if (!display) return null
                return (
                  <tr key={key}>
                    <td className="rel-td-label">{label}</td>
                    <td className="rel-td-valor">{display}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Secao>

        {/* Frentes */}
        {FRENTES.map(({ key, label }) => {
          const itens = checklist.frentes?.[key] ?? []
          if (!itens.length) return null
          const ok  = itens.filter(i => i.ok === true).length
          const pct = Math.round((ok / itens.length) * 100)
          return (
            <Secao key={key} titulo={label}
              badge={`${ok}/${itens.length} — ${pct}%`}
              corBadge={pct >= 80 ? 'verde' : pct >= 50 ? 'laranja' : 'vermelho'}>

              {/* Barra de progresso */}
              <div className="rel-barra-bg">
                <div className="rel-barra-fill"
                  style={{ width: `${pct}%`, background: pct >= 80 ? '#1e8e3e' : pct >= 50 ? '#f58220' : '#c5221f' }} />
              </div>

              <table className="rel-tabela rel-tabela-itens">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th>Descrição</th>
                    <th style={{ width: 64, textAlign: 'center' }}>Status</th>
                    <th style={{ width: 130 }}>Responsável</th>
                    <th>Observações / Justificativa</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, i) => {
                    const titulo = item.texto ?? DEFINICOES_FRENTES[key]?.[i] ?? `Item ${i + 1}`
                    const itemOk = item.ok === true
                    const fts    = fotosDoItem(fotos, key, i)
                    return (
                      <>
                        <tr key={i} className={itemOk ? 'rel-ok' : 'rel-nok'}>
                          <td style={{ textAlign: 'center', color: '#6b7280' }}>{i + 1}</td>
                          <td style={{ fontWeight: 500 }}>{titulo}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={itemOk ? 'rel-badge-ok' : 'rel-badge-nok'}>
                              {itemOk ? '✓ OK' : '✗ N/C'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#374151' }}>{item.responsavel || '—'}</td>
                          <td style={{ fontSize: '0.8rem' }}>
                            {!itemOk && item.justificativa && (
                              <span className="rel-justificativa">⚠ {item.justificativa}</span>
                            )}
                            {item.observacoes && <span style={{ color: '#4b5563' }}>{item.observacoes}</span>}
                            {!item.justificativa && !item.observacoes && '—'}
                          </td>
                        </tr>
                        {/* Fotos do item */}
                        {fts.length > 0 && (
                          <tr key={`${i}-fotos`} className="rel-fotos-row">
                            <td />
                            <td colSpan={4}>
                              <div className="rel-fotos-wrap">
                                {fts.map((f, fi) => (
                                  <div key={fi} className="rel-foto-item">
                                    <img
                                      src={f.dataUrl}
                                      alt={`Foto ${fi + 1}`}
                                      className="rel-foto-img"
                                      onClick={() => setLightbox(f.dataUrl)}
                                      title="Clique para ampliar"
                                    />
                                    <span className="rel-foto-rotulo">Foto {fi + 1}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </Secao>
          )
        })}

        {/* Fotos não associadas a itens (gerais do checklist) */}
        {(() => {
          const fotasGerais = fotos.filter(f => !f.itemKey || f.itemKey === '')
          if (!fotasGerais.length) return null
          return (
            <Secao titulo="Registro Fotográfico">
              <div className="rel-fotos-wrap">
                {fotasGerais.map((f, i) => (
                  <div key={i} className="rel-foto-item">
                    <img
                      src={f.dataUrl}
                      alt={`Foto ${i + 1}`}
                      className="rel-foto-img"
                      onClick={() => setLightbox(f.dataUrl)}
                      title="Clique para ampliar"
                    />
                    <span className="rel-foto-rotulo">Foto {i + 1}</span>
                  </div>
                ))}
              </div>
            </Secao>
          )
        })()}

        {/* Cadastro */}
        {checklist.cadastro?.necessita === 'sim' && (
          <Secao titulo="Atualização Cadastral">
            <table className="rel-tabela">
              <thead>
                <tr>
                  <th>Rede</th>
                  <th>Posição</th>
                  <th>Divergência</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {(checklist.cadastro.registros ?? []).map((r, i) => (
                  <tr key={i}>
                    <td>{r.rede}</td>
                    <td>{r.posicao}</td>
                    <td>{Array.isArray(r.divergencias) ? r.divergencias.join(', ') : r.divergencias}</td>
                    <td>{r.descricao || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Secao>
        )}

        {/* Assinaturas */}
        {checklist.assinaturas && Object.values(checklist.assinaturas).some(a => a?.nome || a?.img) && (
          <Secao titulo="Assinaturas">
            <div className="rel-assinaturas">
              {Object.entries(checklist.assinaturas).map(([key, ass]) => {
                if (!ass?.nome && !ass?.img) return null
                return (
                  <div key={key} className="rel-assinatura-bloco">
                    <div className="rel-assinatura-img-wrap">
                      {ass.img
                        ? <img src={ass.img} alt={ass.nome} className="rel-assinatura-img" />
                        : <span className="rel-assinatura-vazio">Pendente</span>}
                    </div>
                    <div className="rel-assinatura-linha" />
                    <p className="rel-assinatura-nome">{ass.nome || '—'}</p>
                  </div>
                )
              })}
            </div>
          </Secao>
        )}

        {/* Rodapé */}
        <div className="rel-rodape">
          Gerado em {new Date().toLocaleString('pt-BR')} · Checklist Gás — Sistema Gerencial
        </div>

      </div>{/* /rel-page */}
    </div>
  )
}

/* ── Subcomponentes ────────────────────────────────────── */

function Secao({ titulo, children, badge, corBadge }) {
  const corMap = { verde: '#d1fae5//#065f46', laranja: '#ffedd5//#9a3412', vermelho: '#fee2e2//#991b1b' }
  const [bg, fg] = corBadge ? corMap[corBadge]?.split('//') ?? ['#e5e7eb', '#374151'] : []
  return (
    <div className="rel-secao">
      <div className="rel-secao-titulo">
        <span>{titulo}</span>
        {badge && (
          <span className="rel-secao-badge" style={{ background: bg, color: fg }}>
            {badge}
          </span>
        )}
      </div>
      <div className="rel-secao-corpo">{children}</div>
    </div>
  )
}

function Card({ valor, label, cor }) {
  const esquemas = {
    verde:    { bg: '#d1fae5', fg: '#065f46', borda: '#6ee7b7' },
    laranja:  { bg: '#ffedd5', fg: '#9a3412', borda: '#fdba74' },
    vermelho: { bg: '#fee2e2', fg: '#991b1b', borda: '#fca5a5' },
    azul:     { bg: '#dbeafe', fg: '#1e40af', borda: '#93c5fd' },
    neutro:   { bg: '#f3f4f6', fg: '#374151', borda: '#d1d5db' },
  }
  const { bg, fg, borda } = esquemas[cor] ?? esquemas.neutro
  return (
    <div className="rel-card" style={{ background: bg, borderColor: borda }}>
      <span className="rel-card-valor" style={{ color: fg }}>{valor}</span>
      <span className="rel-card-label" style={{ color: fg }}>{label}</span>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
