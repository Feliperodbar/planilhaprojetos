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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#ecfdf5_100%)] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1520px] flex-col gap-4">
        <header className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Painel de atividades
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                  Gestão de Atividades
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  Usuário:{" "}
                  <strong className="text-slate-900">{currentUser.name}</strong>{" "}
                  ({currentUser.role === "admin" ? "Administrador" : "Comum"})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md"
            >
              Sair
            </button>
          </div>
        </header>

        <nav className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between lg:p-5">
          <div className="flex flex-wrap gap-3">
            {canCreateTask && (
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Nova atividade
              </button>
            )}
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-100"
            >
              Exportar
            </button>
            {currentUser.role === "admin" && (
              <button
                type="button"
                onClick={onManageProjects}
                className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-800 transition hover:-translate-y-0.5 hover:bg-sky-100"
              >
                Gerenciar projetos
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onToggleFilters}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700"
            >
              Filtros
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
            {totalPages > 1 && (
              <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                Página {currentPage} de {totalPages}
              </p>
            )}
            <div
              className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-emerald-900 shadow-sm"
              title="Produtividade geral"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Produtividade
              </span>
              <span className="text-lg font-semibold leading-none">
                {productivityPercentage}%
              </span>
            </div>
          </div>
        </nav>

        {currentUser.role === "admin" && (
          <section className="rounded-[28px] border border-sky-100/80 bg-white/75 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                  Visão do administrador
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  Visualizando as atividades de {selectedUserName}
                </h2>
                <p className="text-sm text-slate-600">
                  Modo somente leitura para auditoria e acompanhamento.
                </p>
              </div>

              <div className="min-w-64">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Usuário selecionado
                </label>
                <select
                  value={selectedUserId}
                  onChange={(event) => onUserChange(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
          <section className="rounded-[28px] border border-emerald-100/80 bg-white/75 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Filtros
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  Refine a visualização
                </h2>
                <p className="text-sm text-slate-600">
                  Marque um ou mais campos e selecione os valores desejados.
                </p>
              </div>
              <button
                type="button"
                onClick={onClearFilters}
                className="self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700"
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

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-5">
          <MonthlyTimeline tasks={tasks} />

          <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm">
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
          </div>
        </section>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/60 bg-white/75 px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
            <button
              type="button"
              onClick={onPrevPage}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage <= 1}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={onNextPage}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage >= totalPages}
            >
              Próxima
            </button>
          </div>
        )}

        {toast && (
          <div
            className={`fixed bottom-4 right-4 z-50 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] ${
              toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
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
          onPDF={onExportPdf}
          onClose={onExportModalClose}
        />
      </div>
    </div>
  );
}
