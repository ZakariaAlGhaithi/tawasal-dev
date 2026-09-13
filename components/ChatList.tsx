import React from 'react'
import Link from 'next/link'

export default function ChatList({conversations}:{conversations:any[]}){
  return (
    <aside className="w-80 border-r bg-white dark:bg-gray-800">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Chats</h3>
      </div>
      <div className="p-2 space-y-2">
        {conversations.map((c:any)=> (
          <Link key={c.id} href={`/chat/${c.id}`}>
            <a className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <div className="font-medium">{c.title || 'Direct chat'}</div>
              <div className="text-sm text-gray-500">{c.last_message}</div>
            </a>
          </Link>
        ))}
      </div>
    </aside>
  )
}
