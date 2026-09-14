import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import MessageBubble from '../../components/MessageBubble'
import Composer from '../../components/Composer'

export default function ChatPage(){
  const router = useRouter()
  const { id } = router.query
  const [messages, setMessages] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<any|null>(null)
  const [selected, setSelected] = useState<Record<string,boolean>>({})
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

  async function handleSend(text:string){
    if(!text.trim() || !id) return
    const payload = { sender_id: 'dev-profile', content: text }
    const res = await fetch(`/api/conversations/${id}/messages`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    if(res.ok){
      if(data.message) setMessages(prev=>[...prev, data.message])
    } else {
      alert(data.message || 'Failed to send')
    }
  }

  async function handleEdit(id:string, newText:string){
    const res = await fetch(`/api/messages/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ content: newText }) })
    const data = await res.json()
    if(res.ok){
      setMessages(prev=>prev.map(m=> m.id === id ? data.message : m))
      setEditingId(null)
    } else alert(data.message || 'Edit failed')
  }

  async function handleDelete(id:string){
    if(!confirm('Delete this message?')) return
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if(res.ok){
      setMessages(prev=>prev.filter(m=> m.id !== id))
    } else alert(data.message || 'Delete failed')
  }

  function toggleSelect(mid:string){
    setSelected(prev => ({ ...prev, [mid]: !prev[mid] }))
  }

  function onReply(mid:string){
    const m = messages.find(x=>x.id===mid)
    setReplyTo(m)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b bg-white dark:bg-gray-800">
        <h2 className="text-lg">Chat</h2>
      </header>
      <main className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
        <div className="space-y-3">
          {messages.map(m=> (
            <div key={m.id} className="flex items-start gap-2">
              <input type="checkbox" checked={!!selected[m.id]} onChange={()=>toggleSelect(m.id)} />
              <div className="flex-1">
                <MessageBubble message={m} isOwn={m.sender_id==='dev-profile'} onEdit={(id)=>setEditingId(id)} onDelete={(id)=>handleDelete(id)} onReply={(id)=>onReply(id)} />
                {editingId === m.id && (
                  <EditInline id={m.id} current={m.content} onSave={handleEdit} onCancel={()=>setEditingId(null)} />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesRef} />
        </div>
      </main>
      <div className="p-4 border-t bg-white dark:bg-gray-800">
        {replyTo && (
          <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">Replying to: <strong>{replyTo.content}</strong> <button onClick={()=>setReplyTo(null)} className="ml-2 underline">Cancel</button></div>
        )}
        <Composer onSend={handleSend} />
      </div>
    </div>
  )
}

function EditInline({ id, current, onSave, onCancel }:{ id:string, current:string, onSave:(id:string, text:string)=>Promise<void>, onCancel:()=>void }){
  const [value, setValue] = useState(current)
  return (
    <div className="p-2 mt-2 bg-gray-50 rounded">
      <textarea value={value} onChange={e=>setValue(e.target.value)} className="w-full p-2 border rounded" />
      <div className="mt-2 flex gap-2">
        <button onClick={()=>onSave(id, value)} className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
        <button onClick={onCancel} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
      </div>
    </div>
  )
}
