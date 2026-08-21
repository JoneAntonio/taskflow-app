"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewAgentDialog } from "@/components/team/new-agent-dialog";
import type { TeamOperation } from "@/types/team-maturity";

export function AddAgentButton({ operations = [] }: { operations?: TeamOperation[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Novo agente
      </Button>
      <NewAgentDialog open={open} onClose={() => setOpen(false)} operations={operations} />
    </>
  );
}
