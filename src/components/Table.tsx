import type { ProjectTask } from "../types/project";
import { TableRow } from "./TableRow";
import type { UserRole } from "../types/auth";

export type SortDirection = "asc" | "desc";

export type SortKey =
  | "id"
  | "projeto"
  | "atividade"
  | "descricao"
  | "responsavel"
  | "dataInicioPrevisto"
  | "dataTerminoPrevisto"
  | "dataInicioReal"
  | "dataTerminoReal"
  | "status";

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface TableProps {
  tasks: ProjectTask[];
  sortConfig: SortConfig;
  currentUserRole: UserRole;
  onSort: (key: SortKey) => void;
  onEdit: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
  onComment: (task: ProjectTask) => void;
  onReply: (task: ProjectTask) => void;
  onMarkCommentRead: (task: ProjectTask) => void;
  canEditTask: (task: ProjectTask) => boolean;
  canDeleteTask: (task: ProjectTask) => boolean;
  canReplyTask: (task: ProjectTask) => boolean;
  canCommentTask: boolean;
}

const columns: Array<{ label: string; key: SortKey }> = [
  { label: "ID", key: "id" },
  { label: "Projeto", key: "projeto" },
  { label: "Atividade", key: "atividade" },
  { label: "Descrição", key: "descricao" },
  { label: "Responsável", key: "responsavel" },
  { label: "Início Prev.", key: "dataInicioPrevisto" },
  { label: "Término Prev.", key: "dataTerminoPrevisto" },
  { label: "Início Real", key: "dataInicioReal" },
  { label: "Término Real", key: "dataTerminoReal" },
  { label: "Status", key: "status" },
];

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) {
    return <span className="text-gray-400">↕</span>;
  }

  return <span>{direction === "asc" ? "↑" : "↓"}</span>;
}

export function Table({
  tasks,
  sortConfig,
  currentUserRole,
  onSort,
  onEdit,
  onDelete,
  onComment,
  onReply,
  onMarkCommentRead,
  canEditTask,
  canDeleteTask,
  canReplyTask,
  canCommentTask,
}: TableProps) {
  const showActions =
    canCommentTask ||
    tasks.some(
      (task) => canEditTask(task) || canDeleteTask(task) || canReplyTask(task),
    );
  const commentsColumnWidth = "10%";
  const actionsColumnWidth = currentUserRole === "user" ? "8%" : "6%";

  return (
    <div
      className={`${tasks.length === 0 ? "overflow-hidden" : "overflow-x-auto"} overflow-y-visible rounded-2xl border border-emerald-100 bg-white shadow-sm`}
    >
      <table className="w-full table-fixed text-justify text-sm">
        <colgroup>
          <col style={{ width: "3%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: commentsColumnWidth }} />
          {showActions && <col style={{ width: actionsColumnWidth }} />}
        </colgroup>
        <thead className="bg-emerald-50 text-gray-700">
          <tr>
            {columns.map((column) => {
              const isActive = sortConfig.key === column.key;

              return (
                <th
                  key={column.key}
                  className="px-2 py-2 font-semibold align-top md:px-3"
                >
                  <button
                    type="button"
                    className="flex w-full items-start gap-1 text-left leading-tight hover:text-emerald-700"
                    onClick={() => onSort(column.key)}
                  >
                    <span className="break-words">{column.label}</span>
                    <SortIndicator
                      active={isActive}
                      direction={sortConfig.direction}
                    />
                  </button>
                </th>
              );
            })}
            <th className="px-2 py-2 text-center font-semibold whitespace-normal break-words">
              Comentários
            </th>
            {showActions && (
              <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td
                className="px-3 py-6 text-center text-gray-500"
                colSpan={showActions ? 12 : 11}
              >
                Nenhuma tarefa encontrada.
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <TableRow
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onComment={onComment}
                onReply={onReply}
                onMarkCommentRead={onMarkCommentRead}
                canEdit={canEditTask(task)}
                canDelete={canDeleteTask(task)}
                canReply={canReplyTask(task)}
                canComment={canCommentTask}
                showActions={showActions}
                currentUserRole={currentUserRole}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
