"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewAgentDialog } from "@/components/team/new-agent-dialog";

export function AddAgentButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Novo agente
      </Button>
      <NewAgentDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
