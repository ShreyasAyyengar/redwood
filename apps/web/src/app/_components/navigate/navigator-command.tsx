"use client";

import { Command, CommandDialog, CommandInput } from "@redwood/shad-ui/components/command";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useState } from "react";
import CommandContent from "./command-content";

export default function NavigatorCommand() {
  const [navigateOpen, setNavigateOpen] = useState(false);
  useHotkey("Mod+K", () => setNavigateOpen(true));

  return (
    <div className="flex flex-col gap-4">
      <CommandDialog open={navigateOpen} onOpenChange={setNavigateOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandContent closeNavigator={() => setNavigateOpen(false)} />
        </Command>
      </CommandDialog>
    </div>
  );
}
