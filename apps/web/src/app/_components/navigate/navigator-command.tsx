"use client";

import { Button } from "@redwood/shad-ui/components/button";
import { Command, CommandDialog, CommandInput } from "@redwood/shad-ui/components/command";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Search } from "lucide-react";
import { useState } from "react";
import CommandContent from "./command-content";

export default function NavigatorCommand() {
  const [navigateOpen, setNavigateOpen] = useState(false);
  const openNavigator = () => setNavigateOpen(true);

  useHotkey("Mod+K", () => setNavigateOpen(true));

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        className="h-12 w-12 rounded-full border border-white/20 bg-zinc-800/95 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-1 ring-black/20 hover:bg-zinc-700 active:scale-95 lg:hidden"
        aria-label="Open search"
        onClick={openNavigator}
      >
        <Search className="size-6! text-zinc-100" />
      </Button>
      <CommandDialog open={navigateOpen} onOpenChange={setNavigateOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandContent closeNavigator={() => setNavigateOpen(false)} />
        </Command>
      </CommandDialog>
    </>
  );
}
