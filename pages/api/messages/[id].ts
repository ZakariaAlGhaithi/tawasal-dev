import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = SUPABASE_SERVICE_KEY && SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query
  if(!id) return res.status(400).json({ message: 'Missing message id' })

  if(req.method === 'PATCH'){
    const { content, edited } = req.body
    if(!content) return res.status(400).json({ message: 'Missing content' })
    if(!supabaseAdmin) return res.status(501).json({ message: 'Supabase service key not configured. Cannot edit message in dev-only mode.' })
    try{
      const { data, error } = await supabaseAdmin.from('messages').update({ content, edited: true, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
      if(error) return res.status(500).json({ message: 'Failed to update message', details: error })
      return res.status(200).json({ message: data })
    }catch(err:any){
      console.error(err)
      return res.status(500).json({ message: 'Error updating message', details: err.message || err })
    }
  }

  if(req.method === 'DELETE'){
    if(!supabaseAdmin) return res.status(501).json({ message: 'Supabase service key not configured. Cannot delete message in dev-only mode.' })
    try{
      const { data, error } = await supabaseAdmin.from('messages').delete().eq('id', id).select('*').single()
      if(error) return res.status(500).json({ message: 'Failed to delete message', details: error })
      return res.status(200).json({ message: data })
    }catch(err:any){
      console.error(err)
      return res.status(500).json({ message: 'Error deleting message', details: err.message || err })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
