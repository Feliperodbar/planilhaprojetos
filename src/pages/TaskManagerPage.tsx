import { FormModal } from "../components/FormModal";
import { MonthlyTimeline } from "../components/MonthlyTimeline";
import { Table } from "../components/Table";
import { ExportModal } from "../components/ExportModal";
import type { SortConfig, SortKey } from "../components/Table";
import type {
  ProjectTask,
  ProjectTaskInput,
  TaskStatus,
} from "../types/project";
import type { SessionUser } from "../types/auth";
import type { UserRole } from "../types/auth";

interface ToastState {
  type: "success" | "error";
  message: string;
}

interface FilterState {
  projeto: string[];
  atividade: string[];
  descricao: string[];
  responsavel: string[];
  status: string[];
}

type FilterField = keyof FilterState;

interface TaskManagerPageProps {
  currentUser: SessionUser;
  selectedUserId: string;
  selectedUserName: string;
  userOptions: Array<{ id: string; name: string }>;
  tasks: ProjectTask[];
  taskToEdit: ProjectTask | null;
  isModalOpen: boolean;
  isExportModalOpen: boolean;
  isFiltersOpen: boolean;
  activeFilterCount: number;
  filters: FilterState;
  sortConfig: SortConfig;
  currentUserRole: UserRole;
  currentPage: number;
  totalPages: number;
  projetoOptions: string[];
  activityOptions: string[];
  descricaoOptions: string[];
  responsavelOptions: string[];
  productivityPercentage: number;
  toast: ToastState | null;
  canCreateTask: boolean;
  canCommentTask: boolean;
  allowNewProjectOption: boolean;
  exportScopeLabel: string;
  onUserChange: (userId: string) => void;
  onManageProjects: () => void;
  onLogout: () => void;
  onToggleFilters: () => void;
  onToggleFilter: (field: FilterField, value: string) => void;
  onClearFilters: () => void;
  onSort: (key: SortKey) => void;
  onCreate: () => void;
  onExport: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  onExportModalClose: () => void;
  onEdit: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
  onComment: (task: ProjectTask) => void;
  onReply: (task: ProjectTask) => void;
  onMarkCommentRead: (task: ProjectTask) => void;
  canEditTask: (task: ProjectTask) => boolean;
  canDeleteTask: (task: ProjectTask) => boolean;
  canReplyTask: (task: ProjectTask) => boolean;
  onModalClose: () => void;
  onModalSave: (task: ProjectTaskInput) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

const statusFilterOptions: TaskStatus[] = [
  "Não iniciado",
  "Em andamento",
  "Concluído",
];

const filterGroups: Array<{
  field: FilterField;
  label: string;
  options: string[];
}> = [
  { field: "projeto", label: "Projeto", options: [] },
  { field: "atividade", label: "Atividade", options: [] },
  { field: "descricao", label: "Descrição", options: [] },
  { field: "responsavel", label: "Responsável", options: [] },
  { field: "status", label: "Status", options: statusFilterOptions },
];

function FilterOptionList({
  field,
  label,
  options,
  values,
  onToggleFilter,
}: {
  field: FilterField;
  label: string;
  options: string[];
  values: string[];
  onToggleFilter: (field: FilterField, value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
      <p className="mb-3 text-sm font-semibold text-gray-800">{label}</p>
      <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
        {options.length === 0 ? (
          <p className="text-sm text-gray-500">Sem opções disponíveis.</p>
        ) : (
          options.map((option) => {
            const checked = values.includes(option);

            return (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleFilter(field, option)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="truncate">{option}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

export function TaskManagerPage({
  currentUser,
  selectedUserId,
  selectedUserName,
  userOptions,
  tasks,
  taskToEdit,
  isModalOpen,
  isExportModalOpen,
  isFiltersOpen,
  activeFilterCount,
  filters,
  sortConfig,
  currentUserRole,
  currentPage,
  totalPages,
  projetoOptions,
  activityOptions,
  descricaoOptions,
  responsavelOptions,
  productivityPercentage,
  toast,
  canCreateTask,
  canCommentTask,
  allowNewProjectOption,
  exportScopeLabel,
  onUserChange,
  onManageProjects,
  onLogout,
  onToggleFilters,
  onToggleFilter,
  onClearFilters,
  onSort,
  onCreate,
  onExport,
  onExportExcel,
  onExportCsv,
  onExportPdf,
  onExportModalClose,
  onEdit,
  onDelete,
  onComment,
  onReply,
  onMarkCommentRead,
  canEditTask,
  canDeleteTask,
  canReplyTask,
  onModalClose,
  onModalSave,
  onPrevPage,
  onNextPage,
}: TaskManagerPageProps) {
  return (
    <div className="mx-auto min-h-screen max-w-[1440px] p-4 md:p-6">
      <header className="mb-5 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm backdrop-blur md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Gestão de Atividades
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Usuário: <strong>{currentUser.name}</strong> (
              {currentUser.role === "admin" ? "Administrador" : "Comum"})
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="self-start rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            Sair
          </button>
        </div>
      </header>

      <nav className="mb-4 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {canCreateTask && (
            <button
              type="button"
              onClick={onCreate}
              className="rounded-lg bg-emerald-600 px-2 py-1 font-medium text-white transition hover:bg-emerald-700"
            >
              Nova Atividade
            </button>
          )}
          <button
            type="button"
            onClick={onExport}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 font-medium text-emerald-800 transition hover:bg-emerald-100"
          >
            Exportar
          </button>
          {currentUser.role === "admin" && (
            <button
              type="button"
              onClick={onManageProjects}
              className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 font-medium text-blue-800 transition hover:bg-blue-100"
            >
              Gerenciar Projetos
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleFilters}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 font-medium text-gray-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            Filtros
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
          {totalPages > 1 && (
            <p className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </p>
          )}
          <div
            className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900"
            title="Produtividade geral"
          >
            <span className="text-xl font-semibold leading-none">
              {productivityPercentage}%
            </span>
          </div>
        </div>
      </nav>

      {currentUser.role === "admin" && (
        <section className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Visão do administrador
              </h2>
              <p className="text-sm text-gray-600">
                Visualizando as atividades de{" "}
                <strong>{selectedUserName}</strong> em modo somente leitura.
              </p>
            </div>

            <div className="min-w-64">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Usuário selecionado
              </label>
              <select
                value={selectedUserId}
                onChange={(event) => onUserChange(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                {userOptions.map((userOption) => (
                  <option key={userOption.id} value={userOption.id}>
                    {userOption.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      {isFiltersOpen && (
        <section className="mb-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
              <p className="text-sm text-gray-600">
                Marque um ou mais campos e selecione os valores desejados.
              </p>
            </div>
            <button
              type="button"
              onClick={onClearFilters}
              className="self-start rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              Limpar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filterGroups.map((group) => {
              const options =
                group.field === "projeto"
                  ? projetoOptions
                  : group.field === "atividade"
                    ? activityOptions
                    : group.field === "descricao"
                      ? descricaoOptions
                      : group.field === "responsavel"
                        ? responsavelOptions
                        : group.options;

              return (
                <FilterOptionList
                  key={group.field}
                  field={group.field}
                  label={group.label}
                  options={options}
                  values={filters[group.field]}
                  onToggleFilter={onToggleFilter}
                />
              );
            })}
          </div>
        </section>
      )}

      <MonthlyTimeline tasks={tasks} />

      <Table
        tasks={tasks}
        sortConfig={sortConfig}
        currentUserRole={currentUserRole}
        onSort={onSort}
        onEdit={onEdit}
        onDelete={onDelete}
        onComment={onComment}
        onReply={onReply}
        onMarkCommentRead={onMarkCommentRead}
        canEditTask={canEditTask}
        canDeleteTask={canDeleteTask}
        canReplyTask={canReplyTask}
        canCommentTask={canCommentTask}
      />

      {totalPages > 1 && (
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
      )}

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
        projetoOptions={projetoOptions}
        allowNewProjectOption={allowNewProjectOption}
        onClose={onModalClose}
        onSave={onModalSave}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        scopeLabel={exportScopeLabel}
        onExcel={onExportExcel}
        onCsv={onExportCsv}
        onPDF={onExportPdf}
        onClose={onExportModalClose}
      />
    </div>
  );
}
