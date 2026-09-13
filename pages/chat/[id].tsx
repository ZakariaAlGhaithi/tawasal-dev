import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'

export default function ChatPage(){
  const router = useRouter()
  const { id } = router.query
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const messagesRef = useRef<HTMLDivElement|null>(null)

  useEffect(()=>{
    if(!id) return
    // fetch recent messages
    fetch(`/api/conversations/${id}/messages?limit=50`).then(r=>r.json()).then(data=>{
      if(data.messages) setMessages(data.messages.reverse())
    }).catch(console.error)

    // realtime via supabase client (client-side)
    const channel = supabase.channel(`public:messages:conversation_id=eq.${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, payload => {
        setMessages(prev => [...prev, payload.new])
      }).subscribe()

    return ()=>{
      channel.unsubscribe()
    }
  }, [id])

  function scrollToBottom(){
    messagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  useEffect(()=>{ scrollToBottom() }, [messages])

  async function sendMessage(e:any){
    e.preventDefault()
    if(!text.trim() || !id) return
    // Client-side simple POST to API
    const res = await fetch(`/api/conversations/${id}/messages`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ sender_id: 'dev-profile', content: text }) })
    const data = await res.json()
    if(res.ok){
      setText('')
      // optimistic update if response contains message
      if(data.message) setMessages(prev=>[...prev, data.message])
    } else {
      alert(data.message || 'Failed to send')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b bg-white dark:bg-gray-800">
        <h2 className="text-lg">Chat</h2>
      </header>
      <main className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
        <div className="space-y-3">
          {messages.map(m=> (
            <div key={m.id} className="p-2 bg-white dark:bg-gray-800 rounded shadow-sm max-w-xl">
              <div className="text-xs text-gray-500">{m.sender_id} • {new Date(m.created_at).toLocaleString()}</div>
              <div className="mt-1">{m.content}</div>
            </div>
          ))}
          <div ref={messagesRef} />
        </div>
      </main>
      <form onSubmit={sendMessage} className="p-4 border-t bg-white dark:bg-gray-800 flex">
        <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 px-3 py-2 border rounded" placeholder="Type a message" />
        <button className="ml-2 px-4 py-2 bg-green-600 text-white rounded">Send</button>
      </form>
    </div>
  )
}
