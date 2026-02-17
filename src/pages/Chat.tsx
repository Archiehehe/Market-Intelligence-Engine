import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Paperclip, X, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip } from '@/components/InfoTooltip';
import ReactMarkdown from 'react-markdown';
import * as XLSX from 'xlsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  "What narratives are most fragile right now?",
  "Explain my portfolio's exposure to AI",
  "What would break the soft landing thesis?",
  "Which narratives conflict with each other?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "I'm your narrative intelligence assistant. Ask me about market beliefs, narrative conflicts, portfolio exposure, or what could break a thesis. You can also **upload a portfolio file** (CSV/XLSX) and I'll analyze its narrative exposure." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parsePortfolioFile = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let rows: string[][] = [];

          if (file.name.endsWith('.csv')) {
            const text = data as string;
            rows = text.split('\n').map(row => row.split(',').map(c => c.trim().replace(/"/g, '')));
          } else {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
          }

          // Format as readable text for AI context
          const formatted = rows
            .filter(row => row.some(cell => cell && String(cell).trim()))
            .map(row => row.join(' | '))
            .join('\n');

          resolve(`Portfolio file "${file.name}":\n${formatted}`);
        } catch {
          reject(new Error('Failed to parse portfolio file'));
        }
      };
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parsePortfolioFile(file);
      setAttachedFile({ name: file.name, data: parsed });
    } catch {
      setAttachedFile(null);
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [parsePortfolioFile]);

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;

    let userContent = input.trim();
    if (attachedFile) {
      userContent = `${userContent ? userContent + '\n\n' : ''}[Attached Portfolio]\n${attachedFile.data}`;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userContent };
    // Display message without the raw file data
    const displayContent = attachedFile
      ? `${input.trim()}${input.trim() ? '\n\n' : ''}📎 ${attachedFile.name}`
      : input.trim();
    const displayMsg: Message = { id: userMsg.id, role: 'user', content: displayContent };

    setMessages(prev => [...prev, displayMsg]);
    setInput('');
    setAttachedFile(null);
    setIsLoading(true);

    let assistantSoFar = '';
    const allMessages = [...messages.filter(m => m.id !== '1'), userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && last.id.startsWith('ai-')) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { id: 'ai-' + Date.now(), role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${e.message}. Please try again.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Intelligence
          <InfoTooltip content="Chat with AI about market narratives, portfolio exposure, and belief conflicts. Upload a CSV/XLSX portfolio file and the AI will analyze its narrative exposure." />
        </h1>
        <p className="text-muted-foreground">Explore market narratives with AI — upload portfolio files for analysis</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && <Bot className="h-8 w-8 p-1.5 rounded-full bg-primary text-primary-foreground shrink-0 mt-1" />}
                <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
                {msg.role === 'user' && <User className="h-8 w-8 p-1.5 rounded-full bg-muted shrink-0 mt-1" />}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <Bot className="h-8 w-8 p-1.5 rounded-full bg-primary text-primary-foreground shrink-0" />
                <div className="chat-bubble chat-bubble-ai flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <CardContent className="border-t pt-4 space-y-3">
          {attachedFile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm">
              <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="ml-auto shrink-0 hover:bg-accent rounded p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <Button key={s} variant="outline" size="sm" onClick={() => setInput(s)} className="text-xs">
                {s}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about narratives, beliefs, or attach a portfolio..."
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || (!input.trim() && !attachedFile)}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}