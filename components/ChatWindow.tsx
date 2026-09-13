import React from 'react'

export default function ChatWindow({messages}:{messages:any[]}){
  return (
    <div className="flex-1 p-4">
      <div className="space-y-3">
        {messages.map(m=> (
          <div key={m.id} className="p-2 bg-white dark:bg-gray-800 rounded shadow-sm max-w-xl">
            <div className="text-xs text-gray-500">{m.sender_id} • {new Date(m.created_at).toLocaleString()}</div>
            <div className="mt-1">{m.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
