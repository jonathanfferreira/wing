import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Music, Info, AlertTriangle } from 'lucide-react'
import { redirect } from 'next/navigation'
import { enrollChoreography } from '@/app/actions/school'

export default async function EnrollChoreographyPage({
  params,
  searchParams
}: {
  params: Promise<{ festivalId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const festivalId = resolvedParams.festivalId

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: festival } = await supabase.from('festivals').select('*').eq('id', festivalId).single()
  if (!festival) redirect('/school?error=Festival%20não%20encontrado')

  const { data: categories } = await supabase
    .from('festival_categories')
    .select('id, name, max_duration_seconds, base_fee')
    .eq('festival_id', festivalId)
    .order('name', { ascending: true })

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/school" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors font-sans">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Dashboard
        </Link>
        <h1 className="text-3xl font-heading text-white tracking-wider">Inscrever Coreografia</h1>
        <p className="text-secondary font-data text-xs uppercase tracking-widest mt-2 border border-secondary/30 bg-secondary/10 px-3 py-1 inline-block rounded-full">
          {festival.name}
        </p>
      </div>

      {!categories || categories.length === 0 ? (
        <div className="glass-panel border border-yellow-700/30 bg-yellow-900/10 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
          <h2 className="text-lg font-heading text-yellow-300 mb-2">Sem Categorias Configuradas</h2>
          <p className="text-sm text-gray-400 font-sans">
            O organizador ainda não adicionou categorias a este festival. Tente novamente em breve.
          </p>
        </div>
      ) : (
        <div className="glass-panel border border-gray-800 rounded-2xl p-6 md:p-8">
          {resolvedSearchParams?.error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-md font-sans">
              {resolvedSearchParams.error}
            </div>
          )}

          <form action={enrollChoreography} className="space-y-8">
            <input type="hidden" name="festival_id" value={festival.id} />

            {/* Dados da Coreografia */}
            <div className="space-y-4">
              <h2 className="text-lg font-heading text-white border-b border-gray-800 pb-2 flex items-center">
                <Info className="w-5 h-5 mr-2 text-primary" /> Ficha Técnica
              </h2>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-400" htmlFor="name">
                  Nome da Coreografia
                </label>
                <input
                  required
                  name="name"
                  id="name"
                  className="w-full rounded-md px-4 py-3 bg-black/50 border border-gray-700 text-white focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary font-sans"
                  placeholder="Ex: Noites de Sol"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-400" htmlFor="category_id">
                  Categoria
                </label>
                <select
                  required
                  name="category_id"
                  id="category_id"
                  className="w-full rounded-md px-4 py-3 bg-black/50 border border-gray-700 text-white focus:outline-none focus:border-accent transition-colors focus:ring-1 focus:ring-accent appearance-none font-sans"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} — {Math.round(cat.max_duration_seconds / 60)} min · R$ {Number(cat.base_fee).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Trilha Sonora */}
            <div className="space-y-4">
              <h2 className="text-lg font-heading text-white border-b border-gray-800 pb-2 flex items-center">
                <Music className="w-5 h-5 mr-2 text-secondary" /> Trilha Sonora
              </h2>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-gray-400" htmlFor="music_url">
                  Link da Música (YouTube ou Google Drive Público)
                </label>
                <input
                  name="music_url"
                  id="music_url"
                  type="url"
                  className="w-full rounded-md px-4 py-3 bg-black/50 border border-gray-700 text-white focus:outline-none focus:border-secondary transition-colors focus:ring-1 focus:ring-secondary font-sans"
                  placeholder="https://youtube.com/..."
                />
                <p className="text-xs text-gray-500 font-sans">Verifique se o link não está privado!</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-800 flex justify-end">
              <button
                type="submit"
                className="bg-gradient-neon rounded-md px-8 py-3 text-white font-bold uppercase tracking-wider font-display hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                Adicionar ao Carrinho da Escola
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
