import type { ProjectTask } from "../types/project";
import type { UserRole } from "../types/auth";

interface TableRowProps {
  task: ProjectTask;
  onEdit: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
  onComment: (task: ProjectTask) => void;
  onReply: (task: ProjectTask) => void;
  onMarkCommentRead: (task: ProjectTask) => void;
  canEdit: boolean;
  canDelete: boolean;
  canReply: boolean;
  canComment: boolean;
  showActions: boolean;
  currentUserRole: UserRole;
}

function getStatusClasses(status: ProjectTask["status"]) {
  if (status === "Concluído") {
    return "bg-green-100 text-green-800";
  }

  if (status === "Em andamento") {
    return "bg-yellow-100 text-yellow-800";
  }

  return "bg-gray-200 text-gray-700";
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function parseLocalDate(value: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return null;
  }

  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function TableRow({
  task,
  onEdit,
  onDelete,
  onComment,
  onReply,
  onMarkCommentRead,
  canEdit,
  canDelete,
  canReply,
  canComment,
  showActions,
  currentUserRole,
}: TableRowProps) {
  const cellClassName = "border-b border-gray-200 px-3 py-2";
  const adminComment = task.adminComment;
  const isUnreadForUser = Boolean(
    canReply && adminComment && !adminComment.userReadAt,
  );
  const isReadForUser = Boolean(
    canReply && adminComment && adminComment.userReadAt,
  );
  const shouldShowEmptyCommentState = currentUserRole === "admin";

  const dueDate = parseLocalDate(task.dataTerminoPrevisto);
  const todayDate = new Date();
  const normalizedToday = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate(),
  );

  // Se o término previsto já passou e a tarefa não foi concluída,
  // sinalizamos a linha e a atividade com um alerta visual.
  const isLate =
    dueDate !== null &&
    dueDate < normalizedToday &&
    task.status !== "Concluído";

  return (
    <tr className={isLate ? "bg-amber-50 text-amber-950" : "bg-white"}>
      <td className={cellClassName}>{task.id}</td>
      <td className={`${cellClassName} truncate`} title={task.projeto}>
        {task.projeto}
      </td>
      <td
        className={`${cellClassName} whitespace-normal break-words`}
        title={task.atividade}
      >
        <span className="flex items-start gap-2">
          {isLate && (
            <span
              className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white"
              title="Prazo vencido"
              aria-label="Prazo vencido"
            >
              !
            </span>
          )}
          <span className={isLate ? "font-semibold text-amber-900" : ""}>
            {task.atividade}
          </span>
        </span>
      </td>
      <td
        className={`${cellClassName} whitespace-normal break-words`}
        title={task.descricao}
      >
        {task.descricao || "-"}
      </td>
      <td className={`${cellClassName} truncate`} title={task.responsavel}>
        {task.responsavel}
      </td>
      <td className={`${cellClassName} whitespace-nowrap`}>
        {formatDate(task.dataInicioPrevisto)}
      </td>
      <td className={`${cellClassName} whitespace-nowrap`}>
        {formatDate(task.dataTerminoPrevisto)}
      </td>
      <td className={`${cellClassName} whitespace-nowrap`}>
        {formatDate(task.dataInicioReal)}
      </td>
      <td className={`${cellClassName} whitespace-nowrap`}>
        {formatDate(task.dataTerminoReal)}
      </td>
      <td
        className={`${cellClassName} font-semibold ${getStatusClasses(task.status)}`}
      >
        {task.status}
      </td>
      <td
        className={`border-b border-gray-200 px-3 py-3 ${currentUserRole === "user" ? "w-8 px-1 text-center" : "w-16 text-center"} overflow-visible`}
      >
        {adminComment ? (
          <div
            className="group relative inline-flex items-center overflow-visible"
            onMouseEnter={() => {
              if (isUnreadForUser) {
                onMarkCommentRead(task);
              }
            }}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center ${
                isUnreadForUser
                  ? "text-red-600"
                  : isReadForUser
                    ? "text-red-300"
                    : "text-red-600"
              }`}
              title={
                isUnreadForUser
                  ? "Comentário não lido"
                  : isReadForUser
                    ? "Comentário lido"
                    : "Comentário do administrador"
              }
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className={`h-5 w-5 ${isUnreadForUser ? "animate-pulse" : ""}`}
                fill="currentColor"
              >
                <path d="M7 3h2v18H7z" />
                <path d="M9 4h10l-2.8 4 2.8 4H9z" />
              </svg>
            </span>
            <div className="pointer-events-none absolute left-1/2 -top-2 z-[9999] -translate-x-1/2 -translate-y-full hidden w-72 rounded-lg border border-red-200 bg-white p-3 text-xs text-gray-700 shadow-2xl group-hover:block">
              <p className="font-semibold text-red-700">
                Comentário do administrador
              </p>
              <p className="mt-1">{adminComment.text}</p>
              {adminComment.userReply && (
                <>
                  <p className="mt-2 font-semibold text-emerald-700">
                    Resposta do usuário
                  </p>
                  <p className="mt-1">{adminComment.userReply.text}</p>
                </>
              )}
            </div>
          </div>
        ) : shouldShowEmptyCommentState ? (
          <span className="text-xs text-gray-500">Sem comentários</span>
        ) : null}
      </td>
      {showActions && (
        <td className={`${cellClassName} px-1 whitespace-nowrap`}>
          <div className="flex flex-nowrap justify-center gap-0.5">
            {canComment && (
              <button
                type="button"
                onClick={() => onComment(task)}
                aria-label={`Comentar atividade ${task.atividade}`}
                title="Comentar"
                className="inline-flex h-7 w-7 items-center justify-center rounded bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            )}
            {canReply && (
              <button
                type="button"
                onClick={() => onReply(task)}
                aria-label={`Responder comentário da atividade ${task.atividade}`}
                title={
                  adminComment?.userReply
                    ? "Editar resposta"
                    : "Responder comentário"
                }
                className="inline-flex h-7 w-7 items-center justify-center rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 17l-5-5 5-5" />
                  <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                </svg>
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Editar atividade ${task.atividade}`}
                title="Editar"
                className="inline-flex h-7 w-7 items-center justify-center rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(task)}
                aria-label={`Excluir atividade ${task.atividade}`}
                title="Excluir"
                className="inline-flex h-7 w-7 items-center justify-center rounded bg-red-600 text-white hover:bg-red-700"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
