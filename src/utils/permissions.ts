import type { ProjectTask } from "../types/project";
import type { SessionUser } from "../types/auth";

export function canCreateTask(user: SessionUser) {
  return user.role === "user";
}

export function canEditTask(user: SessionUser, task: ProjectTask) {
  return user.role === "user" && task.ownerId === user.id;
}

export function canDeleteTask(user: SessionUser, task: ProjectTask) {
  return user.role === "user" && task.ownerId === user.id;
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

  return task.ownerId === user.id;
}
