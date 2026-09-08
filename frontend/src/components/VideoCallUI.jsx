import {
  CallControls,
  CallingState,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Loader2Icon, MessageSquareIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useSessionChat } from "../hooks/useSessionChat";
import ChatPanel from "./ChatPanel";

import "@stream-io/video-react-sdk/dist/css/styles.css";

function VideoCallUI({ sessionId, currentUser }) {
  const navigate = useNavigate();
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const {
    messages,
    sendMessage,
    typingUsers,
    sendTyping,
    isConnected,
  } = useSessionChat(sessionId, currentUser);

  if (callingState === CallingState.JOINING) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
          <p className="text-lg">Joining call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-3 relative str-video">
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Participants count badge and Chat Toggle */}
        <div className="flex items-center justify-between gap-2 bg-base-100 p-3 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">
              {participantCount} {participantCount === 1 ? "participant" : "participants"}
            </span>
          </div>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`btn btn-sm gap-2 transition-all ${
              isChatOpen ? "btn-primary shadow-md" : "btn-ghost hover:bg-base-200"
            }`}
            title={isChatOpen ? "Hide chat" : "Show chat"}
          >
            <MessageSquareIcon className="size-4" />
            <span>Chat</span>
            {messages.length > 0 && !isChatOpen && (
              <span className="badge badge-xs badge-primary animate-pulse" />
            )}
          </button>
        </div>

        {/* Video Area */}
        <div className="flex-1 bg-base-300 rounded-lg overflow-hidden relative">
          <SpeakerLayout />
        </div>

        {/* Call Controls */}
        <div className="bg-base-100 p-3 rounded-lg shadow flex justify-center">
          <CallControls onLeave={() => navigate("/dashboard")} />
        </div>
      </div>

      {/* SOCKET.IO CHAT SECTION */}
      <div
        className={`flex flex-col rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ease-in-out ${
          isChatOpen ? "w-80 opacity-100" : "w-0 opacity-0 pointer-events-none"
        }`}
      >
        {isChatOpen && (
          <ChatPanel
            messages={messages}
            sendMessage={sendMessage}
            typingUsers={typingUsers}
            sendTyping={sendTyping}
            isConnected={isConnected}
            currentUserId={currentUser?.id}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default VideoCallUI;
