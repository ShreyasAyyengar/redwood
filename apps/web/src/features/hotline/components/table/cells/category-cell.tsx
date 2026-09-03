export function CategoryCell({ value }: { value: string }) {
  return (
    <span
      className="flex min-w-0 items-center gap-1.5 rounded-md border border-gray-500/20 bg-gray-500/10 px-2 py-1 text-gray-300 text-xs"
      title={value}
    >
      <span className="size-2 shrink-0 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(154,154,154,0.35)]" />
      <span className="whitespace-nowrap">{value}</span>
    </span>
  );
}
