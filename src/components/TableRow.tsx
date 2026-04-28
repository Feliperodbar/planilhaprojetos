import type { ProjectTask } from "../types/project";

interface TableRowProps {
  task: ProjectTask;
  onEdit: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
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

export function TableRow({ task, onEdit, onDelete }: TableRowProps) {
  const today = new Date().toISOString().slice(0, 10);
  const cellClassName = "border-b border-gray-200 px-3 py-2";

  // Regra: se a data prevista já passou e a tarefa não foi concluída,
  // destacamos a linha inteira em vermelho para sinalizar atraso.
  const isLate =
    Boolean(task.dataTerminoPrevisto) &&
    task.dataTerminoPrevisto < today &&
    task.status !== "Concluído";

  return (
    <tr className={isLate ? "bg-red-100" : "bg-white"}>
      <td className={cellClassName}>{task.id}</td>
      <td className={`${cellClassName} truncate`} title={task.projeto}>
        {task.projeto}
      </td>
      <td className={`${cellClassName} truncate`} title={task.atividade}>
        {task.atividade}
      </td>
      <td className={`${cellClassName} truncate`} title={task.descricao}>
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
      <td className={cellClassName}>
        <div className="flex flex-col gap-1 xl:flex-row">
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Editar atividade ${task.atividade}`}
            title="Editar"
            className="inline-flex items-center justify-center rounded bg-blue-600 px-2 py-2 text-white hover:bg-blue-700"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
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
          <button
            type="button"
            onClick={() => onDelete(task)}
            aria-label={`Excluir atividade ${task.atividade}`}
            title="Excluir"
            className="inline-flex items-center justify-center rounded bg-red-600 px-2 py-2 text-white hover:bg-red-700"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
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
        </div>
      </td>
    </tr>
  );
}
