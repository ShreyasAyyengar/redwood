import { ToggleGroup, ToggleGroupItem } from "@redwood/shad-ui/components/toggle-group";

export function InlineToggle({
  onChange,
  options,
  value,
}: {
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(nextValue) => nextValue && onChange(nextValue)}
      className="grid w-full grid-cols-2 gap-0.5 rounded-lg border border-zinc-700/70 bg-zinc-950/30 p-0.5"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="h-7 w-full min-w-0 rounded-md! px-0.5 text-[9px] text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300 data-[state=on]:bg-sky-500/15 data-[state=on]:text-sky-200 data-[state=on]:ring-1 data-[state=on]:ring-sky-400/20"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
