export type Profile = {
  id: string
  auth_id?: string
  email: string
  username?: string
  tawasal_id?: string
  display_name?: string
  avatar_url?: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type?: string
  created_at: string
}
