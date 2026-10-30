import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Cpu,
  RotateCcw,
  ChevronRight,
  TrendingUp,
  Tag,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { api } from '../api/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isAiGenerated?: boolean;
  modelUsed?: string;
  referencedBatches?: string[];
  timestamp: string;
}

interface AssistantPageProps {
  onSelectBatchCode?: (batchCode: string) => void;
  currencySymbol?: string;
  initialQuestion?: string;
}

/**
 * Helper to render inline markdown: **bold**, *italic*, `code`
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to split by bold (**...**), inline code (`...`), or italic (*...*)
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-[#18231F]">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={i}
          className="font-mono text-[11px] px-1 py-0.5 rounded bg-[#F0F4F1] border border-[#CBD8D1] text-[#163D32] font-semibold"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return (
        <em key={i} className="italic text-[#4E8068]">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}

/**
 * Rich block parser that renders Markdown headings, bullet points, callout cards, and clean paragraphs.
 */
const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Headings (### or ##)
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^###?\s+/, '');
          return (
            <h4
              key={idx}
              className="text-xs md:text-sm font-bold text-[#163D32] tracking-tight pt-1 flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#D99A37]" />
              <span>{renderInlineMarkdown(headingText)}</span>
            </h4>
          );
        }

        // Horizontal Rule
        if (trimmed === '---') {
          return <hr key={idx} className="border-t border-[#E2E8E2] my-2" />;
        }

        // Callout blocks (💡, 🚨, ⚠️, ✅, 📋)
        if (
          trimmed.startsWith('💡') ||
          trimmed.startsWith('🚨') ||
          trimmed.startsWith('⚠️') ||
          trimmed.startsWith('✅') ||
          trimmed.startsWith('📋')
        ) {
          const isWarning = trimmed.startsWith('🚨') || trimmed.startsWith('⚠️');
          const isSuccess = trimmed.startsWith('✅');
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs md:text-sm leading-relaxed ${
                isWarning
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : isSuccess
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-[#F0F4F1] border-[#CBD8D1] text-[#163D32]'
              }`}
            >
              <div className="whitespace-pre-line">{renderInlineMarkdown(trimmed)}</div>
            </div>
          );
        }

        // Bullet list (lines starting with •, -, or *)
        const lines = trimmed.split('\n');
        const isBulletList = lines.every((line) => /^\s*([•\-\*]|\d+\.)\s+/.test(line));

        if (isBulletList) {
          return (
            <ul key={idx} className="space-y-1.5 pl-1 text-xs md:text-sm">
              {lines.map((line, lIdx) => {
                const isSubItem = /^\s{2,}/.test(line);
                const cleaned = line.replace(/^\s*([•\-\*]|\d+\.)\s+/, '');
                return (
                  <li
                    key={lIdx}
                    className={`flex items-start gap-2 ${
                      isSubItem ? 'ml-4 text-xs text-[#4E8068]' : 'text-[#18231F]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#163D32] mt-1.5 shrink-0" />
                    <span className="flex-1">{renderInlineMarkdown(cleaned)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-xs md:text-sm leading-relaxed whitespace-pre-line text-[#18231F]">
            {renderInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const AssistantPage: React.FC<AssistantPageProps> = ({
  onSelectBatchCode,
  currencySymbol = '₹',
  initialQuestion
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `Hello! 👋 I am your **ShelfSense AI Assistant**, powered by Gemini and our Retail Intelligence Engine.

I act as your store co-pilot to help you:
• **Track at-risk batches** nearing operational cutoff dates
• **Optimize dynamic markdowns** while strictly protecting your margin floor
• **Simulate FEFO demand** to forecast actual sell-through vs. waste
• **Answer retail operations questions** like FEFO vs. FIFO or waste reduction

Feel free to ask me about today's urgent batches, a specific product (like *milk* or *bread*), or retail best practices!`,
      isAiGenerated: true,
      modelUsed: 'gemini-3.8-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuestion, setInputQuestion] = useState(initialQuestion || '');
  const [isSending, setIsSending] = useState(false);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'Which batches need my attention today?',
    'What markdowns should I apply today?',
    'Why is the milk batch at risk?',
    'Explain the potential loss exposure for this week',
    'How can I reduce food waste in my grocery store?',
    'Explain the difference between FIFO and FEFO'
  ];

  useEffect(() => {
    api.getAiStatus().then(setAiStatus).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        role: 'assistant',
        content: `Chat cleared! How can I assist you with your store inventory or retail operations?`,
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isSending) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsSending(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.sendAiChat(q, history);

      const assistantMsg: Message = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        isAiGenerated: res.isAiGenerated,
        modelUsed: res.modelUsed,
        referencedBatches: res.referencedBatches,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ast_err_${Date.now()}`,
          role: 'assistant',
          content: `Unable to complete query: ${err.message || 'Service temporarily unavailable'}. Please verify connection or try asking again.`,
          isAiGenerated: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Top Banner with Model Status */}
      <div className="bg-white border border-[#E2E8E2] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#163D32] flex items-center justify-center text-[#D99A37] shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-[#18231F]">
                ShelfSense AI Co-Pilot
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-[#6B8579] mt-0.5">
              Conversational intelligence grounded in real-time inventory and FEFO demand forecasts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <button
            onClick={handleClearChat}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#6B8579] hover:text-[#18231F] hover:bg-[#F0F4F1] border border-[#E2E8E2] rounded-lg transition-colors"
            title="Start new conversation"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white border border-[#E2E8E2] rounded-xl p-4 md:p-6 shadow-xs overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-[#163D32] flex items-center justify-center text-[#D99A37] shrink-0 mt-0.5 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#163D32] text-white rounded-br-xs'
                    : 'bg-[#F7F8F4] text-[#18231F] border border-[#E2E8E2] rounded-bl-xs shadow-2xs'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between text-[10px] text-[#6B8579] mb-2 pb-1.5 border-b border-[#EAEFEA]">
                    <span className="font-semibold text-[#163D32] flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#D99A37]" />
                      <span>ShelfSense AI</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#E2E8E2] text-[#4E8068] font-mono">
                        {msg.modelUsed || 'Gemini 3.8 Flash'}
                      </span>
                    </span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>
                )}

                {/* Body Content */}
                {isUser ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <FormattedMessage content={msg.content} />
                )}

                {/* Clickable Referenced Batch Badges */}
                {msg.referencedBatches && msg.referencedBatches.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#EAEFEA] flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#6B8579] flex items-center gap-1">
                      <Tag className="w-3 h-3 text-[#163D32]" />
                      <span>Referenced Batches:</span>
                    </span>
                    {msg.referencedBatches.map((code) => (
                      <button
                        key={code}
                        onClick={() => onSelectBatchCode && onSelectBatchCode(code)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-[#163D32] border border-[#CBD8D1] hover:bg-[#F0F4F1] font-mono text-[11px] font-semibold transition-colors shadow-2xs"
                      >
                        <span>{code}</span>
                        <ChevronRight className="w-3 h-3 text-[#4E8068]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-[#F0F4F1] border border-[#CBD8D1] flex items-center justify-center text-[#163D32] shrink-0 mt-0.5 font-bold text-xs">
                  ME
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-[#163D32] flex items-center justify-center text-[#D99A37] shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#F7F8F4] border border-[#E2E8E2] rounded-2xl rounded-bl-xs p-4 text-xs text-[#6B8579] flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#163D32] animate-bounce" />
              <span className="inline-block w-2 h-2 rounded-full bg-[#163D32] animate-bounce [animation-delay:0.2s]" />
              <span className="inline-block w-2 h-2 rounded-full bg-[#163D32] animate-bounce [animation-delay:0.4s]" />
              <span className="ml-2 font-medium text-[#163D32]">
                ShelfSense AI is thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto py-1 px-1 text-xs">
        <span className="text-[#6B8579] font-medium text-[11px] whitespace-nowrap mr-1 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-[#D99A37]" />
          <span>Quick queries:</span>
        </span>
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isSending}
            className="px-2.5 py-1 bg-white hover:bg-[#F0F4F1] text-[#163D32] border border-[#CBD8D1] rounded-full whitespace-nowrap text-xs transition-colors shrink-0 disabled:opacity-50 shadow-2xs font-medium cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-white border border-[#E2E8E2] rounded-xl p-2 shadow-xs flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask ShelfSense AI anything (e.g. 'What markdowns should I apply?', 'How to prevent dairy waste?')..."
          className="flex-1 px-3 py-2 text-xs md:text-sm focus:outline-hidden text-[#18231F]"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !inputQuestion.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#163D32] hover:bg-[#205244] rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5 text-[#D99A37]" />
        </button>
      </form>
    </div>
  );
};
