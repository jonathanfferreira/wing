import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { CalendarRange, Clock, Tag, Music, ChevronRight } from 'lucide-react'

type Category = {
  id: string
  name: string
  max_duration_seconds: number
  base_fee: number
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}min ${s}s` : `${m}min`
}

function isOpen(deadline: string) {
  return new Date(deadline) > new Date()
}

export default async function FestivalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: festival }, { data: categories }] = await Promise.all([
    supabase.from('festivals').select('*').eq('id', id).single(),
    supabase.from('categories').select('*').eq('festival_id', id).order('name'),
  ])

  if (!festival) notFound()

  const open = isOpen(festival.registration_deadline)

  return (
    <div className="min-h-screen bg-black text-gray-100">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-1/3 h-48 bg-secondary/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className={`inline-block w-2 h-2 rounded-full ${open ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
            <span className={`font-data text-xs uppercase tracking-widest ${open ? 'text-emerald-400' : 'text-gray-500'}`}>
              {open ? 'Inscrições Abertas' : 'Inscrições Encerradas'}
            </span>
          </div>

          <h1 className="font-heading text-4xl md:text-6xl text-white mb-6 leading-tight">
            {festival.name}
          </h1>

          {festival.description && (
            <p className="text-gray-400 text-base md:text-lg max-w-2xl leading-relaxed mb-8">
              {festival.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            <InfoPill icon={<CalendarRange className="w-4 h-4" />} label="Realização">
              {formatDate(festival.start_date)} — {formatDate(festival.end_date)}
            </InfoPill>
            <InfoPill icon={<Clock className="w-4 h-4" />} label="Inscrições até">
              {formatDate(festival.registration_deadline)}
            </InfoPill>
          </div>

          {open && (
            <a
              href="/login"
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-gradient-neon rounded-xl font-heading text-sm text-white uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Inscrever-se agora
              <ChevronRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* ── Categorias ── */}
      <div className="max-w-4xl mx-auto px-6 pb-20 space-y-8">

        <div>
          <div className="flex items-center gap-2 mb-6">
            <Tag className="w-4 h-4 text-secondary" />
            <h2 className="font-heading text-2xl text-white">Categorias</h2>
            <span className="font-data text-xs text-gray-600 ml-1">({categories?.length ?? 0})</span>
          </div>

          {!categories || categories.length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 text-center text-gray-600">
              <Tag className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Categorias ainda não divulgadas.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((cat: Category) => (
                <div
                  key={cat.id}
                  className="glass-panel rounded-xl p-4 hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-heading text-sm text-white">{cat.name}</p>
                    <span className="font-data text-lg text-gradient-neon flex-shrink-0">
                      {cat.base_fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Music className="w-3 h-3" />
                      Até {formatDuration(cat.max_duration_seconds)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-heading text-lg text-white mb-4">Informações de Pagamento</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-gray-500">Prazo de Inscrição</span>
              <span className="text-white">{formatDate(festival.registration_deadline)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">Corte de Pagamento</span>
              <span className="text-white">{formatDate(festival.payment_cutoff_date)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function InfoPill({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-lg px-4 py-2 flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <div>
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-data">{label}</p>
        <p className="text-sm text-white">{children}</p>
      </div>
    </div>
  )
}
