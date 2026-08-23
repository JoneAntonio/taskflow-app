"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { AIUsageIndicator } from "@/components/ai/ai-usage-indicator";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { projectsService, PROJECT_COLORS } from "@/services/projects.service";
import { validateSmartRange, METRIC_UNIT_OPTIONS } from "@/lib/smart-metrics";
import { PRIORITY_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Project, TaskPriority, Team } from "@/types/database";

const PRIORITY_OPTIONS: TaskPriority[] = ["sem_prioridade", "baixa", "media", "alta", "urgente"];

export function ProjectDialog({
  open,
  onClose,
  project,
  availableParents = [],
  availableTeams = [],
}: {
  open: boolean;
  onClose: () => void;
  project?: Project;
  /** Projetos de topo que podem servir de "projeto principal" (exclui o próprio, se estiveres a editar). */
  availableParents?: Project[];
  /** Equipas onde és admin — só essas podem "receber" este projeto. */
  availableTeams?: Team[];
}) {
  const router = useRouter();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0]);
  const [parentId, setParentId] = useState<string>(project?.parent_id ?? "");
  const [teamId, setTeamId] = useState<string>(project?.team_id ?? "");
  const [objective, setObjective] = useState(project?.objective ?? "");
  const [successMetric, setSuccessMetric] = useState(project?.success_metric ?? "");
  const [targetDate, setTargetDate] = useState(project?.target_date ?? "");
  const [currentValue, setCurrentValue] = useState(project?.current_value?.toString() ?? "");
  const [targetValue, setTargetValue] = useState(project?.target_value?.toString() ?? "");
  const [actualValue, setActualValue] = useState(project?.actual_value?.toString() ?? "");
  const [metricUnit, setMetricUnit] = useState(project?.metric_unit ?? "");
  const [lowerIsBetter, setLowerIsBetter] = useState(project?.lower_is_better ?? false);
  const [responsible, setResponsible] = useState(project?.responsible ?? "");
  const [smartPriority, setSmartPriority] = useState<TaskPriority>(project?.smart_priority ?? "sem_prioridade");
  const [actionPlan, setActionPlan] = useState(project?.action_plan ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smartError, setSmartError] = useState<string | null>(null);
  const [aiIdea, setAiIdea] = useState("");
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const parentOptions = availableParents.filter((p) => p.id !== project?.id);

  async function handleAiAssist() {
    if (!aiIdea.trim()) return;
    setIsAiLoading(true);
    setAiExplanation(null);
    try {
      const response = await fetch("/api/ai/smart-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaText: aiIdea.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Falha ao gerar sugestão.");

      setObjective(body.objective ?? "");
      setSuccessMetric(body.successMetric ?? "");
      if (body.unit) setMetricUnit(body.unit);
      if (body.actionPlan) setActionPlan(body.actionPlan);
      setAiExplanation(body.explanation ?? null);
      toast.success("Sugestão aplicada — revê e ajusta como quiseres");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar a sugestão.");
    } finally {
      setIsAiLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    // Se a pessoa começou a definir um objetivo SMART, exigimos a Meta e o
    // Prazo — sem isso não há forma de medir se o objetivo foi cumprido.
    if (objective.trim() && (!targetValue.trim() || !targetDate)) {
      setSmartError("Preenche a Meta e o Prazo para guardares este objetivo SMART.");
      return;
    }

    // "Quanto menor, melhor" só faz sentido se o ponto de partida for maior que a meta.
    const rangeError = validateSmartRange(
      currentValue.trim() ? Number(currentValue) : null,
      targetValue.trim() ? Number(targetValue) : null,
      lowerIsBetter
    );
    if (rangeError) {
      setSmartError(rangeError);
      return;
    }

    setSmartError(null);
    setIsSubmitting(true);
    try {
      const smartFields = {
        objective: objective.trim() || null,
        successMetric: successMetric.trim() || null,
        targetDate: targetDate || null,
        currentValue: currentValue.trim() ? Number(currentValue) : null,
        targetValue: targetValue.trim() ? Number(targetValue) : null,
        actualValue: actualValue.trim() ? Number(actualValue) : null,
        metricUnit: metricUnit || null,
        lowerIsBetter,
        responsible: responsible.trim() || null,
        smartPriority,
        actionPlan: actionPlan.trim() || null,
      };
      if (project) {
        await projectsService.updateProject(project.id, {
          name: name.trim(),
          description: description || null,
          color,
          parentId: parentId || null,
          teamId: teamId || null,
          objective: smartFields.objective,
          success_metric: smartFields.successMetric,
          target_date: smartFields.targetDate,
          current_value: smartFields.currentValue,
          target_value: smartFields.targetValue,
          actual_value: smartFields.actualValue,
          metric_unit: smartFields.metricUnit,
          lower_is_better: smartFields.lowerIsBetter,
          responsible: smartFields.responsible,
          smart_priority: smartFields.smartPriority,
          action_plan: smartFields.actionPlan,
        });
        toast.success("Projeto atualizado");
      } else {
        await projectsService.createProject({
          name: name.trim(),
          description: description || undefined,
          color,
          parentId: parentId || null,
          teamId: teamId || null,
          ...smartFields,
        });
        toast.success("Projeto criado");
      }
      onClose();
      router.refresh();
    } catch {
      toast.error("Não foi possível guardar o projeto.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={project ? "Editar projeto" : "Novo projeto"} className="max-w-lg">
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div>
          <Label htmlFor="project-name">Nome</Label>
          <Input id="project-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Trabalho" />
        </div>
        <div>
          <Label htmlFor="project-description">Descrição (opcional)</Label>
          <Input id="project-description" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {parentOptions.length > 0 && (
          <div>
            <Label htmlFor="project-parent">Projeto principal (opcional)</Label>
            <select
              id="project-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)]"
            >
              <option value="">Nenhum (projeto de topo)</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {availableTeams.length > 0 && (
          <div>
            <Label htmlFor="project-team">Equipa (opcional)</Label>
            <select
              id="project-team"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)]"
            >
              <option value="">Nenhuma (projeto pessoal)</option>
              {availableTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              Se escolheres uma equipa, todos os membros passam a ver este objetivo e as suas tarefas.
            </p>
          </div>
        )}
        <div>
          <Label>Cor</Label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-transform",
                  color === c ? "scale-110 border-[var(--color-ink)]" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3.5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Método SMART (opcional)
          </p>

          <div className="mb-4 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-3">
            <Label htmlFor="ai-idea" className="flex items-center gap-1.5 text-[var(--color-accent)]">
              <Sparkles className="h-3.5 w-3.5" /> Não tens experiência com SMART? Descreve a ideia em poucas palavras
            </Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="ai-idea"
                value={aiIdea}
                onChange={(e) => setAiIdea(e.target.value)}
                placeholder="Ex: quero que a equipa responda mais rápido aos clientes"
                className="flex-1"
              />
              <Button type="button" size="sm" onClick={handleAiAssist} isLoading={isAiLoading} disabled={!aiIdea.trim()}>
                Sugerir
              </Button>
            </div>
            {aiExplanation && <p className="mt-2 text-xs text-[var(--color-ink)]">💡 {aiExplanation}</p>}
            <div className="mt-2">
              <AIUsageIndicator scope="smart" />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="project-objective">🎯 Objetivo (o quê e porquê)</Label>
              <Input
                id="project-objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Ex: Reduzir o TMA da equipa SIMAR"
              />
            </div>
            <div>
              <Label htmlFor="project-metric">📊 Métrica de sucesso</Label>
              <div className="flex gap-2">
                <Input
                  id="project-metric"
                  value={successMetric}
                  onChange={(e) => setSuccessMetric(e.target.value)}
                  placeholder="Ex: Tempo médio de atendimento"
                  className="flex-1"
                />
                <select
                  value={metricUnit}
                  onChange={(e) => setMetricUnit(e.target.value)}
                  className="h-10 w-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)]"
                >
                  <option value="">Sem unidade</option>
                  {METRIC_UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="project-current-value">📍 Ponto de partida (opcional)</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    id="project-current-value"
                    type="number"
                    step="any"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="Ex: 6.2"
                  />
                  {metricUnit && <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">{metricUnit}</span>}
                </div>
              </div>
              <div>
                <Label htmlFor="project-target-value">🏆 Meta{smartError ? "" : " (opcional)"}</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    id="project-target-value"
                    type="number"
                    step="any"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="Ex: 4"
                    error={smartError && !targetValue.trim() ? "Obrigatório" : undefined}
                  />
                  {metricUnit && <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">{metricUnit}</span>}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="project-actual-value">📈 Valor atual (opcional — atualiza sempre que quiseres)</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  id="project-actual-value"
                  type="number"
                  step="any"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                  placeholder="Se vazio, assume o ponto de partida"
                />
                {metricUnit && <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">{metricUnit}</span>}
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
              <input
                type="checkbox"
                checked={lowerIsBetter}
                onChange={(e) => setLowerIsBetter(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--color-accent)]"
              />
              Quanto menor o valor, melhor (ex: TMA, tempo, custo)
            </label>
            <div>
              <Label htmlFor="project-target-date">📅 Prazo do projeto</Label>
              <Input
                id="project-target-date"
                type="date"
                value={targetDate ?? ""}
                onChange={(e) => setTargetDate(e.target.value)}
                error={smartError && !targetDate ? "Obrigatório" : undefined}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="project-responsible">👤 Responsável</Label>
                <Input
                  id="project-responsible"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  placeholder="Ex: Jone António"
                />
              </div>
              <div>
                <Label htmlFor="project-priority">⚡ Prioridade</Label>
                <select
                  id="project-priority"
                  value={smartPriority}
                  onChange={(e) => setSmartPriority(e.target.value as TaskPriority)}
                  className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)]"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="project-action-plan">🔧 Plano de ação</Label>
              <textarea
                id="project-action-plan"
                rows={2}
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                placeholder="Os passos principais para lá chegares..."
                className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>
        </div>

        {smartError && (
          <p className="rounded-lg bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
            {smartError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {project ? "Guardar" : "Criar projeto"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
