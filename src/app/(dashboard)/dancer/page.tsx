import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DancerDashboardClient from './DancerDashboardClient'

export default async function DancerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Busca paralela de todos os dados necessários
  const [profileResult, inscriptionsResult, invoicesResult, festivalsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),

    supabase
      .from('inscriptions')
      .select(`
        id, school_status, festival_status, created_at,
        choreographies ( id, name, category, schools ( name ) )
      `)
      .eq('dancer_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('invoices')
      .select('id, status, total_amount, amount, due_date, created_at, festivals ( name )')
      .eq('dancer_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('festivals')
      .select('id, name, start_date, end_date, registration_deadline, description')
      .eq('status', 'active')
      .order('start_date', { ascending: true })
      .limit(4),
  ])

  const profile = profileResult.data
  const inscriptions = inscriptionsResult.data ?? []
  // Normaliza amount → total_amount (compatibilidade com schema real do banco)
  const invoices = (invoicesResult.data ?? []).map(inv => ({
    ...inv,
    total_amount: inv.total_amount ?? inv.amount ?? 0,
  }))
  const festivals = festivalsResult.data ?? []

  // Stats derivadas
  const stats = {
    totalInscriptions: inscriptions.length,
    approvedInscriptions: inscriptions.filter(i => i.school_status === 'approved').length,
    pendingPayment: invoices.filter(i => i.status === 'pending').length,
    totalPaid: invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + (inv.total_amount || 0), 0),
  }

  return (
    <DancerDashboardClient
      profile={profile}
      inscriptions={inscriptions as any}
      invoices={invoices}
      festivals={festivals ?? []}
      stats={stats}
    />
  )
}
