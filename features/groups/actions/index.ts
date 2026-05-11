'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function createGroup(formData: FormData) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const imageFile = formData.get('image') as File | null
  const invite_code = generateInviteCode()

  let image_url: string | null = null
  if (imageFile && imageFile.size > 0) {
    const uploadClient = createServiceClient()
    const ext = imageFile.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`
    const arrayBuffer = await imageFile.arrayBuffer()
    const { error: uploadError } = await uploadClient.storage
      .from('groups')
      .upload(path, arrayBuffer, { contentType: imageFile.type, upsert: true })
    if (!uploadError) {
      const { data } = uploadClient.storage.from('groups').getPublicUrl(path)
      image_url = data.publicUrl
    }
  }

  const supabase = createServiceClient()
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name, owner_id: user.id, invite_code, description: description || null, image_url })
    .select()
    .single()

  if (groupError || !group) return

  await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id })

  revalidatePath('/grupo')
  redirect(`/grupo?group=${group.id}&created=true`)
}

export async function joinGroup(formData: FormData) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return

  const code = (formData.get('code') as string).toUpperCase()

  const supabase = createServiceClient()
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', code)
    .maybeSingle()

  if (groupError || !group) return

  const { data: existing } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id })
  }

  revalidatePath('/grupo')
  redirect(`/grupo?group=${group.id}&joined=true`)
}
