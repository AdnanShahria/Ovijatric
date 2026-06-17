import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi there! Ready for your next adventure? Ask me anything about Ovijatrik!' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Keep only last 10 messages for context
      const history = messages.slice(-10)
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history })
      })

      const data = await res.json()
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Oops! Looks like my map got a bit soggy. Could you try asking again?" }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection lost in the wilderness! Please try again later." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 p-4 rounded-full bg-adventure-orange text-white shadow-lg shadow-adventure-orange/30 hover:bg-orange-600 transition-colors z-50 flex items-center justify-center"
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] max-h-[80vh] flex flex-col glass-panel bg-slate-900/95 rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-adventure-green border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageCircle size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Club Assistant</h3>
                  <p className="text-xs text-slate-300">Powered by Llama 3.3</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "bg-adventure-orange text-white ml-auto rounded-br-none" 
                      : "bg-slate-800 text-slate-200 mr-auto rounded-bl-none"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="bg-slate-800 text-slate-400 mr-auto rounded-2xl rounded-bl-none p-3 max-w-[85%]">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-900 border-t border-white/10">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about our next trek..."
                  className="w-full bg-slate-800 text-white rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-adventure-orange/50 border border-slate-700"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 bg-adventure-orange hover:bg-orange-600 disabled:bg-slate-700 text-white rounded-full transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
