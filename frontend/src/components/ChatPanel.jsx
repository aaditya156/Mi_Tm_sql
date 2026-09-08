import { useState, useRef, useEffect } from "react";
import { SendIcon, XIcon, MessageSquareIcon } from "lucide-react";
import { format } from "date-fns";

export default function ChatPanel({
  messages,
  sendMessage,
  typingUsers,
  sendTyping,
  isConnected,
  currentUserId,
  onClose,
}) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive or when typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setInputText(e.target.value);
    sendTyping();
  };

  return (
    <div className="flex flex-col h-full bg-base-200 border-l border-base-300 shadow-xl select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-base-300/80 border-b border-base-content/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <MessageSquareIcon className="size-4 text-primary" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-base-300 ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-warning"
              }`}
              title={isConnected ? "Connected to chat server" : "Connecting..."}
            />
          </div>
          <span className="font-semibold text-sm text-base-content">Live Chat</span>
        </div>

        <button
          onClick={onClose}
          className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content"
          title="Close chat"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {/* MESSAGES LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-base-content/10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-base-content/50 gap-2 px-4">
            <div className="w-12 h-12 rounded-2xl bg-base-300/60 flex items-center justify-center text-primary mb-1">
              <MessageSquareIcon className="size-6 opacity-70" />
            </div>
            <p className="font-medium text-sm text-base-content/80">No messages yet</p>
            <p className="text-xs max-w-[180px]">
              Chat with your interviewer or participant in real-time.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?.id === currentUserId;
            const timeStr = msg.createdAt ? format(new Date(msg.createdAt), "h:mm a") : "";

            return (
              <div
                key={msg.id}
                className={`chat ${isMe ? "chat-end" : "chat-start"} transition-all duration-200`}
              >
                {!isMe && (
                  <div className="chat-image avatar">
                    <div className="w-7 h-7 rounded-full bg-base-300 ring-1 ring-base-content/10 overflow-hidden">
                      {msg.sender?.image ? (
                        <img src={msg.sender.image} alt={msg.sender.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs text-primary">
                          {msg.sender?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="chat-header text-[11px] opacity-60 mb-0.5 flex items-center gap-1.5">
                  <span className="font-medium">{isMe ? "You" : msg.sender?.name}</span>
                  {timeStr && <time className="text-[10px]">{timeStr}</time>}
                </div>

                <div
                  className={`chat-bubble text-sm break-words py-2 px-3.5 shadow-sm ${
                    isMe
                      ? "bg-primary text-primary-content font-medium rounded-2xl rounded-tr-sm"
                      : "bg-base-300 text-base-content rounded-2xl rounded-tl-sm border border-base-content/5"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}

        {/* TYPING INDICATOR */}
        {typingUsers.length > 0 && (
          <div className="chat chat-start">
            <div className="chat-bubble bg-base-300/70 text-base-content/70 text-xs py-1.5 px-3 flex items-center gap-1.5">
              <span className="inline-flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.4s]" />
              </span>
              <span className="italic text-[11px]">
                {typingUsers.map((u) => u.name).join(", ")}{" "}
                {typingUsers.length === 1 ? "is" : "are"} typing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-base-300/40 border-t border-base-content/10 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={!isConnected}
          className="input input-sm flex-1 bg-base-100/90 border border-base-content/15 rounded-lg text-sm focus:outline-none focus:border-primary transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || !isConnected}
          className="btn btn-sm btn-primary btn-square shadow-sm hover:scale-105 active:scale-95 transition-transform"
          title="Send message"
        >
          <SendIcon className="size-4" />
        </button>
      </form>
    </div>
  );
}
