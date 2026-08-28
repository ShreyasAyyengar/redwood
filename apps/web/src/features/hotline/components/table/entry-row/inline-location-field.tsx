"use client";

import type { Doc } from "@backend/convex/_generated/dataModel";
import { Input } from "@redwood/shad-ui/components/input";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Building2 } from "lucide-react";
import { useMemo, useState } from "react";

type InlineLocationFieldProps = {
  classrooms: Doc<"classrooms">[];
  invalid: boolean;
  onBlur: () => void;
  onChange: (value: string) => void;
  value: string;
};

export function InlineLocationField({ classrooms, invalid, onBlur, onChange, value }: InlineLocationFieldProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const filteredClassrooms = useMemo(() => {
    const query = value.trim().toLocaleLowerCase();
    if (!query) return classrooms;
    return classrooms.filter((classroom) => classroom.displayName.toLocaleLowerCase().includes(query));
  }, [classrooms, value]);

  const selectClassroom = (classroom: Doc<"classrooms">) => {
    onChange(classroom.displayName);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
        setOpen(false);
        onBlur();
      }}
    >
      <Input
        autoFocus
        role="combobox"
        aria-label="Caller location"
        aria-expanded={open}
        aria-controls="inline-caller-location-options"
        aria-autocomplete="list"
        aria-invalid={invalid}
        value={value}
        autoComplete="off"
        placeholder="Room or custom location"
        className="border-zinc-700 bg-zinc-900/80 pr-8 text-xs"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, filteredClassrooms.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && open && activeIndex >= 0) {
            event.preventDefault();
            const classroom = filteredClassrooms[activeIndex];
            if (classroom) selectClassroom(classroom);
          } else if (event.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
      />
      <Building2 className="pointer-events-none absolute top-2.5 right-2.5 size-3.5 text-zinc-600" />

      {open && (
        <div
          id="inline-caller-location-options"
          role="listbox"
          className="absolute top-full right-0 left-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-2xl shadow-black/50"
        >
          {filteredClassrooms.length > 0 ? (
            filteredClassrooms.map((classroom, index) => (
              <button
                key={classroom._id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-zinc-300 outline-none hover:bg-zinc-800 focus:bg-zinc-800",
                  index === activeIndex && "bg-zinc-800 text-white"
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectClassroom(classroom)}
              >
                <Building2 className="size-3.5 shrink-0 text-sky-500" />
                <span>{classroom.displayName}</span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-[10px] text-zinc-500">No match. The custom location will be saved.</p>
          )}
        </div>
      )}
    </div>
  );
}
