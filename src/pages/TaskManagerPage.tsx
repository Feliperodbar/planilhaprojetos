import { FormModal } from "../components/FormModal";
import { MonthlyTimeline } from "../components/MonthlyTimeline";
import { Table } from "../components/Table";
import { ExportModal } from "../components/ExportModal";
import type { SortConfig, SortKey } from "../components/Table";
import type { ProjectTask, TaskStatus } from "../types/project";
import neoHeaderLogo from "../assets/neoheader.svg";

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
  tasks: ProjectTask[];
  taskToEdit: ProjectTask | null;
  isModalOpen: boolean;
  isExportModalOpen: boolean;
  isFiltersOpen: boolean;
  activeFilterCount: number;
  filters: FilterState;
  sortConfig: SortConfig;
  currentPage: number;
  totalPages: number;
  projetoOptions: string[];
  activityOptions: string[];
  descricaoOptions: string[];
  responsavelOptions: string[];
  productivityPercentage: number;
  toast: ToastState | null;
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
  onModalClose: () => void;
  onModalSave: (task: Omit<ProjectTask, "id">) => void;
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
  tasks,
  taskToEdit,
  isModalOpen,
  isExportModalOpen,
  isFiltersOpen,
  activeFilterCount,
  filters,
  sortConfig,
  currentPage,
  totalPages,
  projetoOptions,
  activityOptions,
  descricaoOptions,
  responsavelOptions,
  productivityPercentage,
  toast,
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
            <img
              src={neoHeaderLogo}
              alt="Neoenergia"
              className="mb-1 h-10 w-auto md:h-10"
            />
            <h1 className="text-xl font-bold text-gray-800">
              Gestão de Atividades
            </h1>
          </div>
        </div>
      </header>

      <nav className="mb-4 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCreate}
            className="rounded-lg bg-emerald-600 px-2 py-1 font-medium text-white transition hover:bg-emerald-700"
          >
            Nova Atividade
          </button>
          <button
            type="button"
            onClick={onExport}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 font-medium text-emerald-800 transition hover:bg-emerald-100"
          >
            Exportar
          </button>
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
        onSort={onSort}
        onEdit={onEdit}
        onDelete={onDelete}
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
        responsavelOptions={responsavelOptions}
        onClose={onModalClose}
        onSave={onModalSave}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onExcel={onExportExcel}
        onCsv={onExportCsv}
        onPDF={onExportPdf}
        onClose={onExportModalClose}
      />
    </div>
  );
}
