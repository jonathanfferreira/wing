import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Users, CheckCircle2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import { addCategory, deleteCategory, updateFestivalStatus } from '@/app/actions/festivals'

export default async function EditFestivalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { id } = await params
  const resolvedSearch = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'organizer') redirect('/festivals')

  const { data: festival } = await supabase.from('festivals').select('*').eq('id', id).eq('organizer_id', user.id).single()
  if (!festival) redirect('/festivals')

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('festival_id', id)
    .order('created_at', { ascending: true })

  const { count: inscriptionCount } = await supabase
    .from('inscriptions')
    .select('id', { count: 'exact', head: true })
    .in('choreography_id',
      (await supabase.from('choreographies').select('id').eq('festival_id', id)).data?.map(c => c.id) ?? []
    )

  const statusLabel: Record<string, string> = {
    draft: 'Rascunho',
    active: 'Ativo',
    closed: 'Encerrado',
  }

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-800 text-gray-400',
    active: 'bg-green-900/50 text-green-400 border border-green-700/50',
    closed: 'bg-red-900/50 text-red-400 border border-red-700/50',
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/festivals" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors font-sans">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Meus Festivais
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-heading text-white tracking-wider">{festival.name}</h1>
          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full ${statusColor[festival.status] ?? statusColor.draft}`}>
            {statusLabel[festival.status] ?? festival.status}
          </span>
        </div>
        <p className="text-gray-500 mt-1 font-sans text-sm">{festival.description}</p>
      </div>

      {resolvedSearch?.success && (
        <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 text-green-200 rounded-md font-sans flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {resolvedSearch.success}
        </div>
      )}
      {resolvedSearch?.error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-md font-sans">
          {resolvedSearch.error}
        </div>
      )}

      {/* Status do festival */}
      <div className="glass-panel border border-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-heading text-white mb-4">Status do Evento</h2>
        <div className="flex flex-wrap gap-3">
          {festival.status === 'draft' && (categories?.length ?? 0) > 0 && (
            <form action={updateFestivalStatus}>
              <input type="hidden" name="festival_id" value={id} />
              <input type="hidden" name="status" value="active" />
              <button type="submit" className="px-6 py-2 bg-green-700 hover:bg-green-600 text-white font-bold uppercase tracking-wider text-sm rounded-md transition-colors">
                Publicar Evento
              </button>
            </form>
          )}
          {festival.status === 'draft' && (categories?.length ?? 0) === 0 && (
            <p className="text-sm text-yellow-500 font-sans">Adicione ao menos uma categoria para publicar o festival.</p>
          )}
          {festival.status === 'active' && (
            <>
              <Link
                href={`/festivals/${id}/inscriptions`}
                className="inline-flex items-center gap-2 px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 font-bold uppercase tracking-wider text-sm rounded-md transition-colors"
              >
                <Users className="w-4 h-4" />
                Ver Inscrições {inscriptionCount ? `(${inscriptionCount})` : ''}
              </Link>
              <form action={updateFestivalStatus}>
                <input type="hidden" name="festival_id" value={id} />
                <input type="hidden" name="status" value="closed" />
                <button type="submit" className="px-6 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 border border-red-700/50 font-bold uppercase tracking-wider text-sm rounded-md transition-colors">
                  Encerrar Evento
                </button>
              </form>
            </>
          )}
          {festival.status === 'closed' && (
            <Link
              href={`/festivals/${id}/inscriptions`}
              className="inline-flex items-center gap-2 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold uppercase tracking-wider text-sm rounded-md transition-colors"
            >
              <Users className="w-4 h-4" />
              Ver Inscrições
            </Link>
          )}
        </div>
      </div>

      {/* Categorias */}
      <div className="glass-panel border border-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-heading text-white mb-4">Categorias</h2>

        {!categories || categories.length === 0 ? (
          <p className="text-sm text-gray-500 font-sans mb-6">Nenhuma categoria adicionada ainda.</p>
        ) : (
          <div className="space-y-2 mb-6">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-black/30 border border-gray-800 rounded-lg">
                <div>
                  <p className="text-white font-bold text-sm">{cat.name}</p>
                  <p className="text-xs text-gray-500 font-sans">
                    {Math.round(cat.max_duration_seconds / 60)} min · R$ {Number(cat.base_fee).toFixed(2)}
                  </p>
                </div>
                {festival.status === 'draft' && (
                  <form action={deleteCategory}>
                    <input type="hidden" name="category_id" value={cat.id} />
                    <input type="hidden" name="festival_id" value={id} />
                    <button type="submit" className="p-2 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}

        {festival.status === 'draft' && (
          <form action={addCategory} className="border-t border-gray-800 pt-6 space-y-4">
            <h3 className="text-sm font-heading text-gray-300">Adicionar Categoria</h3>
            <input type="hidden" name="festival_id" value={id} />

            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-widest text-gray-400">Nome da Categoria</label>
              <input
                required
                name="name"
                placeholder="Ex: Ballet Clássico - Solo Infantil"
                className="w-full rounded-md px-4 py-3 bg-black/50 border border-gray-700 text-white focus:outline-none focus:border-primary transition-colors font-sans text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-400">Duração Máxima (min)</label>
                <input
                  required
                  type="number"
                  name="max_duration_minutes"
                  min="1"
                  max="30"
                  defaultValue="3"
                  className="w-full rounded-md px-4 py-3 bg-black/50 border border-gray-700 text-white focus:outline-none focus:border-secondary transition-colors font-sans text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-400">Taxa (R$)</label>
                <input
                  required
                  type="number"
                  name="base_fee"
                  min="0"
                  step="0.01"
                  defaultValue="80.00"
                  className="w-full rounded-md px-4 py-3 bg-black/50 border border-gray-700 text-white focus:outline-none focus:border-secondary transition-colors font-sans text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-primary/50 text-white font-bold uppercase tracking-wider text-sm rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Categoria
            </button>
          </form>
        )}
      </div>

      {/* Info do cronograma */}
      <div className="glass-panel border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-heading text-white mb-4">Cronograma</h2>
        <div className="grid grid-cols-2 gap-4 text-sm font-sans">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Início</p>
            <p className="text-white">{new Date(festival.start_date).toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Encerramento</p>
            <p className="text-white">{new Date(festival.end_date).toLocaleDateString('pt-BR')}</p>
          </div>
          {festival.registration_deadline && (
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Prazo Inscrições</p>
              <p className="text-white">{new Date(festival.registration_deadline).toLocaleString('pt-BR')}</p>
            </div>
          )}
          {festival.payment_cutoff_date && (
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Prazo Pagamento</p>
              <p className="text-white">{new Date(festival.payment_cutoff_date).toLocaleString('pt-BR')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
