import type { ProjectTask } from "../types/project";
import { TableRow } from "./TableRow";

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
  onSort,
  onEdit,
  onDelete,
}: TableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <table className="w-full table-fixed text-justify text-sm">
        <colgroup>
          <col style={{ width: "4%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "19%" }} />
          <col style={{ width: "21%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
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
            <th className="px-3 py-2 font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={11}>
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
