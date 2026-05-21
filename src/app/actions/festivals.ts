'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getAuthenticatedOrganizer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'organizer') throw new Error('Apenas organizadores podem realizar esta ação.')
  return { supabase, user }
}

export async function createFestival(formData: FormData) {
  const { supabase, user } = await getAuthenticatedOrganizer()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string
  const registration_deadline = formData.get('registration_deadline') as string
  const payment_cutoff_date = formData.get('payment_cutoff_date') as string

  const { data: festival, error } = await supabase.from('festivals').insert({
    name,
    description,
    start_date,
    end_date,
    status: 'draft',
    organizer_id: user.id,
    registration_deadline: registration_deadline || null,
    payment_cutoff_date: payment_cutoff_date || null,
  }).select('id').single()

  if (error || !festival) {
    console.error('Falha ao criar festival:', error)
    redirect('/festivals/new?error=Falha%20ao%20criar%20festival')
  }

  revalidatePath('/festivals')
  redirect(`/festivals/${festival.id}/edit`)
}

export async function addCategory(formData: FormData) {
  const { supabase, user } = await getAuthenticatedOrganizer()

  const festival_id = formData.get('festival_id') as string
  const name = formData.get('name') as string
  const max_duration_minutes = Number(formData.get('max_duration_minutes')) || 3
  const base_fee = Number(formData.get('base_fee')) || 0

  const { data: festival } = await supabase.from('festivals').select('organizer_id').eq('id', festival_id).single()
  if (festival?.organizer_id !== user.id) throw new Error('Não autorizado.')

  const { error } = await supabase.from('festival_categories').insert({
    festival_id,
    name,
    max_duration_seconds: Math.round(max_duration_minutes * 60),
    base_fee,
  })

  if (error) {
    console.error('Falha ao adicionar categoria:', error)
    redirect(`/festivals/${festival_id}/edit?error=Falha%20ao%20adicionar%20categoria`)
  }

  revalidatePath(`/festivals/${festival_id}/edit`)
  redirect(`/festivals/${festival_id}/edit`)
}

export async function deleteCategory(formData: FormData) {
  const { supabase, user } = await getAuthenticatedOrganizer()

  const category_id = formData.get('category_id') as string
  const festival_id = formData.get('festival_id') as string

  const { data: festival } = await supabase.from('festivals').select('organizer_id').eq('id', festival_id).single()
  if (festival?.organizer_id !== user.id) throw new Error('Não autorizado.')

  await supabase.from('festival_categories').delete().eq('id', category_id)

  revalidatePath(`/festivals/${festival_id}/edit`)
  redirect(`/festivals/${festival_id}/edit`)
}

export async function updateFestivalStatus(formData: FormData) {
  const { supabase, user } = await getAuthenticatedOrganizer()

  const festival_id = formData.get('festival_id') as string
  const status = formData.get('status') as string

  const { error } = await supabase.from('festivals')
    .update({ status })
    .eq('id', festival_id)
    .eq('organizer_id', user.id)

  if (error) redirect(`/festivals/${festival_id}/edit?error=Falha%20ao%20atualizar%20status`)

  revalidatePath('/festivals')
  revalidatePath(`/festivals/${festival_id}/edit`)
  redirect(`/festivals/${festival_id}/edit?success=Status%20atualizado!`)
}

export async function approveInscription(formData: FormData) {
  const { supabase } = await getAuthenticatedOrganizer()

  const inscription_id = formData.get('inscription_id') as string
  const festival_id = formData.get('festival_id') as string

  await supabase.from('inscriptions')
    .update({ school_status: 'approved' })
    .eq('id', inscription_id)

  revalidatePath(`/festivals/${festival_id}/inscriptions`)
  redirect(`/festivals/${festival_id}/inscriptions?success=Inscrição%20aprovada!`)
}

export async function rejectInscription(formData: FormData) {
  const { supabase } = await getAuthenticatedOrganizer()

  const inscription_id = formData.get('inscription_id') as string
  const festival_id = formData.get('festival_id') as string

  await supabase.from('inscriptions')
    .update({ school_status: 'rejected' })
    .eq('id', inscription_id)

  revalidatePath(`/festivals/${festival_id}/inscriptions`)
  redirect(`/festivals/${festival_id}/inscriptions?success=Inscrição%20rejeitada.`)
}
