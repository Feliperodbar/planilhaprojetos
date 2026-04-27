import { FormModal } from "../components/FormModal";
import { Table } from "../components/Table";
import type { SortConfig, SortKey } from "../components/Table";
import type { ProjectTask, ProjectTaskInput, TaskStatus } from "../types/project";
import neoHeaderLogo from "../assets/neoheader.svg";

interface ToastState {
  type: "success" | "error";
  message: string;
}

interface TaskManagerPageProps {
  tasks: ProjectTask[];
  taskToEdit: ProjectTask | null;
  isModalOpen: boolean;
  statusFilter: "Todos" | TaskStatus;
  responsavelFilter: string;
  sortConfig: SortConfig;
  currentPage: number;
  totalPages: number;
  solicitanteOptions: string[];
  projetoOptions: string[];
  responsavelOptions: string[];
  toast: ToastState | null;
  onStatusFilterChange: (value: "Todos" | TaskStatus) => void;
  onResponsavelFilterChange: (value: string) => void;
  onSort: (key: SortKey) => void;
  onCreate: () => void;
  onExportCsv: () => void;
  onEdit: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
  onModalClose: () => void;
  onModalSave: (task: Omit<ProjectTask, "id">) => void;
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
  onPrevPage: () => void;
  onNextPage: () => void;
}

const statusFilterOptions: Array<"Todos" | TaskStatus> = [
  "Todos",
  "Não iniciado",
  "Em andamento",
  "Concluído",
];

export function TaskManagerPage({
  tasks,
  taskToEdit,
  isModalOpen,
  statusFilter,
  responsavelFilter,
  sortConfig,
  currentPage,
  totalPages,
  solicitanteOptions,
  projetoOptions,
  responsavelOptions,
  toast,
  onStatusFilterChange,
  onResponsavelFilterChange,
  onSort,
  onCreate,
  onExportCsv,
  onEdit,
  onDelete,
  onModalClose,
  onModalSave,
  isCreatingInline,
  newTaskDraft,
  newTaskErrors,
  onNewTaskChange,
  onCreateInlineSave,
  onCreateInlineCancel,
  onPrevPage,
  onNextPage,
}: TaskManagerPageProps) {
  return (
    <div className="mx-auto min-h-screen max-w-[1440px] p-4 md:p-6">
      <header className="mb-5 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm backdrop-blur md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <img
              src={neoHeaderLogo}
              alt="Neoenergia"
              className="mb-3 h-10 w-auto md:h-12"
            />
            <h1 className="text-2xl font-bold text-gray-800">
              Gestão de Atividades
            </h1>
            <p className="text-sm text-gray-600">
              Controle tarefas por projeto com filtros, ordenação, paginação e
              persistência local.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onExportCsv}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 font-medium text-emerald-800 transition hover:bg-emerald-100"
            >
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={onCreate}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700"
            >
              Nova Atividade
            </button>
          </div>
        </div>
      </header>

      <section className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Filtro por Status
          </label>
          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as "Todos" | TaskStatus)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
          >
            {statusFilterOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Filtro por Responsável
          </label>
          <select
            value={responsavelFilter}
            onChange={(event) => onResponsavelFilterChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
          >
            <option value="Todos">Todos</option>
            {responsavelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 lg:col-span-2 flex items-end">
          <p className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </p>
        </div>
      </section>

      <Table
        tasks={tasks}
        sortConfig={sortConfig}
        onSort={onSort}
        onEdit={onEdit}
        onDelete={onDelete}
        isCreatingInline={isCreatingInline}
        newTaskDraft={newTaskDraft}
        newTaskErrors={newTaskErrors}
        onNewTaskChange={onNewTaskChange}
        onCreateInlineSave={onCreateInlineSave}
        onCreateInlineCancel={onCreateInlineCancel}
      />

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevPage}
          className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage <= 1}
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={onNextPage}
          className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage >= totalPages}
        >
          Próxima
        </button>
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 rounded px-4 py-3 text-white shadow-md ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <FormModal
        isOpen={isModalOpen}
        taskToEdit={taskToEdit}
        solicitanteOptions={solicitanteOptions}
        projetoOptions={projetoOptions}
        responsavelOptions={responsavelOptions}
        onClose={onModalClose}
        onSave={onModalSave}
      />
    </div>
  );
}
