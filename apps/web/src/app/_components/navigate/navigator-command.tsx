"use client";

import { Command, CommandDialog, CommandInput } from "@redwood/shad-ui/components/command";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useState } from "react";
import CommandContent from "./command-content";

export default function NavigatorCommand() {
  const [navigateOpen, setNavigateOpen] = useState(false);
  useHotkey("Mod+F", () => setNavigateOpen(true));

  const onSearch = (input: string) => {
    console.log(input);
  };

  return (
    <div className="flex flex-col gap-4">
      <CommandDialog open={navigateOpen} onOpenChange={setNavigateOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." onValueChange={onSearch} />
          <CommandContent closeNavigator={() => setNavigateOpen(false)} />
        </Command>
      </CommandDialog>
    </div>
  );
}
