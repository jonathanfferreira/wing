'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function enrollChoreography(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('director_id', user.id)
    .single()
  if (!school) redirect('/school?error=Escola%20não%20encontrada')

  const festival_id = formData.get('festival_id') as string
  const name        = formData.get('name') as string
  const category_id = formData.get('category_id') as string
  const music_url   = formData.get('music_url') as string

  // Valida que a categoria pertence a este festival
  const { data: category } = await supabase
    .from('festival_categories')
    .select('id, max_duration_seconds')
    .eq('id', category_id)
    .eq('festival_id', festival_id)
    .single()
  if (!category) redirect(`/school/enroll/${festival_id}?error=Categoria%20inválida`)

  // Garante que existe uma delegação ativa da escola neste festival
  const { data: existingDelegation } = await supabase
    .from('delegations')
    .select('id')
    .eq('festival_id', festival_id)
    .eq('school_id', school.id)
    .single()

  let delegation_id: string

  if (existingDelegation) {
    delegation_id = existingDelegation.id
  } else {
    const { data: newDelegation, error: delError } = await supabase
      .from('delegations')
      .insert({
        festival_id,
        school_id: school.id,
        director_id: user.id,
        status: 'draft',
      })
      .select('id')
      .single()

    if (delError || !newDelegation) {
      redirect(`/school/enroll/${festival_id}?error=Falha%20ao%20criar%20delegação`)
    }
    delegation_id = newDelegation.id
  }

  // Cria a coreografia vinculada à delegação
  const { error: choreoError } = await supabase.from('choreographies').insert({
    delegation_id,
    category_id,
    name,
    audio_url: music_url || null,
    audio_duration_seconds: category.max_duration_seconds,
    status: 'pending_audio',
  })

  if (choreoError) {
    console.error(choreoError)
    redirect(`/school/enroll/${festival_id}?error=Falha%20ao%20cadastrar%20coreografia`)
  }

  revalidatePath('/school')
  redirect('/school?success=Coreografia%20inscrita%20com%20sucesso!')
}

export async function confirmInscription(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('director_id', user.id)
    .single()
  if (!school) redirect('/school')

  const inscription_id = formData.get('inscription_id') as string

  // Verifica que esta inscrição pertence à escola via choreography → delegation → school
  const { data: ins } = await supabase
    .from('inscriptions')
    .select(`id, choreographies!inner( delegations!inner( school_id ) )`)
    .eq('id', inscription_id)
    .single()

  const schoolId = (ins?.choreographies as any)?.delegations?.school_id
  if (!ins || schoolId !== school.id) {
    redirect('/school?error=Inscrição%20não%20encontrada')
  }

  await supabase
    .from('inscriptions')
    .update({ school_status: 'approved' })
    .eq('id', inscription_id)

  revalidatePath('/school')
  redirect('/school?success=Inscrição%20confirmada%20e%20enviada%20para%20análise!')
}
