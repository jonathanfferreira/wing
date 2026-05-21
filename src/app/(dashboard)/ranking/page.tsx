import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Medal, Award, Flame, Star } from 'lucide-react'

type RankEntry = {
  dancer_id: string
  full_name: string
  xp: number
  level: number
  current_streak: number
  longest_streak: number
  rank: number
  xp_level: number
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
  return (
    <span className="font-data text-sm text-gray-500 w-5 text-center">
      {rank}
    </span>
  )
}

function rankBgClass(rank: number) {
  if (rank === 1) return 'border-yellow-400/30 bg-yellow-400/5 glow-gold'
  if (rank === 2) return 'border-gray-300/20 bg-gray-300/5'
  if (rank === 3) return 'border-amber-600/20 bg-amber-600/5'
  return 'border-white/5 bg-white/[0.02]'
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ranking } = await supabase
    .from('ranking_global')
    .select('*')

  const entries: RankEntry[] = ranking ?? []

  const myEntry = entries.find(e => e.dancer_id === user.id)

  return (
    <div className="space-y-8">

      {/* ── Cabeçalho ── */}
      <div>
        <p className="text-gray-500 text-sm uppercase tracking-widest font-sans mb-1">Wing</p>
        <h1 className="font-heading text-3xl md:text-4xl text-white">Ranking Global</h1>
        <p className="text-gray-500 text-sm mt-1">Top 100 dançarinos por XP acumulado</p>
      </div>

      {/* ── Card do usuário atual ── */}
      {myEntry && (
        <div className="glass-panel rounded-2xl p-5 border border-primary/30 glow-primary">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-sans">Sua posição</p>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-neon p-[2px]">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                <span className="font-data text-xs text-white">{initials(myEntry.full_name)}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{myEntry.full_name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                {myEntry.current_streak > 0 && (
                  <span className="flex items-center gap-1 text-xs text-orange-400">
                    <Flame className="w-3 h-3" />
                    {myEntry.current_streak}
                  </span>
                )}
                <span className="text-xs text-gray-500 font-data">Lv {myEntry.xp_level}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-data text-2xl text-gradient-neon">{myEntry.xp.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-500 font-data">XP · #{myEntry.rank}</p>
            </div>
          </div>
          {/* XP bar */}
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-[10px] text-gray-600 font-data">
              <span>Nível {myEntry.xp_level}</span>
              <span>{myEntry.xp % 1000} / 1000 XP</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-neon rounded-full transition-all duration-700"
                style={{ width: `${(myEntry.xp % 1000) / 10}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Leaderboard ── */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* Podium top 3 */}
        {entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/5">
            {[entries[1], entries[0], entries[2]].map((entry, idx) => {
              const podiumOrder = [2, 1, 3]
              const heights = ['h-20', 'h-28', 'h-16']
              const pos = podiumOrder[idx]
              return (
                <div key={entry.dancer_id} className="flex flex-col items-center justify-end pb-4 pt-6 gap-2 bg-black/40">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-data ${
                    pos === 1 ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40' :
                    pos === 2 ? 'bg-gray-300/10 text-gray-300 border border-gray-300/20' :
                    'bg-amber-600/10 text-amber-600 border border-amber-600/20'
                  }`}>
                    {initials(entry.full_name)}
                  </div>
                  <p className="text-xs text-white text-center font-medium leading-tight px-1 truncate w-full text-center">
                    {entry.full_name.split(' ')[0]}
                  </p>
                  <p className="font-data text-sm text-gradient-neon">{entry.xp.toLocaleString('pt-BR')} XP</p>
                  <div className={`w-full ${heights[idx]} flex items-center justify-center ${
                    pos === 1 ? 'bg-yellow-400/10' : pos === 2 ? 'bg-gray-300/5' : 'bg-amber-600/5'
                  }`}>
                    <RankIcon rank={pos} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Lista completa */}
        <div className="divide-y divide-white/5">
          {entries.map(entry => {
            const isMe = entry.dancer_id === user.id
            return (
              <div
                key={entry.dancer_id}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                  isMe
                    ? 'bg-primary/5 border-l-2 border-primary'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* Rank */}
                <div className="w-8 flex-shrink-0 flex justify-center">
                  <RankIcon rank={entry.rank} />
                </div>

                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-data border ${rankBgClass(entry.rank)}`}>
                  {initials(entry.full_name)}
                </div>

                {/* Nome + streak */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isMe ? 'text-white' : 'text-gray-200'}`}>
                    {entry.full_name}
                    {isMe && <span className="ml-2 text-[10px] text-primary font-data uppercase tracking-wider">Você</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-600 font-data">Lv {entry.xp_level}</span>
                    {entry.current_streak > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-orange-500">
                        <Flame className="w-2.5 h-2.5" />
                        {entry.current_streak}
                      </span>
                    )}
                  </div>
                </div>

                {/* XP */}
                <span className="font-data text-sm text-right flex-shrink-0 text-white">
                  {entry.xp.toLocaleString('pt-BR')}
                  <span className="text-gray-600 ml-1 text-xs">XP</span>
                </span>
              </div>
            )
          })}

          {entries.length === 0 && (
            <div className="text-center py-16 text-gray-600">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum dançarino no ranking ainda.</p>
              <p className="text-xs mt-1">Participe de festivais para acumular XP.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
