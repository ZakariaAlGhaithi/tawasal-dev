import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = SUPABASE_SERVICE_KEY && SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id) return res.status(400).json({ message: 'Missing conversation id' })

  if (req.method === 'GET') {
    // pagination: ?limit=50&before=
    const limit = Number(req.query.limit || 50)
    const before = req.query.before
    if (!supabaseAdmin) return res.status(501).json({ message: 'Supabase service key not configured. Cannot fetch messages in dev-only mode.' })
    try {
      const q = supabaseAdmin.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: false }).limit(limit)
      if (before) q.lt('created_at', before as string)
      const { data } = await q
      return res.status(200).json({ messages: data })
    } catch (err:any) {
      console.error(err)
      return res.status(500).json({ message: 'Failed to fetch messages', details: err.message || err })
    }
  }

  if (req.method === 'POST') {
    const { sender_id, content, message_type = 'text', media_meta = null } = req.body
    if (!sender_id || !content) return res.status(400).json({ message: 'Missing sender_id or content' })
    if (!supabaseAdmin) return res.status(501).json({ message: 'Supabase service key not configured. Cannot create message in dev-only mode.' })
    try {
      const { data } = await supabaseAdmin.from('messages').insert([{ conversation_id: id, sender_id, content, message_type, media_meta }]).select('*').single()
      return res.status(201).json({ message: data })
    } catch (err:any) {
      console.error(err)
      return res.status(500).json({ message: 'Failed to create message', details: err.message || err })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
