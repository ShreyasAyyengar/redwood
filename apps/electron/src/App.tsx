import { Button } from "@fullstack-template/shad-ui/components/button";
import { Input } from "@fullstack-template/shad-ui/components/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, RotateCcw, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { electronORPC } from "./lib/orpc-electron.ts";
import { socketClientORPC } from "./lib/orpc-ws-client";

interface Message {
  from: "expo" | "electron" | "web";
  content: string;
}

function App() {
  const queryClient = useQueryClient();
  const [count, setCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: countFromQuery } = useQuery(electronORPC.counter.getCounter.queryOptions());

  useEffect(() => {
    let aborted = false;

    const fetchPastMessages = async () => {
      const pastMessages = await socketClientORPC.messaging.getPastChatMessages();
      setMessages(pastMessages);
    };

    fetchPastMessages();

    const subscribe = async () => {
      for await (const message of await socketClientORPC.messaging.subscribeToChatMessages()) {
        if (aborted) break;
        setMessages((prev) => [...prev, message]);
      }
    };

    subscribe();

    return () => {
      aborted = true;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    await socketClientORPC.messaging.publishChatMessage({
      from: "electron",
      content: input,
    });
    setInput("");
  };

  const incrementMutation = useMutation(
    electronORPC.counter.incrementCounter.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: electronORPC.counter.getCounter.queryKey(),
        }),
    })
  );

  const decrementMutation = useMutation(
    electronORPC.counter.decrementCounter.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: electronORPC.counter.getCounter.queryKey(),
        }),
    })
  );
  const resetMutation = useMutation(
    electronORPC.counter.resetCounter.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: electronORPC.counter.getCounter.queryKey(),
        }),
    })
  );

  useEffect(() => {
    if (countFromQuery !== undefined) setCount(countFromQuery);
  }, [countFromQuery]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black p-4 font-sans text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-md flex-col items-center gap-8 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-12 shadow-2xl backdrop-blur-sm"
      >
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-medium text-sm text-zinc-500 uppercase tracking-widest">Counter</h1>

          <div className="font-bold text-8xl tabular-nums tracking-tighter">{count}</div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => decrementMutation.mutate({})}
            className="h-14 w-14 rounded-2xl border-zinc-800 bg-zinc-900 transition-all hover:bg-zinc-800 hover:text-white active:scale-95"
          >
            <Minus className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => resetMutation.mutate({})}
            className="h-14 w-14 rounded-2xl border-zinc-800 bg-zinc-900 transition-all hover:bg-zinc-800 hover:text-white active:scale-95"
          >
            <RotateCcw className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => incrementMutation.mutate({})}
            className="h-14 w-14 rounded-2xl border-zinc-800 bg-zinc-900 transition-all hover:bg-zinc-800 hover:text-white active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex h-[500px] w-full max-w-md flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl backdrop-blur-sm"
      >
        <h2 className="text-center font-medium text-sm text-zinc-500 uppercase tracking-widest">Chat</h2>

        <div ref={scrollRef} className="scrollbar-thin scrollbar-thumb-zinc-800 flex flex-1 flex-col gap-2 overflow-y-auto p-2">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: msg.from === "electron" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex flex-col ${msg.from === "electron" ? "items-end" : "items-start"}`}
              >
                <span className="mb-1 px-1 text-[10px] text-zinc-500">{msg.from}</span>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.from === "electron" ? "rounded-tr-none bg-purple-600 text-white" : "rounded-tl-none bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="border-zinc-800 bg-zinc-950 focus-visible:ring-zinc-700"
          />
          <Button size="icon" onClick={sendMessage} className="shrink-0 bg-white text-black hover:bg-zinc-200">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="font-light text-xs text-zinc-600"
      >
        Interactive Modern Counter & Chat Built with Electron & Framer Motion
      </motion.div>
    </div>
  );
}

export default App;
