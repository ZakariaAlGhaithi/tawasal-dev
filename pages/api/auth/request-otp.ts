import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = SUPABASE_SERVICE_KEY && SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null

function generateCode(){
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  const { email, password } = req.body
  if(!email || !password) return res.status(400).json({ message: 'Missing email or password' })
  if(!supabaseAdmin) return res.status(200).json({ message: 'OTP requested (dev mode) - configure SUPABASE_SERVICE_ROLE_KEY to enable real OTP storage' })

  const code = generateCode()
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

  // insert into otps table
  const { error } = await supabaseAdmin.from('otps').insert([{ email, code, expires_at, attempts: 0, used: false }])
  if(error) return res.status(500).json({ message: 'Failed to store OTP', details: error })

  // send email if SMTP configured
  const smtpHost = process.env.SMTP_HOST
  if(smtpHost){
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    const from = process.env.EMAIL_FROM || 'no-reply@tawasal.app'
    try{
      await transporter.sendMail({ from, to: email, subject: 'Your Tawasal verification code', text: `Your Tawasal verification code is ${code}. It expires in 10 minutes.` })
    }catch(err){
      console.error('SMTP send failed', err)
      console.log(`OTP for ${email}: ${code}`)
    }
  }else{
    // dev fallback
    console.log(`OTP for ${email}: ${code}`)
  }

  return res.status(200).json({ message: 'OTP processing done (check logs in dev or configure SUPABASE_SERVICE_ROLE_KEY + SMTP for production).' })
}
