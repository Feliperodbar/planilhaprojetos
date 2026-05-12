import type { ProjectTask } from "../types/project";
import type { SessionUser } from "../types/auth";

export function canCreateTask(user: SessionUser) {
  return user.role === "user";
}

export function canEditTask(user: SessionUser, task: ProjectTask) {
  if (user.role !== "user") {
    return false;
  }
  // Usuário pode editar se é o dono OU se a tarefa não tem dono definido
  return task.ownerId === user.id || !task.ownerId;
}

export function canDeleteTask(user: SessionUser, task: ProjectTask) {
  if (user.role !== "user") {
    return false;
  }
  // Usuário pode deletar se é o dono OU se a tarefa não tem dono definido
  return task.ownerId === user.id || !task.ownerId;
}

export function canCreateProjectOption(user: SessionUser) {
  return user.role === "admin";
}

export function canDeleteProjectOption(user: SessionUser) {
  return user.role === "admin";
}

export function canCommentTask(user: SessionUser) {
  return user.role === "admin";
}

export function canExportUserData(user: SessionUser, targetUserId: string) {
  if (user.role === "admin") {
    return true;
  }

  return user.id === targetUserId;
}

export function canViewTask(user: SessionUser, task: ProjectTask, targetUserId: string) {
  if (user.role === "admin") {
    return task.ownerId === targetUserId;
  }

  // Usuário comum pode ver tarefas que ele criou ou tarefas órfãs (sem dono)
  return task.ownerId === user.id || !task.ownerId;
}
