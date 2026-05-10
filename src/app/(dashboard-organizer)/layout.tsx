import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CalendarRange, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer') redirect('/login')

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[150px] rounded-full" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[150px] rounded-full" />

      {/* Sidebar */}
      <aside className="relative z-10 hidden md:flex w-64 flex-shrink-0 flex-col border-r border-gray-800/50 bg-black/40 backdrop-blur-md">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-800/50">
          <Link
            href="/organizer"
            className="font-heading text-2xl tracking-wider text-white hover:opacity-80 transition-opacity"
          >
            WING
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
            ORG
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <Link
            href="/organizer"
            className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors group"
          >
            <LayoutDashboard className="w-5 h-5 mr-3 group-hover:text-primary transition-colors" />
            <span className="font-display text-sm tracking-wider">Overview</span>
          </Link>
          <Link
            href="/organizer/festivals"
            className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors group"
          >
            <CalendarRange className="w-5 h-5 mr-3 group-hover:text-secondary transition-colors" />
            <span className="font-display text-sm tracking-wider">Meus Festivais</span>
          </Link>
        </nav>

        {/* User + signout */}
        <div className="p-4 border-t border-gray-800/50 space-y-1">
          <div className="flex items-center px-4 py-3 gap-3">
            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-neon p-[2px]">
              <div className="h-full w-full bg-black rounded-full flex items-center justify-center">
                <Settings className="w-4 h-4 text-gray-300" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {profile?.full_name}
              </p>
              <p className="text-[10px] text-primary uppercase tracking-wider">
                Organizador
              </p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center px-4 py-2.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors">
              <LogOut className="w-4 h-4 mr-3" />
              <span className="font-display text-sm tracking-wider">Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-800/50 bg-black/20 backdrop-blur-md">
          <span className="md:hidden font-heading text-xl text-white">WING</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-400">{profile?.full_name}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
              Organizador
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  )
}
