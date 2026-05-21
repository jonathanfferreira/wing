'use client'

import { Flame, Trophy, Star, Clock, CheckCircle, XCircle, AlertCircle, CalendarRange, Ticket } from 'lucide-react'

type Profile = {
  id: string
  full_name: string
  role: string
  xp?: number
  level?: number
}

type Choreography = {
  id: string
  name: string
  category?: string | null
  schools: { name: string }[]
}

type Inscription = {
  id: string
  school_status: string
  festival_status: string
  created_at: string
  choreographies: Choreography[] | Choreography | null
}

type Invoice = {
  id: string
  status: string
  total_amount: number
  due_date: string
  created_at: string
  festivals: { name: string }[] | { name: string } | null
}

type Festival = {
  id: string
  name: string
  start_date: string
  end_date: string
  registration_deadline: string
  description: string | null
}

type Stats = {
  totalInscriptions: number
  approvedInscriptions: number
  pendingPayment: number
  totalPaid: number
}

type Props = {
  profile: Profile | null
  inscriptions: Inscription[]
  invoices: Invoice[]
  festivals: Festival[]
  stats: Stats
}

function first<T>(val: T[] | T | null | undefined): T | null {
  if (val == null) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

const xpToNextLevel = (xp: number) => {
  const level = Math.max(1, Math.floor(xp / 1000))
  const xpIntoLevel = xp % 1000
  return { level, xpIntoLevel, progress: (xpIntoLevel / 1000) * 100 }
}

const statusConfig = {
  approved:  { label: 'Aprovado',  icon: CheckCircle,  color: 'text-emerald-400' },
  pending:   { label: 'Pendente',  icon: AlertCircle,  color: 'text-yellow-400'  },
  rejected:  { label: 'Rejeitado', icon: XCircle,      color: 'text-red-400'     },
}

const invoiceStatusConfig = {
  paid:      { label: 'Pago',      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  pending:   { label: 'Pendente',  color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'   },
  overdue:   { label: 'Vencido',   color: 'text-red-400 bg-red-400/10 border-red-400/20'             },
  canceled:  { label: 'Cancelado', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20'          },
}

function XPBar({ xp }: { xp: number }) {
  const { level, xpIntoLevel, progress } = xpToNextLevel(xp)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-data text-xs text-gray-400 uppercase tracking-widest">
          Nível {level}
        </span>
        <span className="font-data text-xs text-gray-500">
          {xpIntoLevel} / 1000 XP
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-neon rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default function DancerDashboardClient({ profile, inscriptions, invoices, festivals, stats }: Props) {
  const xp = profile?.xp ?? 0
  const { level } = xpToNextLevel(xp)

  return (
    <div className="space-y-8">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-gray-500 text-sm uppercase tracking-widest font-sans mb-1">Bem-vindo de volta</p>
          <h1 className="font-heading text-3xl md:text-4xl text-white">
            {profile?.full_name ?? 'Dançarino'}
          </h1>
        </div>
        {/* XP Badge */}
        <div className="glass-panel rounded-xl px-5 py-3 flex items-center gap-4 min-w-[220px]">
          <div className="flex flex-col items-center">
            <span className="font-data text-3xl text-gradient-neon leading-none">{xp.toLocaleString('pt-BR')}</span>
            <span className="font-data text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">XP Total</span>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex-1">
            <XPBar xp={xp} />
          </div>
        </div>
      </div>

      {/* ── Cards de Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Ticket className="w-5 h-5" />}
          label="Inscrições"
          value={stats.totalInscriptions}
          color="text-primary"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Aprovadas"
          value={stats.approvedInscriptions}
          color="text-emerald-400"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="Pgto. Pendente"
          value={stats.pendingPayment}
          color="text-yellow-400"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Nível Atual"
          value={level}
          color="text-highlight"
          suffix={`Lv`}
          prefix
        />
      </div>

      {/* ── Corpo: Inscrições + Festivais ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Inscrições recentes */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg text-white">Minhas Inscrições</h2>
            <span className="font-data text-xs text-gray-500">{inscriptions.length} total</span>
          </div>

          {inscriptions.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma inscrição ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inscriptions.slice(0, 6).map(ins => {
                const cfg = statusConfig[ins.school_status as keyof typeof statusConfig] ?? statusConfig.pending
                const Icon = cfg.icon
                const chore = first(ins.choreographies)
                const school = first(chore?.schools)
                return (
                  <div key={ins.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {chore?.name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {chore?.category} · {school?.name}
                      </p>
                    </div>
                    <span className={`text-xs font-data uppercase tracking-wider ${cfg.color} flex-shrink-0`}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Festivais abertos */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-secondary" />
            <h2 className="font-heading text-lg text-white">Festivais Abertos</h2>
          </div>

          {festivals.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <CalendarRange className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhum festival com inscrições abertas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {festivals.map(f => (
                <a
                  key={f.id}
                  href={`/festival/${f.id}`}
                  className="block p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <p className="text-sm text-white font-medium group-hover:text-gradient-neon truncate">
                    {f.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(f.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    {' — '}
                    {new Date(f.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    Inscrições até {new Date(f.registration_deadline).toLocaleDateString('pt-BR')}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Faturas ── */}
      {invoices.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="font-heading text-lg text-white">Faturas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-widest border-b border-white/5">
                  <th className="text-left pb-3 font-normal">Festival</th>
                  <th className="text-left pb-3 font-normal">Valor</th>
                  <th className="text-left pb-3 font-normal">Vencimento</th>
                  <th className="text-left pb-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map(inv => {
                  const cfg = invoiceStatusConfig[inv.status as keyof typeof invoiceStatusConfig] ?? invoiceStatusConfig.pending
                  const festival = first(inv.festivals)
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-white">{festival?.name ?? '—'}</td>
                      <td className="py-3 font-data text-white">
                        {inv.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-3 text-gray-400">
                        {new Date(inv.due_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3">
                        <span className={`font-data text-xs px-2 py-0.5 rounded border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

function StatCard({
  icon, label, value, color, suffix, prefix,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  suffix?: string
  prefix?: boolean
}) {
  return (
    <div className="glass-panel rounded-xl p-4 space-y-2">
      <div className={`${color} opacity-80`}>{icon}</div>
      <div>
        <p className={`font-data text-2xl md:text-3xl font-bold ${color}`}>
          {prefix && suffix ? `${suffix} ` : ''}
          {value.toLocaleString('pt-BR')}
          {!prefix && suffix ? ` ${suffix}` : ''}
        </p>
        <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">{label}</p>
      </div>
    </div>
  )
}
