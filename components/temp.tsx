// [id.tsx]

// app/(private)/chat/[id].tsx
import { getToken } from "@/utils/tokenHelper";
import AgoraChat from "agora-chat";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Params = {
  sessionId?: string;
  customerId?: string;
};

export default function ChatScreen() {
  const params = useLocalSearchParams() as Params;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const clientRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatToken, setChatToken] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [consultantAccount, setConsultantAccount] = useState<string | null>(
    null
  );

  const API_BASE_URL = "https://api.colio.in/api";

  useEffect(() => {
    let mounted = true;

    async function initChat() {
      try {
        const jwt = await getToken();
        if (!jwt) throw new Error("No auth token");

        // 🔹 Get chat token for logged-in consultant
        const res = await axios.get(`${API_BASE_URL}/agora/chat/token`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });

        const { chatToken: token, agoraAppId, userId } = res.data;
        setChatToken(token);
        setAppId(agoraAppId);
        setConsultantAccount(userId);

        const client: any =
          (AgoraChat as any).create?.({ appKey: agoraAppId }) ||
          (AgoraChat as any);
        clientRef.current = client;

        // Login to Agora Chat
        if (typeof client.open === "function") {
          await client.open({ user: userId, agoraToken: token });
        } else if (typeof client.login === "function") {
          await client.login(userId, token);
        }

        // 🔹 Add event handler for receiving messages
        if (client.addEventHandler) {
          client.addEventHandler("ConsultantChatHandler", {
            onTextMessage: (msg: any) => {
              if (!mounted) return;
              setMessages((m) => [...m, msg]);
            },
          });
        } else if (client.on) {
          client.on("message", (msg: any) => setMessages((m) => [...m, msg]));
        }

        setLoading(false);
      } catch (err) {
        console.error("Chat init error:", err);
      }
    }

    initChat();

    // Cleanup on unmount
    return () => {
      mounted = false;
      const client = clientRef.current;
      if (client) {
        try {
          client.removeEventHandler?.("ConsultantChatHandler");
          client.close?.();
        } catch (e) {
          console.warn("cleanup error:", e);
        }
      }
    };
  }, []);

  // 🔹 Send message
  async function sendText() {
    if (!text.trim() || !clientRef.current || !consultantAccount) return;

    try {
      const client = clientRef.current;
      const msgPayload = {
        chatType: "singleChat",
        type: "txt",
        to: params.customerId,
        msg: text,
      };

      if (typeof client.sendTextMessage === "function") {
        await client.sendTextMessage(msgPayload);
      } else if (typeof client.sendMessage === "function") {
        await client.sendMessage(msgPayload);
      }

      setMessages((m) => [
        ...m,
        { from: consultantAccount, msg: text, isLocal: true },
      ]);
      setText("");
    } catch (err) {
      console.error("sendText error:", err);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <Text style={{ color: "#fff" }}>Connecting chat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 8,
              alignSelf:
                item.from === consultantAccount ? "flex-end" : "flex-start",
              backgroundColor:
                item.from === consultantAccount ? "#ff2e8b" : "#222",
              borderRadius: 10,
              marginVertical: 4,
              maxWidth: "75%",
            }}
          >
            <Text style={{ color: "#fff" }}>{item.msg}</Text>
          </View>
        )}
      />

      {/* Input Bar */}
      <View
        style={{
          flexDirection: "row",
          padding: 8,
          backgroundColor: "#111",
          alignItems: "center",
        }}
      >
        <TextInput
          placeholder="Type a message"
          placeholderTextColor="#bbb"
          value={text}
          onChangeText={setText}
          style={{
            flex: 1,
            color: "#fff",
            backgroundColor: "#222",
            borderRadius: 8,
            padding: 10,
          }}
        />
        <TouchableOpacity
          onPress={sendText}
          style={{
            marginLeft: 8,
            backgroundColor: "#ff2e8b",
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
