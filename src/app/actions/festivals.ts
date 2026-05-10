'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FestivalStatus } from '@/types/domain'

export async function createFestival(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer') {
    throw new Error('Apenas organizadores podem criar festivais.')
  }

  const name                 = formData.get('name') as string
  const description          = formData.get('description') as string
  const start_date           = formData.get('start_date') as string
  const end_date             = formData.get('end_date') as string
  const registration_deadline = formData.get('registration_deadline') as string
  const payment_cutoff_date  = formData.get('payment_cutoff_date') as string
  const city                 = (formData.get('city') as string) || null
  const state                = (formData.get('state') as string) || null
  const venue_name           = (formData.get('venue_name') as string) || null
  const max_del              = formData.get('max_delegations') as string
  const max_delegations      = max_del ? parseInt(max_del) : null
  const categoriesJson       = formData.get('categories') as string

  const { data: festival, error: festivalError } = await supabase
    .from('festivals')
    .insert({
      organizer_id: user.id,
      name,
      description,
      start_date,
      end_date,
      registration_deadline: registration_deadline || new Date(start_date).toISOString(),
      payment_cutoff_date: payment_cutoff_date || new Date(start_date).toISOString(),
      city,
      state,
      venue_name,
      max_delegations,
      status: 'draft',
    })
    .select('id')
    .single()

  if (festivalError || !festival) {
    redirect(
      `/organizer/festivals/new?error=${encodeURIComponent(
        festivalError?.message ?? 'Falha ao criar festival'
      )}`
    )
  }

  if (categoriesJson) {
    let categories: Record<string, unknown>[] = []
    try {
      categories = JSON.parse(categoriesJson)
    } catch {
      // categories inválidas — ignora e segue sem elas
    }

    if (categories.length > 0) {
      const { error: catError } = await supabase.from('festival_categories').insert(
        categories.map((c) => ({
          festival_id: festival.id,
          name: c.name,
          modality: c.modality,
          formation: c.formation,
          min_dancers: Number(c.min_dancers) || 1,
          max_dancers: Number(c.max_dancers) || 1,
          min_age: c.min_age ? Number(c.min_age) : null,
          max_age: c.max_age ? Number(c.max_age) : null,
          max_duration_seconds: Number(c.max_duration_seconds) || 120,
          max_duration_seconds_strict: c.max_duration_seconds_strict !== false,
          base_fee: Number(c.base_fee) || 0,
          inscription_fee_per_dancer: Number(c.inscription_fee_per_dancer) || 0,
          is_competitive: c.is_competitive !== false,
        }))
      )
      if (catError) console.error('Falha ao criar categorias:', catError)
    }
  }

  revalidatePath('/organizer/festivals')
  redirect(`/organizer/festivals/${festival.id}?success=Festival+criado+com+sucesso`)
}

export async function updateFestivalStatus(festivalId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const status = formData.get('status') as FestivalStatus

  const { error } = await supabase
    .from('festivals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', festivalId)
    .eq('organizer_id', user.id)

  if (error) throw new Error('Falha ao atualizar status: ' + error.message)

  revalidatePath(`/organizer/festivals/${festivalId}`)
  revalidatePath('/organizer/festivals')
  revalidatePath('/organizer')
}
