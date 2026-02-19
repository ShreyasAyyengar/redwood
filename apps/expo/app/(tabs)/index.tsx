import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, RotateCcw, Send } from "lucide-react-native";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Pressable, View as RNView, StyleSheet, TextInput } from "react-native";
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Text, View } from "@/components/Themed";
import { expoORPC } from "@/lib/orpc-expo";
import { socketClientORPC } from "@/lib/orpc-ws-client";

function IconButton({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.button, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

export type Message = {
  from: "expo" | "electron" | "web";
  content: string;
};

export default function TabOneScreen() {
  const queryClient = useQueryClient();
  const [count, setCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<RNView>(null);

  const { data: countFromQuery } = useQuery(expoORPC.counter.getCounter.queryOptions());

  useEffect(() => {
    const fetchPastMessages = async () => {
      const pastMessages = await socketClientORPC.messaging.getPastChatMessages();
      setMessages(pastMessages);
    };
    fetchPastMessages();

    const subscribe = async () => {
      const iterator = await socketClientORPC.messaging.subscribeToChatMessages();
      for await (const message of iterator) {
        setMessages((prev) => [...prev, message]);
      }
    };
    subscribe();
  }, []);

  useEffect(() => {
    // Auto-scroll not trivial on RN without ScrollView; using end spacer is fine.
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    await socketClientORPC.messaging.publishChatMessage({ from: "expo", content: input });
    setInput("");
  };

  const incrementMutation = useMutation(
    expoORPC.counter.incrementCounter.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: expoORPC.counter.getCounter.queryKey(),
        }),
    })
  );

  const decrementMutation = useMutation(
    expoORPC.counter.decrementCounter.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: expoORPC.counter.getCounter.queryKey(),
        }),
    })
  );
  const resetMutation = useMutation(
    expoORPC.counter.resetCounter.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: expoORPC.counter.getCounter.queryKey(),
        }),
    })
  );

  useEffect(() => {
    if (countFromQuery !== undefined) setCount(countFromQuery);
  }, [countFromQuery]);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(500)} style={styles.card}>
        <View style={styles.headerGap}>
          <Text style={styles.label}>Counter</Text>
          <Text style={styles.countText}>{count}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <IconButton onPress={() => decrementMutation.mutate({})}>
            <Minus size={24} color="white" />
          </IconButton>

          <IconButton onPress={() => resetMutation.mutate({})}>
            <RotateCcw size={24} color="white" />
          </IconButton>

          <IconButton onPress={() => incrementMutation.mutate({})}>
            <Plus size={24} color="white" />
          </IconButton>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(500).duration(1000)} style={styles.chatCard}>
        <Text style={styles.chatTitle}>Chat</Text>

        <RNView style={styles.messages} ref={scrollRef}>
          {messages.map((msg, i) => (
            <RNView key={i} style={[styles.msgRow, msg.from === "expo" ? styles.right : styles.left]}>
              <Text style={styles.msgFrom}>{msg.from}</Text>
              <RNView
                style={[
                  styles.bubble,
                  msg.from === "expo" ? styles.bubbleExpo : styles.bubbleOther,
                  msg.from === "expo" ? styles.bubbleRight : styles.bubbleLeft,
                ]}
              >
                <Text style={styles.msgText}>{msg.content}</Text>
              </RNView>
            </RNView>
          ))}
        </RNView>

        <RNView style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            placeholder="Type a message..."
            placeholderTextColor="#71717a"
            style={styles.input}
          />
          <Pressable onPress={sendMessage} style={styles.sendButton}>
            <Send size={18} color="black" />
          </Pressable>
        </RNView>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(500).duration(1000)} style={styles.footer}>
        <Text style={styles.footerText}>Interactive Modern Counter & Chat Built with Expo & Reanimated</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
    padding: 16,
  },
  card: {
    flexDirection: "column",
    alignItems: "center",
    gap: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "rgba(24, 24, 27, 0.5)",
    padding: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    width: "100%",
    maxWidth: 640,
  },
  headerGap: {
    alignItems: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  countText: {
    fontSize: 80,
    fontWeight: "bold",
    color: "white",
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "transparent",
  },
  button: {
    height: 56,
    width: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "#18181b",
    alignItems: "center",
    justifyContent: "center",
  },
  chatCard: {
    marginTop: 16,
    width: "100%",
    maxWidth: 640,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "rgba(24, 24, 27, 0.5)",
    padding: 16,
    gap: 12,
  },
  chatTitle: {
    fontSize: 12,
    color: "#71717a",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  messages: {
    flexDirection: "column",
    gap: 8,
    maxHeight: 420,
  },
  msgRow: {
    flexDirection: "column",
    gap: 4,
  },
  left: { alignItems: "flex-start" },
  right: { alignItems: "flex-end" },
  msgFrom: {
    fontSize: 10,
    color: "#71717a",
    marginLeft: 4,
    marginRight: 4,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleLeft: { borderTopLeftRadius: 4 },
  bubbleRight: { borderTopRightRadius: 4 },
  bubbleExpo: { backgroundColor: "#2563EB" /* blue-600 */, color: "white" },
  bubbleOther: { backgroundColor: "#27272a", color: "#e4e4e7" },
  msgText: {
    color: "white",
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 12,
    color: "white",
  },
  sendButton: {
    height: 44,
    width: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    backgroundColor: "transparent",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "300",
    color: "#52525b",
    textAlign: "center",
  },
});
