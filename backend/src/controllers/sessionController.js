import { streamClient } from "../lib/stream.js";
import prisma from "../lib/db.js";

// Helper to format PostgreSQL session into consistent shape (including _id for full frontend compatibility)
function formatSession(session) {
  if (!session) return null;
  return {
    ...session,
    _id: session.id,
    host: session.host
      ? {
          ...session.host,
          _id: session.host.id,
        }
      : session.hostId,
    participant: session.participant
      ? {
          ...session.participant,
          _id: session.participant.id,
        }
      : session.participantId || null,
  };
}

export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;
    const userId = req.user.id || req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res.status(400).json({ message: "Problem and difficulty are required" });
    }

    // generate a unique call id for stream video
    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // create session in PostgreSQL
    const session = await prisma.session.create({
      data: {
        problem,
        difficulty,
        hostId: userId,
        callId,
      },
      include: {
        host: {
          select: { id: true, name: true, profileImage: true, email: true, clerkId: true },
        },
        participant: {
          select: { id: true, name: true, profileImage: true, email: true, clerkId: true },
        },
      },
    });

    // create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session.id },
      },
    });

    res.status(201).json({ session: formatSession(session) });
  } catch (error) {
    console.log("Error in createSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getActiveSessions(_, res) {
  try {
    const sessions = await prisma.session.findMany({
      where: { status: "active" },
      include: {
        host: {
          select: { id: true, name: true, profileImage: true, email: true, clerkId: true },
        },
        participant: {
          select: { id: true, name: true, profileImage: true, email: true, clerkId: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.status(200).json({ sessions: sessions.map(formatSession) });
  } catch (error) {
    console.log("Error in getActiveSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user.id || req.user._id;

    // get sessions where user is either host or participant
    const sessions = await prisma.session.findMany({
      where: {
        status: "completed",
        OR: [{ hostId: userId }, { participantId: userId }],
      },
      include: {
        host: {
          select: { id: true, name: true, profileImage: true, email: true, clerkId: true },
        },
        participant: {
          select: { id: true, name: true, profileImage: true, email: true, clerkId: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.status(200).json({ sessions: sessions.map(formatSession) });
  } catch (error) {
    console.log("Error in getMyRecentSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, name: true, email: true, profileImage: true, clerkId: true },
        },
        participant: {
          select: { id: true, name: true, email: true, profileImage: true, clerkId: true },
        },
      },
    });

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ session: formatSession(session) });
  } catch (error) {
    console.log("Error in getSessionById controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "active") {
      return res.status(400).json({ message: "Cannot join a completed session" });
    }

    if (session.hostId === userId) {
      return res.status(400).json({ message: "Host cannot join their own session as participant" });
    }

    // check if session is already full - has a participant
    if (session.participantId) return res.status(409).json({ message: "Session is full" });

    const updatedSession = await prisma.session.update({
      where: { id },
      data: { participantId: userId },
      include: {
        host: {
          select: { id: true, name: true, email: true, profileImage: true, clerkId: true },
        },
        participant: {
          select: { id: true, name: true, email: true, profileImage: true, clerkId: true },
        },
      },
    });

    res.status(200).json({ session: formatSession(updatedSession) });
  } catch (error) {
    console.log("Error in joinSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) return res.status(404).json({ message: "Session not found" });

    // check if user is the host
    if (session.hostId !== userId) {
      return res.status(403).json({ message: "Only the host can end the session" });
    }

    // check if session is already completed
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session is already completed" });
    }

    // delete stream video call if callId exists
    if (session.callId) {
      try {
        const call = streamClient.video.call("default", session.callId);
        await call.delete({ hard: true });
      } catch (streamError) {
        console.warn("Stream call deletion note:", streamError.message);
      }
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: { status: "completed" },
      include: {
        host: {
          select: { id: true, name: true, email: true, profileImage: true, clerkId: true },
        },
        participant: {
          select: { id: true, name: true, email: true, profileImage: true, clerkId: true },
        },
      },
    });

    res.status(200).json({ session: formatSession(updatedSession), message: "Session ended successfully" });
  } catch (error) {
    console.log("Error in endSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
