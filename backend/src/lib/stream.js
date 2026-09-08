import { StreamClient } from "@stream-io/node-sdk";
import { ENV } from "./env.js";

const apiKey = ENV.STREAM_API_KEY;
const apiSecret = ENV.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("STREAM_API_KEY or STREAM_API_SECRET is missing");
}

export const streamClient = new StreamClient(apiKey, apiSecret); // used for video calls

export const upsertStreamUser = async (userData) => {
  try {
    await streamClient.upsertUsers([userData]);
    console.log("Stream video user upserted successfully:", userData);
  } catch (error) {
    console.error("Error upserting Stream video user:", error);
  }
};

export const deleteStreamUser = async (userId) => {
  try {
    await streamClient.deleteUser(userId);
    console.log("Stream video user deleted successfully:", userId);
  } catch (error) {
    console.error("Error deleting Stream video user:", error);
  }
};

