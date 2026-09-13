import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = SUPABASE_SERVICE_KEY && SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  const { initiator_auth_id, target_tawasal_id, is_group, title } = req.body
  if (!initiator_auth_id || !target_tawasal_id) return res.status(400).json({ message: 'Missing parameters' })
  if (!supabaseAdmin) return res.status(501).json({ message: 'Supabase service key not configured. Cannot create conversation in dev-only mode.' })

  try {
    // find target profile
    const { data: targetProfile } = await supabaseAdmin.from('profiles').select('*').eq('tawasal_id', target_tawasal_id).maybeSingle()
    if (!targetProfile) return res.status(404).json({ message: 'Target not found' })

    // create or find existing 1:1 conversation between initiator and target
    // Simple logic: search for conversation with exactly these two members and is_group = false
    const { data: existing } = await supabaseAdmin.rpc('find_or_create_direct_conversation', { user1_auth_id: initiator_auth_id, user2_auth_id: targetProfile.auth_id })

    if (existing && existing.length) {
      return res.status(200).json({ conversation: existing[0] })
    }

    // fallback create manually
    const { data: conv } = await supabaseAdmin.from('conversations').insert([{ is_group: false, title: null }]).select('*').single()
    await supabaseAdmin.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: (await getProfileIdByAuth(supabaseAdmin, initiator_auth_id)) },
      { conversation_id: conv.id, user_id: targetProfile.id }
    ])

    return res.status(201).json({ conversation: conv })
  } catch (err:any) {
    console.error(err)
    return res.status(500).json({ message: 'Failed to create conversation', details: err.message || err })
  }
}

async function getProfileIdByAuth(supabaseAdmin:any, auth_id:string){
  const { data } = await supabaseAdmin.from('profiles').select('id').eq('auth_id', auth_id).maybeSingle()
  return data?.id
}
