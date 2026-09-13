import { useState } from 'react'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'form'|'otp'|'done'>('form')
  const [message, setMessage] = useState('')
  const [code, setCode] = useState('')

  async function requestOtp(e:any){
    e.preventDefault()
    setMessage('')
    const res = await fetch('/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if(res.ok) setStep('otp')
    setMessage(data.message || 'Check your email for the OTP code.')
  }

  async function verifyOtp(e:any){
    e.preventDefault()
    setMessage('')
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password })
    })
    const data = await res.json()
    if(res.ok) setStep('done')
    setMessage(data.message || 'Verified')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">تسجيل في تواصل — Tawasal Sign up</h2>

        {step === 'form' && (
          <form onSubmit={requestOtp}>
            <label className="block text-sm">البريد الإلكتروني / Email</label>
            <input required value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2 border rounded mt-1" />
            <label className="block text-sm mt-3">كلمة المرور / Password</label>
            <input required value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full px-3 py-2 border rounded mt-1" />
            <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded">Request OTP</button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOtp}>
            <label className="block text-sm">Enter 6-digit OTP</label>
            <input required value={code} onChange={e=>setCode(e.target.value)} className="w-full px-3 py-2 border rounded mt-1" />
            <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded">Verify OTP</button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-green-600">Account created. Proceed to Profile setup.</div>
        )}

        {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  )
}
