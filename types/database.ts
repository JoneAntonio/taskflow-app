/**
 * Tipos que espelham o esquema PostgreSQL definido em /supabase/migrations.
 * Mantidos manualmente na Fase 1; podem ser substituídos mais tarde por
 * tipos gerados automaticamente (supabase gen types typescript).
 */

export type TaskStatus = "pendente" | "em_progresso" | "concluida" | "arquivada";

export type TaskPriority = "sem_prioridade" | "baixa" | "media" | "alta" | "urgente";

export type RecurrenceFrequency =
  | "diaria"
  | "dias_uteis"
  | "semanal"
  | "mensal"
  | "anual"
  | "personalizada"
  | null;

export type ThemePreference = "light" | "dark" | "system";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  theme: ThemePreference;
  timezone: string;
  notifications_enabled: boolean;
  is_platform_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  parent_id: string | null;
  team_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  // Objetivo SMART: Specific + Achievable + Relevant ficam no "objective";
  // Measurable é o "success_metric"; Time-bound é o "target_date".
  objective: string | null;
  success_metric: string | null;
  target_date: string | null;
  current_value: number | null;
  target_value: number | null;
  lower_is_better: boolean;
  metric_unit: string | null;
  actual_value: number | null;
  responsible: string | null;
  smart_priority: TaskPriority;
  action_plan: string | null;
  // Campos calculados (via view / agregação), não colunas reais
  task_count?: number;
  completed_task_count?: number;
}

export interface ProjectReview {
  id: string;
  user_id: string;
  project_id: string;
  review_date: string;
  plan_text: string | null;
  do_text: string | null;
  check_text: string | null;
  act_text: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Recurrence {
  frequency: RecurrenceFrequency;
  interval: number; // ex: a cada 2 semanas
  by_weekday: number[] | null; // 0=domingo ... 6=sábado
  until: string | null; // data limite opcional
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  team_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  due_date: string | null; // YYYY-MM-DD
  due_time: string | null; // HH:mm
  due_time_end: string | null; // HH:mm — fim do intervalo, quando existe
  priority: TaskPriority;
  status: TaskStatus;
  is_important: boolean;
  recurrence: Recurrence | null;
  reminder_at: string | null;
  location: string | null;
  estimated_duration_minutes: number | null; // timestamptz
  position: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relações carregadas via join
  subtasks?: Subtask[];
  tags?: Tag[];
  project?: Project | null;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: Profile;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  user_id: string | null;
  action: string;
  detail: string | null;
  created_at: string;
  author?: Profile;
}

export type TeamRole = "admin" | "member";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  // Relações carregadas via join
  profile?: Profile;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string | null;
  role: TeamRole;
  invited_by: string;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  accepted_at: string | null;
  token: string | null;
  expires_at: string | null;
}

export interface Conversation {
  id: string;
  team_id: string | null;
  dm_user_a: string | null;
  dm_user_b: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: Profile;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

export interface Reminder {
  id: string;
  task_id: string;
  user_id: string;
  remind_at: string;
  channel: "app" | "push" | "email";
  sent_at: string | null;
  created_at: string;
}

export type HabitFrequencyType = "diaria" | "semanal" | "personalizada";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency_type: HabitFrequencyType;
  target_days: number[]; // dias da semana alvo, 0-6
  archived: boolean;
  created_at: string;
  // Calculados
  current_streak?: number;
  longest_streak?: number;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  completed: boolean;
  created_at: string;
}

export interface PomodoroSession {
  id: string;
  user_id: string;
  task_id: string | null;
  duration_minutes: number;
  session_type: "foco" | "pausa_curta" | "pausa_longa";
  started_at: string;
  completed_at: string | null;
}

export type NotificationType = "lembrete" | "sistema" | "recorrencia";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  related_task_id: string | null;
  team_id: string | null;
  created_at: string;
}

/** Estrutura Supabase Database (usada em createClient<Database>()) */
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> };
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> };
      subtasks: { Row: Subtask; Insert: Partial<Subtask>; Update: Partial<Subtask> };
      tags: { Row: Tag; Insert: Partial<Tag>; Update: Partial<Tag> };
      task_tags: { Row: { task_id: string; tag_id: string }; Insert: { task_id: string; tag_id: string }; Update: never };
      reminders: { Row: Reminder; Insert: Partial<Reminder>; Update: Partial<Reminder> };
      habits: { Row: Habit; Insert: Partial<Habit>; Update: Partial<Habit> };
      habit_logs: { Row: HabitLog; Insert: Partial<HabitLog>; Update: Partial<HabitLog> };
      pomodoro_sessions: { Row: PomodoroSession; Insert: Partial<PomodoroSession>; Update: Partial<PomodoroSession> };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
    };
  };
}
