import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Music2, Users, ChevronRight } from 'lucide-react'
import { redirect } from 'next/navigation'
import { updateFestivalStatus } from '@/app/actions/festivals'
import {
  FESTIVAL_STATUS_LABEL,
  MODALITY_LABEL,
  FORMATION_LABEL,
  DELEGATION_STATUS_LABEL,
  type FestivalStatus,
  type DelegationStatus,
  type CategoryModality,
  type FormationType,
} from '@/types/domain'

const STATUS_CLASSES: Record<FestivalStatus, string> = {
  draft: 'bg-gray-800 text-gray-400',
  published: 'bg-blue-900/40 text-blue-400 border border-blue-700/50',
  registration_open: 'bg-green-900/40 text-green-400 border border-green-700/50',
  registration_closed: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/50',
  active: 'bg-secondary/20 text-secondary border border-secondary/40',
  finished: 'bg-gray-900 text-gray-500 border border-gray-700/50',
  cancelled: 'bg-red-900/40 text-red-400 border border-red-700/50',
}

const DELEGATION_STATUS_CLASSES: Record<DelegationStatus, string> = {
  draft: 'bg-gray-800 text-gray-400',
  submitted: 'bg-blue-900/40 text-blue-400 border border-blue-700/50',
  approved: 'bg-green-900/40 text-green-400 border border-green-700/50',
  rejected: 'bg-red-900/40 text-red-400 border border-red-700/50',
  suspended: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/50',
}

// Status flow: what's the next valid transition for each status
const STATUS_TRANSITIONS: Partial<
  Record<FestivalStatus, { next: FestivalStatus; label: string; color: string }>
> = {
  draft: { next: 'published', label: 'Publicar Festival', color: 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10' },
  published: { next: 'registration_open', label: 'Abrir Inscrições', color: 'border-green-500/40 text-green-400 hover:bg-green-500/10' },
  registration_open: { next: 'registration_closed', label: 'Fechar Inscrições', color: 'border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10' },
  registration_closed: { next: 'active', label: 'Iniciar Evento', color: 'border-secondary/40 text-secondary hover:bg-secondary/10' },
  active: { next: 'finished', label: 'Encerrar Evento', color: 'border-gray-500/40 text-gray-400 hover:bg-gray-500/10' },
}

export default async function FestivalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { id } = await params
  const sp = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: festival } = await supabase
    .from('festivals')
    .select('*')
    .eq('id', id)
    .eq('organizer_id', user.id)
    .single()

  if (!festival) redirect('/organizer/festivals')

  const [{ data: categories }, { data: recentDelegations, count: delegationCount }] =
    await Promise.all([
      supabase
        .from('festival_categories')
        .select('*')
        .eq('festival_id', id)
        .order('created_at'),
      supabase
        .from('delegations')
        .select(
          `id, status, bus_spots_requested, hotel_spots_requested, enrolled_at,
           schools ( name, city, state )`,
          { count: 'exact' }
        )
        .eq('festival_id', id)
        .order('enrolled_at', { ascending: false })
        .limit(5),
    ])

  const transition = STATUS_TRANSITIONS[festival.status as FestivalStatus]
  const canCancel = !['finished', 'cancelled'].includes(festival.status)
  const updateStatus = updateFestivalStatus.bind(null, festival.id)

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Breadcrumb + back */}
      <div>
        <Link
          href="/organizer/festivals"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Meus Festivais
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                  STATUS_CLASSES[festival.status as FestivalStatus]
                }`}
              >
                {FESTIVAL_STATUS_LABEL[festival.status as FestivalStatus]}
              </span>
            </div>
            <h1 className="text-4xl font-heading text-white tracking-wider">{festival.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(festival.start_date).toLocaleDateString('pt-BR')} —{' '}
                {new Date(festival.end_date).toLocaleDateString('pt-BR')}
              </span>
              {festival.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {[festival.venue_name, festival.city, festival.state]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Status controls */}
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {transition && (
              <form action={updateStatus}>
                <input type="hidden" name="status" value={transition.next} />
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md border transition-colors ${transition.color}`}
                >
                  {transition.label}
                </button>
              </form>
            )}
            {canCancel && (
              <form action={updateStatus}>
                <input type="hidden" name="status" value="cancelled" />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Cancelar Evento
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {sp?.success && (
        <div className="p-4 bg-green-900/30 border border-green-500/50 text-green-200 rounded-lg text-sm">
          {sp.success}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Categorias',
            value: categories?.length ?? 0,
            href: `#categories`,
            color: 'text-primary',
          },
          {
            label: 'Delegações',
            value: delegationCount ?? 0,
            href: `/organizer/festivals/${id}/delegations`,
            color: 'text-secondary',
          },
          {
            label: 'Prazo Inscrições',
            value: new Date(festival.registration_deadline).toLocaleDateString('pt-BR'),
            href: null,
            color: 'text-accent',
          },
          {
            label: 'Corte Financeiro',
            value: new Date(festival.payment_cutoff_date).toLocaleDateString('pt-BR'),
            href: null,
            color: 'text-highlight',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="glass-panel border border-gray-800 rounded-xl p-4 flex flex-col"
          >
            <span className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">{s.label}</span>
            {s.href && (
              <Link
                href={s.href}
                className="text-[10px] text-primary hover:text-secondary mt-2 font-bold transition-colors"
              >
                Ver todos →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Categories */}
      <section id="categories" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading text-white tracking-wider flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            Categorias
          </h2>
        </div>

        {!categories || categories.length === 0 ? (
          <div className="glass-panel border border-dashed border-gray-700 rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm">Nenhuma categoria cadastrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="glass-panel border border-gray-800 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-white text-sm">{cat.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-900 px-2 py-0.5 rounded flex-shrink-0">
                    {cat.is_competitive ? 'Competitiva' : 'Exibição'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  <span>{MODALITY_LABEL[cat.modality as CategoryModality]}</span>
                  <span>·</span>
                  <span>{FORMATION_LABEL[cat.formation as FormationType]}</span>
                  <span>·</span>
                  <span>{cat.max_duration_seconds}s</span>
                  {(cat.min_age || cat.max_age) && (
                    <>
                      <span>·</span>
                      <span>
                        {cat.min_age ?? '0'}–{cat.max_age ?? '∞'} anos
                      </span>
                    </>
                  )}
                </div>
                {(cat.base_fee > 0 || cat.inscription_fee_per_dancer > 0) && (
                  <p className="text-xs text-gray-500">
                    R$ {Number(cat.base_fee).toFixed(2)} / coreo
                    {cat.inscription_fee_per_dancer > 0 &&
                      ` + R$ ${Number(cat.inscription_fee_per_dancer).toFixed(2)} / bailarino`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent delegations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading text-white tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" />
            Delegações Recentes
          </h2>
          <Link
            href={`/organizer/festivals/${id}/delegations`}
            className="text-xs text-primary hover:text-secondary font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1"
          >
            Ver todas
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!recentDelegations || recentDelegations.length === 0 ? (
          <div className="glass-panel border border-dashed border-gray-700 rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm">Nenhuma escola inscrita ainda.</p>
            {festival.status === 'draft' && (
              <p className="text-xs text-gray-600 mt-1">
                Publique o festival para que as escolas possam se inscrever.
              </p>
            )}
          </div>
        ) : (
          <div className="glass-panel border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/50 text-gray-400 text-xs uppercase tracking-widest border-b border-gray-800">
                  <th className="p-4 font-semibold">Escola</th>
                  <th className="p-4 font-semibold hidden md:table-cell">Ônibus / Hotel</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Inscrita em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentDelegations.map((d: any) => (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="text-white font-medium text-sm">{d.schools?.name}</p>
                      {d.schools?.city && (
                        <p className="text-xs text-gray-500">
                          {d.schools.city}
                          {d.schools.state ? `, ${d.schools.state}` : ''}
                        </p>
                      )}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-xs text-gray-400">
                        {d.bus_spots_requested} ônibus · {d.hotel_spots_requested} hotel
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                          DELEGATION_STATUS_CLASSES[d.status as DelegationStatus]
                        }`}
                      >
                        {DELEGATION_STATUS_LABEL[d.status as DelegationStatus]}
                      </span>
                    </td>
                    <td className="p-4 text-right text-xs text-gray-500">
                      {new Date(d.enrolled_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
