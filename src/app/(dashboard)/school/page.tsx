import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CalendarRange, Sparkles, Navigation, CheckCircle2, Clock } from 'lucide-react'
import { redirect } from 'next/navigation'
import { confirmInscription } from '@/app/actions/school'

export default async function SchoolDashboard({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const resolvedParams = await searchParams

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'school_director') redirect('/login')

  const { data: school } = await supabase.from('schools').select('*').eq('director_id', user.id).single()

  const { data: activeFestivals } = await supabase
    .from('festivals')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: true })

  const { data: myChoreographies } = await supabase
    .from('choreographies')
    .select(`
      id, name,
      festival_categories ( name ),
      delegations!inner ( school_id, festivals ( name ) ),
      inscriptions ( id, school_status, festival_status, created_at )
    `)
    .eq('delegations.school_id', school?.id)
    .order('created_at', { ascending: false })

  const schoolStatusBadge = (school_status: string, festival_status: string) => {
    if (festival_status === 'approved') return { label: 'Aprovada ✓', color: 'bg-green-900/40 text-green-400 border border-green-700/50' }
    if (festival_status === 'rejected') return { label: 'Rejeitada', color: 'bg-red-900/40 text-red-400 border border-red-700/50' }
    if (school_status === 'approved') return { label: 'Enviada p/ análise', color: 'bg-blue-900/40 text-blue-400 border border-blue-700/50' }
    return { label: 'Rascunho', color: 'bg-orange-900/40 text-orange-400 border border-orange-700/50' }
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-4xl font-heading text-white tracking-wider">Dashboard da Escola</h1>
        <p className="text-primary font-data text-sm mt-1">{school?.name || 'Escola não configurada'}</p>
      </div>

      {resolvedParams?.success && (
        <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 text-green-200 rounded-md font-sans flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {resolvedParams.success}
        </div>
      )}
      {resolvedParams?.error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-md font-sans">
          {resolvedParams.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Festivais Abertos */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-800 pb-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-heading text-white">Festivais com Inscrições Abertas</h2>
          </div>

          {!activeFestivals || activeFestivals.length === 0 ? (
            <div className="p-8 border border-gray-800 border-dashed rounded-xl text-center text-gray-500 font-sans">
              Nenhum festival está recebendo inscrições no momento.
            </div>
          ) : (
            <div className="space-y-4">
              {activeFestivals.map(festival => (
                <div key={festival.id} className="glass-panel p-5 border border-gray-800 rounded-xl hover:border-secondary/50 transition-colors group">
                  <h3 className="text-lg font-heading text-white mb-1 truncate" title={festival.name}>{festival.name}</h3>
                  <div className="flex items-center text-xs text-gray-400 mb-4 font-sans">
                    <CalendarRange className="w-4 h-4 mr-2" />
                    {new Date(festival.start_date).toLocaleDateString('pt-BR')} até {new Date(festival.end_date).toLocaleDateString('pt-BR')}
                  </div>
                  <Link
                    href={`/school/enroll/${festival.id}`}
                    className="inline-flex w-full justify-center items-center px-4 py-2 bg-white/5 hover:bg-secondary/20 text-secondary border border-secondary/30 rounded-md font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Inscrever Coreografias
                    <Navigation className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inscrições da Escola */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-800 pb-2">
            <h2 className="text-xl font-heading text-white">Nossas Inscrições / Coreografias</h2>
          </div>

          {!myChoreographies || myChoreographies.length === 0 ? (
            <div className="glass-panel p-12 border border-gray-800 rounded-xl text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                <span className="text-gray-600">🎭</span>
              </div>
              <p className="text-gray-400 max-w-sm font-sans">Você ainda não inscreveu nenhuma coreografia em festivais pela sua escola.</p>
            </div>
          ) : (
            <div className="glass-panel border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/50 text-gray-400 text-xs uppercase tracking-widest border-b border-gray-800">
                    <th className="p-4 font-semibold">Coreografia</th>
                    <th className="p-4 font-semibold">Festival</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                    <th className="p-4 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {myChoreographies.map((choreo: any) => {
                    const ins = Array.isArray(choreo.inscriptions) ? choreo.inscriptions[0] : choreo.inscriptions
                    const delegation = Array.isArray(choreo.delegations) ? choreo.delegations[0] : choreo.delegations
                    const festival = delegation?.festivals ? (Array.isArray(delegation.festivals) ? delegation.festivals[0] : delegation.festivals) : null
                    const categoryName = choreo.festival_categories ? (Array.isArray(choreo.festival_categories) ? choreo.festival_categories[0]?.name : choreo.festival_categories?.name) : '—'
                    const badge = ins ? schoolStatusBadge(ins.school_status, ins.festival_status) : { label: 'Sem inscrição', color: 'bg-gray-800 text-gray-500' }
                    const isPending = ins?.school_status === 'pending'

                    return (
                      <tr key={choreo.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <p className="text-white font-medium font-sans">{choreo.name}</p>
                          <p className="text-xs text-gray-500 font-data uppercase tracking-wider">{categoryName}</p>
                        </td>
                        <td className="p-4 text-sm text-gray-300 font-sans">
                          {festival?.name ?? '—'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {isPending && ins ? (
                            <form action={confirmInscription}>
                              <input type="hidden" name="inscription_id" value={ins.id} />
                              <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-md text-xs font-bold uppercase tracking-wider transition-colors">
                                <Clock className="w-3 h-3" /> Confirmar
                              </button>
                            </form>
                          ) : (
                            <span className="text-gray-600 text-xs font-sans">—</span>
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

      </div>
    </div>
  )
}
