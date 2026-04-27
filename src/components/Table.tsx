import type { ProjectTask } from "../types/project";
import { TableRow } from "./TableRow";
import type { ProjectTaskInput, TaskStatus } from "../types/project";
import type { KeyboardEvent } from "react";

export type SortDirection = "asc" | "desc";

export type SortKey = keyof ProjectTask;

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface TableProps {
  tasks: ProjectTask[];
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
  onEdit: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
  isCreatingInline: boolean;
  newTaskDraft: ProjectTaskInput;
  newTaskErrors: {
    projeto?: string;
    atividade?: string;
    responsavel?: string;
  };
  onNewTaskChange: (field: keyof ProjectTaskInput, value: string) => void;
  onCreateInlineSave: () => void;
  onCreateInlineCancel: () => void;
}

const columns: Array<{ label: string; key: SortKey }> = [
  { label: "ID", key: "id" },
  { label: "Solicitante", key: "solicitante" },
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
  onSort,
  onEdit,
  onDelete,
  isCreatingInline,
  newTaskDraft,
  newTaskErrors,
  onNewTaskChange,
  onCreateInlineSave,
  onCreateInlineCancel,
}: TableProps) {
  const statusOptions: TaskStatus[] = [
    "Não iniciado",
    "Em andamento",
    "Concluído",
  ];

  const handleRowKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCreateInlineSave();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCreateInlineCancel();
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <table className="w-full table-fixed text-left text-sm">
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
            <th className="px-3 py-2 font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {isCreatingInline && (
            <tr className="bg-emerald-50/60" onKeyDown={handleRowKeyDown}>
              <td className="px-3 py-2 text-gray-500">Novo</td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={newTaskDraft.solicitante}
                  onChange={(event) =>
                    onNewTaskChange("solicitante", event.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                  placeholder="Solicitante"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={newTaskDraft.projeto}
                  onChange={(event) => onNewTaskChange("projeto", event.target.value)}
                  className={`w-full rounded border px-2 py-1 ${
                    newTaskErrors.projeto ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Projeto *"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={newTaskDraft.atividade}
                  onChange={(event) =>
                    onNewTaskChange("atividade", event.target.value)
                  }
                  className={`w-full rounded border px-2 py-1 ${
                    newTaskErrors.atividade ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Atividade *"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={newTaskDraft.descricao}
                  onChange={(event) => onNewTaskChange("descricao", event.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1"
                  placeholder="Descrição"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={newTaskDraft.responsavel}
                  onChange={(event) =>
                    onNewTaskChange("responsavel", event.target.value)
                  }
                  className={`w-full rounded border px-2 py-1 ${
                    newTaskErrors.responsavel ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Responsável *"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="date"
                  value={newTaskDraft.dataInicioPrevisto}
                  onChange={(event) =>
                    onNewTaskChange("dataInicioPrevisto", event.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="date"
                  value={newTaskDraft.dataTerminoPrevisto}
                  onChange={(event) =>
                    onNewTaskChange("dataTerminoPrevisto", event.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="date"
                  value={newTaskDraft.dataInicioReal}
                  onChange={(event) => onNewTaskChange("dataInicioReal", event.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="date"
                  value={newTaskDraft.dataTerminoReal}
                  onChange={(event) =>
                    onNewTaskChange("dataTerminoReal", event.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="px-3 py-2">
                <select
                  value={newTaskDraft.status}
                  onChange={(event) => onNewTaskChange("status", event.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-col gap-1 xl:flex-row">
                  <button
                    type="button"
                    onClick={onCreateInlineSave}
                    className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={onCreateInlineCancel}
                    className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                </div>
              </td>
            </tr>
          )}

          {tasks.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={12}>
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
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
