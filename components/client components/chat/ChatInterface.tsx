"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

interface Message {
  id: string
  text: string
  sender: "client" | "support"
  timestamp: Date
  attachmentUrl?: string
  attachmentName?: string
  isLoading?: boolean
}

interface ChatInterfaceProps {
  clientName: string
  clientAvatar: string
}

export default function ChatInterface({ clientName, clientAvatar }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! How can we help you today?",
      sender: "support",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
      id: "2",
      text: "I have a question about my project timeline.",
      sender: "client",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23), // 23 hours ago
    },
    {
      id: "3",
      text: "Of course! I'd be happy to help with that. Could you please specify which project you're referring to?",
      sender: "support",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22), // 22 hours ago
    },
  ])

  const [newMessage, setNewMessage] = useState("")
  const [isAttaching, setIsAttaching] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() && !isAttaching) return

    // Add client message
    const clientMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: "client",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, clientMessage])
    setNewMessage("")
    setIsSending(true)

    // Simulate support response after delay
    setTimeout(() => {
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your message. Our team will get back to you shortly.",
        sender: "support",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, supportMessage])
      setIsSending(false)
    }, 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsAttaching(true)

    // Simulate file upload
    setTimeout(() => {
      const attachmentMessage: Message = {
        id: Date.now().toString(),
        text: "I've attached a file for reference.",
        sender: "client",
        timestamp: new Date(),
        attachmentUrl: URL.createObjectURL(file),
        attachmentName: file.name,
      }

      setMessages((prev) => [...prev, attachmentMessage])
      setIsAttaching(false)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }, 1500)
  }

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg flex items-center">
          <div className="bg-primary/10 p-2 rounded-full mr-2">
            <User className="h-5 w-5 text-primary" />
          </div>
          Support Chat
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "client" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex ${message.sender === "client" ? "flex-row-reverse" : "flex-row"} items-start gap-2 max-w-[80%]`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={message.sender === "client" ? clientAvatar : "/placeholder.svg?height=40&width=40"}
                    alt={message.sender === "client" ? clientName : "Support"}
                  />
                  <AvatarFallback>{message.sender === "client" ? clientName[0] : "S"}</AvatarFallback>
                </Avatar>

                <div>
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      message.sender === "client" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>

                    {message.attachmentUrl && (
                      <div className="mt-2 p-2 bg-background/20 rounded flex items-center gap-2">
                        <Paperclip className="h-3 w-3" />
                        <a
                          href={message.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline truncate max-w-[200px]"
                        >
                          {message.attachmentName}
                        </a>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">{format(message.timestamp, "h:mm a")}</p>
                </div>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2 max-w-[80%]">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Support" />
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>

                <div className="px-3 py-2 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm">Support is typing...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <CardContent className="p-4 border-t mt-auto">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            type="button"
            disabled={isAttaching}
            onClick={() => fileInputRef.current?.click()}
          >
            {isAttaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>

          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-10 resize-none"
          />

          <Button
            type="button"
            size="icon"
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !isAttaching) || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

