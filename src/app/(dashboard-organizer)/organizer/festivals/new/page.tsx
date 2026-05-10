import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FestivalForm } from '@/components/organizer/FestivalForm'

export default async function NewFestivalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/organizer/festivals"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Meus Festivais
        </Link>
        <h1 className="text-4xl font-heading text-white tracking-wider">Lançar Novo Festival</h1>
        <p className="text-gray-400 mt-1">
          Configure identidade, cronograma e categorias. O festival será salvo como rascunho.
        </p>
      </div>

      <div className="glass-panel border border-gray-800 rounded-2xl p-6 md:p-10">
        <FestivalForm error={error} />
      </div>
    </div>
  )
}
