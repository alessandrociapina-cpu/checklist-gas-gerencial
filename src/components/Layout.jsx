import { useState } from 'react'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',   icon: IconDash },
  { id: 'importar',   label: 'Importar',     icon: IconImport },
  { id: 'relatorios', label: 'Relatórios',   icon: IconChart },
  { id: 'checklists', label: 'Checklists',   icon: IconList },
]

export default function Layout({ pagina, onNavegar, children, onInstalar, isInstalled }) {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="bg-brand-900 text-white flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1 rounded hover:bg-white/10"
            onClick={() => setMenuAberto(m => !m)}
          >
            <IconHamburger />
          </button>
          <span className="font-bold text-lg tracking-tight">Gás — Gerencial</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-blue-200 hidden sm:block">Sistema de Consolidação de Checklists</span>
          {onInstalar && !isInstalled && (
            <button
              onClick={onInstalar}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              title="Instalar como aplicativo"
            >
              <IconDownload className="w-4 h-4" />
              <span className="hidden sm:inline">Instalar app</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav
          className={`
            fixed inset-y-0 left-0 z-40 w-56 bg-brand-900 text-white pt-16 pb-4 flex flex-col gap-1
            transform transition-transform duration-200
            ${menuAberto ? 'translate-x-0' : '-translate-x-full'}
            lg:relative lg:translate-x-0 lg:pt-0
          `}
        >
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavegar(id); setMenuAberto(false) }}
              className={`
                flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors
                ${pagina === id
                  ? 'bg-brand-700 text-white'
                  : 'text-blue-100 hover:bg-white/10'}
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Overlay mobile */}
        {menuAberto && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setMenuAberto(false)}
          />
        )}

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── Ícones inline (SVG) ───────────────────────────────────────────────────────

function IconHamburger({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function IconDash({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function IconImport({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

function IconChart({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function IconList({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function IconDownload({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}
