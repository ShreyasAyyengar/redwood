"use client";

import { Button } from "@redwood/shad-ui/components/button";
import { Dialog, DialogContent, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@redwood/shad-ui/components/tooltip";
import { MessageSquareText } from "lucide-react";
import { useState } from "react";
import FeedbackForm from "./feedback-form";

export default function FeedbackDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="icon-lg"
                className="h-12 w-12 rounded-full bg-zinc-900 shadow-lg hover:bg-zinc-800 active:scale-95"
                aria-label="Open feedback dialog"
              >
                <MessageSquareText className="h-6! w-6! text-white" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="left" tooltipArrowClassName="bg-white fill-white" className="text-xl">
            Feedback
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="border-zinc-700 bg-zinc-800 p-3">
        <FeedbackForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
