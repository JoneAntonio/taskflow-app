"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NewEvaluationDialog } from "@/components/team/new-evaluation-dialog";
import type { MaturityCriterion } from "@/types/team-maturity";

export function NewEvaluationButton({
  agentId,
  criteria,
}: {
  agentId: string;
  criteria: MaturityCriterion[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Nova avaliação</Button>
      <NewEvaluationDialog open={open} onClose={() => setOpen(false)} agentId={agentId} criteria={criteria} />
    </>
  );
}
