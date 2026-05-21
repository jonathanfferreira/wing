import Link from 'next/link'
import { CalendarRange, Users, Trophy, ChevronRight, Star, Zap, Shield } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-gray-100 overflow-x-hidden">

      {/* ── Glows de fundo globais ── */}
      <div className="fixed top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="fixed top-[20%] right-[-15%] w-[40%] h-[40%] bg-secondary/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[30%] w-[30%] h-[30%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/5 bg-black/60 backdrop-blur-md">
        <span className="font-heading text-2xl tracking-widest text-white">WING</span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors font-sans"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-heading uppercase tracking-wider text-white bg-primary hover:bg-primary/80 rounded-lg transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-28 pb-24 md:pt-36 md:pb-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="font-data text-xs uppercase tracking-widest text-primary">
            Plataforma #1 para festivais de dança
          </span>
        </div>

        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white leading-[1.05] tracking-tight max-w-4xl">
          O festival começa{' '}
          <span className="text-gradient-neon">aqui.</span>
        </h1>

        <p className="mt-6 text-gray-400 text-lg md:text-xl max-w-xl leading-relaxed font-sans">
          Gerencie inscrições, categorias, pagamentos e rankings de dançarinos em uma única plataforma feita para festivais de dança.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-neon rounded-xl font-heading text-sm uppercase tracking-wider text-white hover:opacity-90 transition-opacity glow-primary"
          >
            Começar agora
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 glass-panel rounded-xl font-heading text-sm uppercase tracking-wider text-gray-300 hover:text-white hover:border-white/20 transition-all"
          >
            Já tenho conta
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { value: '100%', label: 'Online' },
            { value: 'RLS', label: 'Segurança' },
            { value: 'PIX', label: 'Pagamentos' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="font-data text-3xl text-gradient-neon">{s.value}</span>
              <span className="text-xs text-gray-600 uppercase tracking-widest font-sans">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs text-gray-600 uppercase tracking-widest font-data mb-3">Plataforma completa</p>
          <h2 className="text-center font-heading text-3xl md:text-4xl text-white mb-12">
            Tudo que um festival precisa
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <FeatureCard
              icon={<CalendarRange className="w-6 h-6" />}
              iconColor="text-primary"
              title="Gestão de Festivais"
              description="Crie festivais, defina categorias, prazos e taxas de inscrição. Controle total do organizador em um painel limpo."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              iconColor="text-secondary"
              title="Inscrições Online"
              description="Escolas inscrevem coreografias, dançarinos confirmam participação. Aprovações em dois níveis com notificações."
              featured
            />
            <FeatureCard
              icon={<Trophy className="w-6 h-6" />}
              iconColor="text-highlight"
              title="Ranking & XP"
              description="Sistema de experiência que gamifica a jornada do dançarino. Rankings globais e por festival com streak de participação."
            />
          </div>
        </div>
      </section>

      {/* ── Personas ── */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs text-gray-600 uppercase tracking-widest font-data mb-3">Para quem é o Wing</p>
          <h2 className="text-center font-heading text-3xl md:text-4xl text-white mb-12">
            Uma plataforma, três perfis
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <PersonaCard
              emoji="🎪"
              role="Organizador"
              description="Crie e gerencie festivais, defina categorias e acompanhe inscrições e pagamentos em tempo real."
              color="border-primary/30 hover:border-primary/60"
              badge="text-primary bg-primary/10"
            />
            <PersonaCard
              emoji="🏫"
              role="Escola"
              description="Cadastre suas coreografias, gerencie inscrições dos alunos e acompanhe o status em cada festival."
              color="border-secondary/30 hover:border-secondary/60"
              badge="text-secondary bg-secondary/10"
            />
            <PersonaCard
              emoji="💃"
              role="Dançarino"
              description="Veja suas inscrições, acompanhe faturas, acumule XP e suba no ranking entre os melhores do Brasil."
              color="border-highlight/30 hover:border-highlight/60"
              badge="text-highlight bg-highlight/10"
            />
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="relative z-10 px-6 md:px-12 pb-32">
        <div className="max-w-2xl mx-auto text-center glass-panel rounded-3xl p-12 border border-primary/20 glow-primary">
          <Star className="w-8 h-8 text-highlight mx-auto mb-4" />
          <h2 className="font-heading text-3xl md:text-4xl text-white mb-4">
            Pronto para elevar seu festival?
          </h2>
          <p className="text-gray-500 mb-8 font-sans">
            Crie sua conta gratuitamente e comece a organizar hoje.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-neon rounded-xl font-heading text-sm uppercase tracking-wider text-white hover:opacity-90 transition-opacity"
          >
            Criar conta grátis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-heading text-xl tracking-widest text-white">WING</span>
        <p className="text-xs text-gray-700 font-sans">
          © {new Date().getFullYear()} Wing — Plataforma para festivais de dança
        </p>
        <div className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-gray-700" />
          <span className="text-xs text-gray-700 font-sans">Dados protegidos com RLS</span>
        </div>
      </footer>

    </div>
  )
}

function FeatureCard({
  icon, iconColor, title, description, featured,
}: {
  icon: React.ReactNode
  iconColor: string
  title: string
  description: string
  featured?: boolean
}) {
  return (
    <div className={`glass-panel rounded-2xl p-6 space-y-4 transition-all hover:-translate-y-1 ${
      featured ? 'border-secondary/30 bg-secondary/5' : 'hover:border-white/15'
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 ${iconColor}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-heading text-lg text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed font-sans">{description}</p>
      </div>
    </div>
  )
}

function PersonaCard({
  emoji, role, description, color, badge,
}: {
  emoji: string
  role: string
  description: string
  color: string
  badge: string
}) {
  return (
    <div className={`glass-panel rounded-2xl p-6 border transition-all hover:-translate-y-1 cursor-default ${color}`}>
      <div className="text-4xl mb-4">{emoji}</div>
      <span className={`inline-block font-data text-xs uppercase tracking-widest px-2 py-0.5 rounded mb-3 ${badge}`}>
        {role}
      </span>
      <p className="text-sm text-gray-500 leading-relaxed font-sans">{description}</p>
    </div>
  )
}
