import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { DataService } from "@/services/data-service";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import SubjectIcon from "./SubjectIcon";
import { Send, ArrowLeft, Paperclip, Bot } from "lucide-react";
import type { Subject, ChatMessage } from "@/lib/openai";

interface ChatInterfaceProps {
  subject: Subject;
  user: any;
  sessionId: number;
  onBack: () => void;
}

const mathJaxConfig = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
  },
};

export default function ChatInterface({ subject, user, sessionId, onBack }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-messages", sessionId],
    queryFn: () => DataService.getChatMessages(sessionId),
    select: (data) => data.messages || [],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const tempMessage: ChatMessage = {
        id: Date.now(),
        sessionId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      // Optimistically add user message
      queryClient.setQueryData(["chat-messages", sessionId], (old: ChatMessage[] = []) => [...old, tempMessage]);
      setIsTyping(true);

      const response = await DataService.sendChatMessage({
        sessionId,
        content,
        userId: user.id,
        subjectId: subject.id,
      });
      console.log("Chat response:", response);

      return response;
    },
    onSuccess: (data) => {
      // Add AI response to messages
      if (data.message) {
        queryClient.setQueryData(["chat-messages", sessionId], (old: ChatMessage[] = []) => [...old, data.message]);
      }
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        title: "Lỗi gửi tin nhắn",
        description: "Vui lòng thử lại",
        variant: "destructive",
      });
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ["chat-messages", sessionId] });
    },
  });

  const handleSend = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    const messageToSend = message;
    setMessage("");
    sendMessageMutation.mutate(messageToSend);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className={`bg-gradient-to-br ${subject.color} p-2 rounded-xl`}>
                  <SubjectIcon iconName={subject.icon} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{subject.name}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI Trợ giảng</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {isLoading ? (
              <div className="text-center text-gray-500">Đang tải...</div>
            ) : messages.length === 0 ? (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">Xin chào! Tôi là AI trợ giảng {subject.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Hãy hỏi tôi bất cứ điều gì về {subject.name}. Tôi sẽ giải thích một cách dễ hiểu nhất!
                  </p>
                </CardContent>
              </Card>
            ) : (
              messages.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    } rounded-2xl px-4 py-3 shadow-sm`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                            <Bot className="w-4 h-4 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Trợ giảng</span>
                      </div>
                    )}
                    <div className={msg.role === 'user' ? 'text-white' : 'text-gray-800 dark:text-gray-200'}>
                      <MathJax>{msg.content}</MathJax>
                    </div>
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                        <Bot className="w-4 h-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI đang soạn...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="mb-1"
                disabled
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Hỏi về ${subject.name}...`}
                  className="resize-none"
                  rows={1}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="mb-1"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MathJaxContext>
  );
}