// Basic Socket.IO server scaffold
// Run: node server/index.js

const http = require('http')
const { Server } = require('socket.io')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = SUPABASE_SERVICE_KEY && SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null

const server = http.createServer()
const io = new Server(server, { cors: { origin: '*' } })

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token
  if(!token){
    return next()
  }
  if(!supabaseAdmin) return next(new Error('Supabase not configured'))
  try{
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if(error) return next(new Error('Invalid token'))
    socket.user = data?.user || null
    next()
  }catch(err){
    next(new Error('Auth error'))
  }
})

io.on('connection', (socket) => {
  console.log('client connected', socket.id)

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv:${conversationId}`)
  })

  socket.on('send_message', async (payload) => {
    io.to(`conv:${payload.conversation_id}`).emit('message', payload)
  })

  socket.on('disconnect', () => {
    console.log('client disconnected', socket.id)
  })
})

const PORT = process.env.SOCKET_PORT || 4000
server.listen(PORT, () => console.log(`Socket server listening on ${PORT}`))
