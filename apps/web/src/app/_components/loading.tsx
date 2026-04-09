export default function LoadingComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black p-4 font-sans text-white">
      <div className="gap-4 text-center">
        {"Loading Redwood...".split("").map((letter, i) => (
          <span key={crypto.randomUUID()} className="inline-block animate-bounce font-bold text-3xl" style={{ animationDelay: `${i * 0.1}s` }}>
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
      </div>
    </div>
  );
}
