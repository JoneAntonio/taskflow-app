"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "@/components/projects/project-dialog";
import type { Project, Team } from "@/types/database";

export function NewProjectButton({
  availableParents = [],
  availableTeams = [],
}: {
  availableParents?: Project[];
  availableTeams?: Team[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Novo projeto
      </Button>
      <ProjectDialog
        open={open}
        onClose={() => setOpen(false)}
        availableParents={availableParents}
        availableTeams={availableTeams}
      />
    </>
  );
}
