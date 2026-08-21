"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { projectReviewsService } from "@/services/project-reviews.service";
import { tasksService } from "@/services/tasks.service";
import type { ProjectReview } from "@/types/database";

const STEPS: { key: "planText" | "doText" | "checkText" | "actText"; label: string; placeholder: string }[] = [
  { key: "planText", label: "Planear", placeholder: "O que vais fazer neste ciclo?" },
  { key: "doText", label: "Fazer", placeholder: "O que já foi executado?" },
  { key: "checkText", label: "Verificar", placeholder: "O que os números mostram?" },
  { key: "actText", label: "Agir", placeholder: "O que vais ajustar a seguir?" },
];

export function ProjectReviews({ projectId, initialReviews }: { projectId: string; initialReviews: ProjectReview[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState({ planText: "", doText: "", checkText: "", actText: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setIsSubmitting(true);
    try {
      const created = await projectReviewsService.createReview({ projectId, ...values });
      setReviews((prev) => [created, ...prev]);
      setValues({ planText: "", doText: "", checkText: "", actText: "" });
      setFormOpen(false);
      toast.success("Revisão guardada");
      router.refresh();
    } catch {
      toast.error("Não foi possível guardar a revisão.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateTaskFromAct() {
    if (!values.actText.trim()) {
      toast.error('Escreve o que vais ajustar em "Agir" primeiro.');
      return;
    }
    setCreatingTask(true);
    try {
      await tasksService.createQuickTask({ title: values.actText.trim(), projectId });
      toast.success("Tarefa criada — já aparece na Matriz de Eisenhower");
    } catch {
      toast.error("Não foi possível criar a tarefa.");
    } finally {
      setCreatingTask(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Revisões (PDCA)</CardTitle>
        <Button size="sm" onClick={() => setFormOpen((prev) => !prev)}>
          <Plus className="h-3.5 w-3.5" /> Nova revisão
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {formOpen && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {STEPS.map((step) => (
                <div key={step.key}>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-ink-muted)]">{step.label}</label>
                  <textarea
                    rows={2}
                    value={values[step.key]}
                    onChange={(e) => setValues((prev) => ({ ...prev, [step.key]: e.target.value }))}
                    placeholder={step.placeholder}
                    className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCreateTaskFromAct} isLoading={creatingTask}>
                <ListChecks className="h-3.5 w-3.5" /> Criar tarefa a partir do &quot;Agir&quot;
              </Button>
              <Button size="sm" onClick={handleSave} isLoading={isSubmitting}>
                Guardar revisão
              </Button>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
            Ainda sem revisões. A primeira revisão fica registada aqui com a data de hoje.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="border-l-2 border-[var(--color-border)] py-1 pl-3">
                <p className="mb-1 text-xs text-[var(--color-ink-muted)]">
                  {new Date(review.review_date + "T00:00:00").toLocaleDateString("pt-PT", {
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <div className="space-y-0.5 text-sm">
                  {review.plan_text && (
                    <p>
                      <span className="text-[var(--color-secondary)]">Planear: </span>
                      <span className="text-[var(--color-ink)]">{review.plan_text}</span>
                    </p>
                  )}
                  {review.do_text && (
                    <p>
                      <span className="text-[var(--color-secondary)]">Fazer: </span>
                      <span className="text-[var(--color-ink)]">{review.do_text}</span>
                    </p>
                  )}
                  {review.check_text && (
                    <p>
                      <span className="text-[var(--color-secondary)]">Verificar: </span>
                      <span className="text-[var(--color-ink)]">{review.check_text}</span>
                    </p>
                  )}
                  {review.act_text && (
                    <p>
                      <span className="text-[var(--color-secondary)]">Agir: </span>
                      <span className="text-[var(--color-ink)]">{review.act_text}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
