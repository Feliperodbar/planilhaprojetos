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

  // Regra: se a data prevista já passou e a tarefa não foi concluída,
  // destacamos a linha inteira em vermelho para sinalizar atraso.
  const isLate =
    Boolean(task.dataTerminoPrevisto) &&
    task.dataTerminoPrevisto < today &&
    task.status !== "Concluído";

  return (
    <tr className={isLate ? "bg-red-100" : "bg-white"}>
      <td className="px-3 py-2">{task.id}</td>
      <td className="px-3 py-2 truncate" title={task.solicitante}>
        {task.solicitante || "-"}
      </td>
      <td className="px-3 py-2 truncate" title={task.projeto}>
        {task.projeto}
      </td>
      <td className="px-3 py-2 truncate" title={task.atividade}>
        {task.atividade}
      </td>
      <td className="px-3 py-2 truncate" title={task.descricao}>
        {task.descricao || "-"}
      </td>
      <td className="px-3 py-2 truncate" title={task.responsavel}>
        {task.responsavel}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {formatDate(task.dataInicioPrevisto)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {formatDate(task.dataTerminoPrevisto)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {formatDate(task.dataInicioReal)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {formatDate(task.dataTerminoReal)}
      </td>
      <td className="px-3 py-2">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusClasses(task.status)}`}
        >
          {task.status}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-1 xl:flex-row">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
          >
            Excluir
          </button>
        </div>
      </td>
    </tr>
  );
}
