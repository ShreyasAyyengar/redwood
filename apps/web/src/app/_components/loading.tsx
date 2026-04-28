import { motion } from "framer-motion";

const text = "Loading Redwood...";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black p-4 font-sans text-white">
      <div className="text-center">
        {text.split("").map((char, i) => (
          <motion.span
            key={i}
            className="inline-block font-bold text-3xl"
            animate={{
              y: [0, -12, 0, 8, 0], // jiggle shape
              rotate: [0, -5, 5, -3, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: i * 0.05, // phase shift → creates wave
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
