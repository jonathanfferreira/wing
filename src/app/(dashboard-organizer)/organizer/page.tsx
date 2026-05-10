import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CalendarRange, PlusCircle, TrendingUp, Users } from 'lucide-react'
import { FESTIVAL_STATUS_LABEL, type Festival, type FestivalStatus } from '@/types/domain'

const STATUS_CLASSES: Record<FestivalStatus, string> = {
  draft: 'bg-gray-800 text-gray-400',
  published: 'bg-blue-900/40 text-blue-400 border border-blue-700/50',
  registration_open: 'bg-green-900/40 text-green-400 border border-green-700/50',
  registration_closed: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/50',
  active: 'bg-secondary/20 text-secondary border border-secondary/40',
  finished: 'bg-gray-900 text-gray-500 border border-gray-700/50',
  cancelled: 'bg-red-900/40 text-red-400 border border-red-700/50',
}

export default async function OrganizerHomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: festivals, count: festivalCount } = await supabase
    .from('festivals')
    .select('id, name, status, start_date', { count: 'exact' })
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const activeStatuses: FestivalStatus[] = ['registration_open', 'active']
  const activeCount =
    festivals?.filter((f) => activeStatuses.includes(f.status as FestivalStatus)).length ?? 0

  // Count total delegations across organizer's festivals
  const { count: delegationCount } = await supabase
    .from('delegations')
    .select('id', { count: 'exact', head: true })
    .in('festival_id', (festivals ?? []).map((f) => f.id))

  const stats = [
    {
      label: 'Festivais Criados',
      value: festivalCount ?? 0,
      icon: CalendarRange,
      color: 'text-primary',
      ring: 'border-primary/20 bg-primary/10',
    },
    {
      label: 'Com Inscrições Ativas',
      value: activeCount,
      icon: TrendingUp,
      color: 'text-secondary',
      ring: 'border-secondary/20 bg-secondary/10',
    },
    {
      label: 'Delegações Totais',
      value: delegationCount ?? 0,
      icon: Users,
      color: 'text-accent',
      ring: 'border-accent/20 bg-accent/10',
    },
  ]

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-heading text-white tracking-wider">
            Painel do Organizador
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie seus festivais e acompanhe inscrições em tempo real.
          </p>
        </div>
        <Link
          href="/organizer/festivals/new"
          className="inline-flex items-center bg-gradient-neon px-6 py-3 rounded-md text-white font-bold uppercase tracking-wider font-display hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Novo Festival
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`glass-panel border ${s.ring} rounded-xl p-6 flex items-center gap-5`}
          >
            <div className={`p-3 rounded-lg border ${s.ring}`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent festivals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading text-white tracking-wider">Festivais Recentes</h2>
          <Link
            href="/organizer/festivals"
            className="text-xs text-primary hover:text-secondary transition-colors font-bold uppercase tracking-wider"
          >
            Ver todos →
          </Link>
        </div>

        {!festivals || festivals.length === 0 ? (
          <div className="glass-panel border border-gray-800 rounded-xl p-12 text-center">
            <CalendarRange className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Você ainda não criou nenhum festival.</p>
            <Link
              href="/organizer/festivals/new"
              className="inline-flex items-center text-sm font-bold text-primary hover:text-secondary transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Criar meu primeiro festival
            </Link>
          </div>
        ) : (
          <div className="glass-panel border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/50 text-gray-400 text-xs uppercase tracking-widest border-b border-gray-800">
                  <th className="p-4 font-semibold">Festival</th>
                  <th className="p-4 font-semibold hidden md:table-cell">Início</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {festivals.map((f) => (
                  <tr key={f.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-white">{f.name}</td>
                    <td className="p-4 text-sm text-gray-400 hidden md:table-cell">
                      {new Date(f.start_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                          STATUS_CLASSES[f.status as FestivalStatus]
                        }`}
                      >
                        {FESTIVAL_STATUS_LABEL[f.status as FestivalStatus]}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/organizer/festivals/${f.id}`}
                        className="text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary transition-colors"
                      >
                        Gerenciar →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
