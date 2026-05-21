import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { redirect } from 'next/navigation'
import { approveInscription, rejectInscription } from '@/app/actions/festivals'

export default async function FestivalInscriptionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string }>
}) {
  const { id } = await params
  const resolvedSearch = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'organizer') redirect('/festivals')

  const { data: festival } = await supabase
    .from('festivals')
    .select('id, name, status')
    .eq('id', id)
    .eq('organizer_id', user.id)
    .single()
  if (!festival) redirect('/festivals')

  // Busca todas as coreografias deste festival via delegations
  const { data: choreographies } = await supabase
    .from('choreographies')
    .select(`
      id, name,
      festival_categories ( name ),
      delegations!inner ( festival_id, schools ( name ) ),
      inscriptions ( id, school_status, festival_status )
    `)
    .eq('delegations.festival_id', id)
    .order('created_at', { ascending: true })

  const statusBadge = (school_status: string) => {
    if (school_status === 'approved') {
      return { label: 'Aprovada', color: 'bg-green-900/40 text-green-400 border border-green-700/50' }
    }
    if (school_status === 'rejected') {
      return { label: 'Rejeitada', color: 'bg-red-900/40 text-red-400 border border-red-700/50' }
    }
    return { label: 'Aguardando análise', color: 'bg-blue-900/40 text-blue-400 border border-blue-700/50' }
  }

  const pending = choreographies?.filter(c => {
    const ins = Array.isArray(c.inscriptions) ? c.inscriptions[0] : c.inscriptions
    return ins?.school_status === 'pending'
  }) ?? []

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <Link href={`/festivals/${id}/edit`} className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors font-sans">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para {festival.name}
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-heading text-white tracking-wider">Inscrições</h1>
            <p className="text-primary font-data text-xs uppercase tracking-widest mt-1">{festival.name}</p>
          </div>
          {pending.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-700/50 rounded-lg text-blue-300 text-sm font-sans">
              <Clock className="w-4 h-4" />
              {pending.length} aguardando análise
            </div>
          )}
        </div>
      </div>

      {resolvedSearch?.success && (
        <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 text-green-200 rounded-md font-sans flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {resolvedSearch.success}
        </div>
      )}

      {!choreographies || choreographies.length === 0 ? (
        <div className="glass-panel border border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-gray-500 font-sans">Nenhuma coreografia inscrita neste festival ainda.</p>
        </div>
      ) : (
        <div className="glass-panel border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 text-gray-400 text-xs uppercase tracking-widest border-b border-gray-800">
                <th className="p-4 font-semibold">Coreografia</th>
                <th className="p-4 font-semibold">Escola</th>
                <th className="p-4 font-semibold">Categoria</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {choreographies.map((choreo: any) => {
                const ins = Array.isArray(choreo.inscriptions) ? choreo.inscriptions[0] : choreo.inscriptions
                const delegation = Array.isArray(choreo.delegations) ? choreo.delegations[0] : choreo.delegations
                const school = delegation?.schools ? (Array.isArray(delegation.schools) ? delegation.schools[0] : delegation.schools) : null
                const categoryName = choreo.festival_categories ? (Array.isArray(choreo.festival_categories) ? choreo.festival_categories[0]?.name : choreo.festival_categories?.name) : '—'
                const badge = ins ? statusBadge(ins.school_status) : { label: 'Sem inscrição', color: 'bg-gray-800 text-gray-500' }
                const canAct = ins?.school_status === 'pending'

                return (
                  <tr key={choreo.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="text-white font-medium font-sans">{choreo.name}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-300 font-sans">
                      {school?.name ?? '—'}
                    </td>
                    <td className="p-4 text-sm text-gray-400 font-data uppercase text-xs tracking-wider">
                      {categoryName}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4">
                      {canAct && ins ? (
                        <div className="flex items-center justify-end gap-2">
                          <form action={approveInscription}>
                            <input type="hidden" name="inscription_id" value={ins.id} />
                            <input type="hidden" name="festival_id" value={id} />
                            <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-900/40 hover:bg-green-800/60 text-green-400 border border-green-700/50 rounded-md text-xs font-bold uppercase tracking-wider transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                            </button>
                          </form>
                          <form action={rejectInscription}>
                            <input type="hidden" name="inscription_id" value={ins.id} />
                            <input type="hidden" name="festival_id" value={id} />
                            <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-800/60 text-red-400 border border-red-700/50 rounded-md text-xs font-bold uppercase tracking-wider transition-colors">
                              <XCircle className="w-3.5 h-3.5" /> Rejeitar
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="text-right text-gray-600 text-xs font-sans">—</div>
                      )}
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
