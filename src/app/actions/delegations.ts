'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { DelegationStatus } from '@/types/domain'

export async function createDelegation(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'school_director') {
    throw new Error('Apenas diretores de escola podem criar delegações.')
  }

  const festival_id            = formData.get('festival_id') as string
  const bus_spots_requested    = parseInt((formData.get('bus_spots_requested') as string) || '0')
  const hotel_spots_requested  = parseInt((formData.get('hotel_spots_requested') as string) || '0')
  const logistics_notes        = (formData.get('logistics_notes') as string) || null

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('director_id', user.id)
    .single()

  if (!school) redirect('/onboarding')

  const { data: delegation, error } = await supabase
    .from('delegations')
    .insert({
      festival_id,
      school_id: school.id,
      director_id: user.id,
      bus_spots_requested,
      hotel_spots_requested,
      logistics_notes,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) {
    const msg =
      error.code === '23505'
        ? 'Sua escola já possui uma delegação neste festival.'
        : error.message
    redirect(`/school/enroll/${festival_id}?error=${encodeURIComponent(msg)}`)
  }

  revalidatePath('/school')
  redirect(`/school/delegations/${delegation.id}?success=Delegação+criada+com+sucesso`)
}

export async function updateDelegationStatus(delegationId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const status = formData.get('status') as DelegationStatus
  const festival_id = formData.get('festival_id') as string

  const extra: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'approved') extra.approved_at = new Date().toISOString()

  const { error } = await supabase
    .from('delegations')
    .update(extra)
    .eq('id', delegationId)

  if (error) throw new Error('Falha ao atualizar delegação: ' + error.message)

  revalidatePath(`/organizer/festivals/${festival_id}/delegations`)
  revalidatePath(`/organizer/festivals/${festival_id}`)
}
