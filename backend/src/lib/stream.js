import { StreamChat } from "stream-chat";
import { ENV } from "./env.js";
import { StreamClient } from "@stream-io/node-sdk";

const apiKey = ENV.STREAM_API_KEY || "placeholder_key";
const apiSecret = ENV.STREAM_API_SECRET || "placeholder_secret_key_minimum_32_chars_long";

if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
  console.warn("⚠️ STREAM_API_KEY or STREAM_API_SECRET is missing from environment variables");
}

export const chatClient = StreamChat.getInstance(apiKey, apiSecret);
export const streamClient = new StreamClient(apiKey, apiSecret); // will be used for video calls

export const upsertStreamUser = async (userData) => {
  try {
    await chatClient.upsertUser(userData);
    console.log("Stream user upserted successfully:", userData);
  } catch (error) {
    console.error("Error upserting Stream user:", error);
  }
};

export const deleteStreamUser = async (userId) => {
  try {
    await chatClient.deleteUser(userId);
    console.log("Stream user deleted successfully:", userId);
  } catch (error) {
    console.error("Error deleting the Stream user:", error);
  }
};
