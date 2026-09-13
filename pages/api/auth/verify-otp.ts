import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = SUPABASE_SERVICE_KEY && SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  const { email, code, password } = req.body
  if(!email || !code) return res.status(400).json({ message: 'Missing email or code' })
  if(!supabaseAdmin) return res.status(200).json({ message: 'Dev mode: OTP verification simulated. Set SUPABASE_SERVICE_ROLE_KEY for real verification.' })

  // fetch OTP
  const { data, error } = await supabaseAdmin.from('otps').select('*').eq('email', email).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if(error) return res.status(500).json({ message: 'Failed to query OTP', details: error })
  if(!data) return res.status(400).json({ message: 'OTP not found. Request a new code.' })
  if(data.used) return res.status(400).json({ message: 'OTP already used. Request a new code.' })
  if(new Date(data.expires_at) < new Date()) return res.status(400).json({ message: 'OTP expired. Request a new code.' })
  if(data.attempts >= 5) return res.status(400).json({ message: 'Maximum verification attempts exceeded.' })

  if(data.code !== code) {
    // increment attempts
    await supabaseAdmin.from('otps').update({ attempts: data.attempts + 1 }).eq('id', data.id)
    return res.status(400).json({ message: 'Invalid code' })
  }

  // mark used
  await supabaseAdmin.from('otps').update({ used: true }).eq('id', data.id)

  // create user in Supabase Auth
  try{
    const pw = password || (Math.random() + '').slice(2,10) // password should have been passed earlier; client must preserve
    const createUser = await supabaseAdmin.auth.admin.createUser({ email, password: pw, email_confirm: true })
    if(createUser.error) return res.status(500).json({ message: 'Failed to create user', details: createUser.error })

    const authId = createUser.data?.user?.id || createUser.data?.id

    // create profile row
    const displayName = email.split('@')[0]
    await supabaseAdmin.from('profiles').insert([{ auth_id: authId, email, display_name: displayName }])

    return res.status(200).json({ message: 'User created successfully' })
  }catch(err:any){
    console.error('create user error', err)
    return res.status(500).json({ message: 'Failed to create user', details: err.message || err })
  }
}
