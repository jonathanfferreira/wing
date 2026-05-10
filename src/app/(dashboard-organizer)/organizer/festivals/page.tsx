import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { PlusCircle, Calendar } from 'lucide-react'
import { FESTIVAL_STATUS_LABEL, type FestivalStatus } from '@/types/domain'

const STATUS_CLASSES: Record<FestivalStatus, string> = {
  draft: 'bg-gray-800 text-gray-400',
  published: 'bg-blue-900/40 text-blue-400 border border-blue-700/50',
  registration_open: 'bg-green-900/40 text-green-400 border border-green-700/50',
  registration_closed: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/50',
  active: 'bg-secondary/20 text-secondary border border-secondary/40',
  finished: 'bg-gray-900 text-gray-500 border border-gray-700/50',
  cancelled: 'bg-red-900/40 text-red-400 border border-red-700/50',
}

export default async function OrganizerFestivalsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const params = await searchParams

  if (!user) return null

  const { data: festivals } = await supabase
    .from('festivals')
    .select('id, name, description, status, start_date, end_date, city, state, venue_name')
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading text-white tracking-wider">Meus Festivais</h1>
          <p className="text-gray-400 mt-1">Gerencie todos os seus eventos de dança.</p>
        </div>
        <Link
          href="/organizer/festivals/new"
          className="inline-flex items-center bg-gradient-neon px-6 py-3 rounded-md text-white font-bold uppercase tracking-wider font-display hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Novo Evento
        </Link>
      </div>

      {params?.success && (
        <div className="p-4 bg-green-900/30 border border-green-500/50 text-green-200 rounded-lg text-sm">
          {params.success}
        </div>
      )}

      {!festivals || festivals.length === 0 ? (
        <div className="glass-panel border border-gray-800 rounded-2xl p-16 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="text-2xl font-heading text-white mb-2">Nenhum Festival</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Você ainda não criou nenhum evento. Clique no botão acima para organizar seu
            primeiro festival de dança.
          </p>
          <Link
            href="/organizer/festivals/new"
            className="inline-flex items-center text-sm font-bold text-primary hover:text-secondary transition-colors"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Criar meu primeiro festival
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {festivals.map((festival) => (
            <div
              key={festival.id}
              className="glass-panel border border-gray-800/80 rounded-xl overflow-hidden hover:border-primary/40 transition-colors group flex flex-col"
            >
              {/* Accent top bar */}
              <div className="h-1 w-full bg-gradient-neon" />

              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex-shrink-0 ${
                      STATUS_CLASSES[festival.status as FestivalStatus]
                    }`}
                  >
                    {FESTIVAL_STATUS_LABEL[festival.status as FestivalStatus]}
                  </span>
                </div>

                <div>
                  <h3
                    className="text-xl font-heading text-white truncate group-hover:text-gradient-neon transition-all"
                    title={festival.name}
                  >
                    {festival.name}
                  </h3>
                  {(festival.city || festival.venue_name) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[festival.venue_name, festival.city, festival.state]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>

                <p className="text-sm text-gray-400 line-clamp-2">
                  {festival.description || 'Nenhuma descrição fornecida.'}
                </p>

                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  {new Date(festival.start_date).toLocaleDateString('pt-BR')} —{' '}
                  {new Date(festival.end_date).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div className="bg-black/40 border-t border-gray-800 px-6 py-3 flex justify-between items-center">
                <Link
                  href={`/organizer/festivals/${festival.id}/delegations`}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Ver delegações
                </Link>
                <Link
                  href={`/organizer/festivals/${festival.id}`}
                  className="text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary transition-colors"
                >
                  Gerenciar →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
