"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import type { Task } from "@/types/database";

export function AutoOpenTaskFromQuery() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);

  const taskId = searchParams.get("task");

  useEffect(() => {
    if (!taskId) return;
    const supabase = createClient();
    supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single()
      .then(({ data }) => setTask((data as Task) ?? null));
  }, [taskId]);

  function handleClose() {
    setTask(null);
    router.replace(pathname);
  }

  if (!task) return null;
  return <TaskDetailDialog task={task} open onClose={handleClose} />;
}
