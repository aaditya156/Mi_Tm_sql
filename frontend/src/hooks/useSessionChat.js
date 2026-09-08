import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "../lib/socket";

export function useSessionChat(sessionId, currentUser) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef(null);

  const socket = getSocket();

  useEffect(() => {
    if (!sessionId || !currentUser) return;

    const userData = {
      id: currentUser.id,
      name: currentUser.fullName || currentUser.firstName || currentUser.name || "Anonymous",
      image: currentUser.imageUrl || currentUser.image || "",
    };

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Join the session room
    socket.emit("join_session", { sessionId, user: userData });

    // Incoming messages
    const handleReceiveMessage = (message) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    // User typing
    const handleUserTyping = ({ user }) => {
      if (!user || user.id === currentUser.id) return;
      setTypingUsers((prev) => {
        if (prev.some((u) => u.id === user.id)) return prev;
        return [...prev, user];
      });
    };

    // User stopped typing
    const handleUserStopTyping = ({ user }) => {
      if (!user) return;
      setTypingUsers((prev) => prev.filter((u) => u.id !== user.id));
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);

    return () => {
      socket.emit("leave_session", { sessionId, user: userData });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [sessionId, currentUser?.id]);

  const sendMessage = useCallback(
    (text) => {
      if (!text?.trim() || !sessionId || !currentUser) return;

      const userData = {
        id: currentUser.id,
        name: currentUser.fullName || currentUser.firstName || currentUser.name || "Anonymous",
        image: currentUser.imageUrl || currentUser.image || "",
      };

      socket.emit("send_message", {
        sessionId,
        text,
        user: userData,
      });

      // Stop typing immediately when sending
      socket.emit("stop_typing", { sessionId, user: userData });
    },
    [sessionId, currentUser]
  );

  const sendTyping = useCallback(() => {
    if (!sessionId || !currentUser) return;

    const userData = {
      id: currentUser.id,
      name: currentUser.fullName || currentUser.firstName || currentUser.name || "Anonymous",
    };

    socket.emit("typing", { sessionId, user: userData });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { sessionId, user: userData });
    }, 2000);
  }, [sessionId, currentUser]);

  return {
    messages,
    sendMessage,
    typingUsers,
    sendTyping,
    isConnected,
  };
}
