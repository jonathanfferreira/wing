import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { updateDelegationStatus } from '@/app/actions/delegations'
import {
  DELEGATION_STATUS_LABEL,
  type DelegationStatus,
} from '@/types/domain'

const STATUS_CLASSES: Record<DelegationStatus, string> = {
  draft: 'bg-gray-800 text-gray-400',
  submitted: 'bg-blue-900/40 text-blue-400 border border-blue-700/50',
  approved: 'bg-green-900/40 text-green-400 border border-green-700/50',
  rejected: 'bg-red-900/40 text-red-400 border border-red-700/50',
  suspended: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/50',
}

const ALL_STATUSES: DelegationStatus[] = [
  'submitted',
  'approved',
  'draft',
  'rejected',
  'suspended',
]

export default async function DelegationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: DelegationStatus }>
}) {
  const { id: festivalId } = await params
  const { status: filterStatus } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: festival } = await supabase
    .from('festivals')
    .select('id, name')
    .eq('id', festivalId)
    .eq('organizer_id', user.id)
    .single()

  if (!festival) redirect('/organizer/festivals')

  let query = supabase
    .from('delegations')
    .select(
      `id, status, bus_spots_requested, hotel_spots_requested, logistics_notes, total_due, total_paid, enrolled_at, submitted_at,
       schools ( name, city, state ),
       profiles!delegations_director_id_fkey ( full_name, phone )`
    )
    .eq('festival_id', festivalId)
    .order('enrolled_at', { ascending: false })

  if (filterStatus) {
    query = query.eq('status', filterStatus)
  }

  const { data: delegations } = await query

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/organizer/festivals/${festivalId}`}
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para {festival.name}
        </Link>
        <h1 className="text-4xl font-heading text-white tracking-wider">Delegações</h1>
        <p className="text-gray-400 mt-1">
          Gerencie as escolas inscritas em{' '}
          <span className="text-white font-medium">{festival.name}</span>.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/organizer/festivals/${festivalId}/delegations`}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md border transition-colors ${
            !filterStatus
              ? 'border-primary/50 text-primary bg-primary/10'
              : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
          }`}
        >
          Todas
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/organizer/festivals/${festivalId}/delegations?status=${s}`}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md border transition-colors ${
              filterStatus === s
                ? 'border-primary/50 text-primary bg-primary/10'
                : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
            }`}
          >
            {DELEGATION_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {/* Table */}
      {!delegations || delegations.length === 0 ? (
        <div className="glass-panel border border-dashed border-gray-700 rounded-xl p-12 text-center">
          <p className="text-gray-500">
            {filterStatus
              ? `Nenhuma delegação com status "${DELEGATION_STATUS_LABEL[filterStatus]}".`
              : 'Nenhuma escola inscrita neste festival ainda.'}
          </p>
        </div>
      ) : (
        <div className="glass-panel border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/50 text-gray-400 text-xs uppercase tracking-widest border-b border-gray-800">
                <th className="p-4 font-semibold">Escola / Diretor</th>
                <th className="p-4 font-semibold hidden lg:table-cell">Logística</th>
                <th className="p-4 font-semibold hidden md:table-cell">Financeiro</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {delegations.map((d: any) => {
                const approveAction = updateDelegationStatus.bind(null, d.id)
                const rejectAction = updateDelegationStatus.bind(null, d.id)
                const suspendAction = updateDelegationStatus.bind(null, d.id)

                return (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors align-top">
                    <td className="p-4">
                      <p className="font-medium text-white text-sm">{d.schools?.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {d.schools?.city}
                        {d.schools?.state ? `, ${d.schools.state}` : ''}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Dir: {d.profiles?.full_name}
                      </p>
                    </td>

                    <td className="p-4 hidden lg:table-cell">
                      <p className="text-xs text-gray-400">
                        🚌 {d.bus_spots_requested} vagas
                      </p>
                      <p className="text-xs text-gray-400">
                        🏨 {d.hotel_spots_requested} vagas
                      </p>
                      {d.logistics_notes && (
                        <p className="text-xs text-gray-600 mt-1 max-w-[160px] truncate" title={d.logistics_notes}>
                          {d.logistics_notes}
                        </p>
                      )}
                    </td>

                    <td className="p-4 hidden md:table-cell">
                      <p className="text-xs text-gray-400">
                        Devido:{' '}
                        <span className="text-white">
                          R$ {Number(d.total_due).toFixed(2)}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        Pago:{' '}
                        <span
                          className={
                            d.total_paid >= d.total_due && d.total_due > 0
                              ? 'text-green-400'
                              : 'text-yellow-400'
                          }
                        >
                          R$ {Number(d.total_paid).toFixed(2)}
                        </span>
                      </p>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                          STATUS_CLASSES[d.status as DelegationStatus]
                        }`}
                      >
                        {DELEGATION_STATUS_LABEL[d.status as DelegationStatus]}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        {d.status === 'submitted' && (
                          <>
                            <form action={approveAction}>
                              <input type="hidden" name="status" value="approved" />
                              <input type="hidden" name="festival_id" value={festivalId} />
                              <button
                                type="submit"
                                className="text-[10px] font-bold uppercase tracking-wider text-green-400 border border-green-500/30 hover:bg-green-500/10 px-2.5 py-1 rounded transition-colors"
                              >
                                Aprovar
                              </button>
                            </form>
                            <form action={rejectAction}>
                              <input type="hidden" name="status" value="rejected" />
                              <input type="hidden" name="festival_id" value={festivalId} />
                              <button
                                type="submit"
                                className="text-[10px] font-bold uppercase tracking-wider text-red-400 border border-red-500/30 hover:bg-red-500/10 px-2.5 py-1 rounded transition-colors"
                              >
                                Rejeitar
                              </button>
                            </form>
                          </>
                        )}
                        {d.status === 'approved' && (
                          <form action={suspendAction}>
                            <input type="hidden" name="status" value="suspended" />
                            <input type="hidden" name="festival_id" value={festivalId} />
                            <button
                              type="submit"
                              className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/10 px-2.5 py-1 rounded transition-colors"
                            >
                              Suspender
                            </button>
                          </form>
                        )}
                        {d.status === 'suspended' && (
                          <form action={approveAction}>
                            <input type="hidden" name="status" value="approved" />
                            <input type="hidden" name="festival_id" value={festivalId} />
                            <button
                              type="submit"
                              className="text-[10px] font-bold uppercase tracking-wider text-green-400 border border-green-500/30 hover:bg-green-500/10 px-2.5 py-1 rounded transition-colors"
                            >
                              Reativar
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
