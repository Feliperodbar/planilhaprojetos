import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx-js-style";
import type { SortConfig, SortKey } from "./components/Table";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { TaskManagerPage } from "./pages/TaskManagerPage";
import type { ProjectTask, ProjectTaskInput } from "./types/project";

const STORAGE_KEY = "project_tasks";
const ITEMS_PER_PAGE = 8;

const filterFields = [
  "solicitante",
  "projeto",
  "atividade",
  "descricao",
  "responsavel",
  "status",
] as const;

type FilterField = (typeof filterFields)[number];

type FilterState = Record<FilterField, string[]>;

interface ToastState {
  type: "success" | "error";
  message: string;
}

const defaultSortConfig: SortConfig = {
  key: "id",
  direction: "asc",
};

function getNextId(tasks: ProjectTask[]) {
  if (tasks.length === 0) {
    return 1;
  }

  return Math.max(...tasks.map((task) => task.id)) + 1;
}

function normalizeForSort(value: string | number) {
  if (typeof value === "number") {
    return value;
  }

  return value.toString().toLocaleLowerCase("pt-BR");
}

function matchesSelectedValues(value: string, selectedValues: string[]) {
  if (selectedValues.length === 0) {
    return true;
  }

  return selectedValues.includes(value);
}

function toExcelDate(value: string) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }

  const excelEpoch = Date.UTC(1899, 11, 30);
  const dateUtc = Date.UTC(year, month - 1, day);
  return (dateUtc - excelEpoch) / 86400000;
}

function hasActiveFilter(filters: FilterState, field: FilterField) {
  return filters[field].length > 0;
}

function App() {
  const [tasks, setTasks] = useLocalStorage<ProjectTask[]>(STORAGE_KEY, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ProjectTask | null>(null);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    solicitante: [],
    projeto: [],
    atividade: [],
    descricao: [],
    responsavel: [],
    status: [],
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>(defaultSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<ToastState | null>(null);

  const solicitanteOptions = useMemo(
    () => [...new Set(tasks.map((task) => task.solicitante).filter(Boolean))],
    [tasks],
  );

  const projetoOptions = useMemo(
    () => [...new Set(tasks.map((task) => task.projeto).filter(Boolean))],
    [tasks],
  );

  const responsavelOptions = useMemo(
    () => [...new Set(tasks.map((task) => task.responsavel).filter(Boolean))],
    [tasks],
  );

  const activityOptions = useMemo(
    () => [...new Set(tasks.map((task) => task.atividade).filter(Boolean))],
    [tasks],
  );

  const descricaoOptions = useMemo(
    () => [...new Set(tasks.map((task) => task.descricao).filter(Boolean))],
    [tasks],
  );

  const activeFilterCount = filterFields.reduce((count, field) => {
    if (filters[field].length > 0) {
      return count + 1;
    }

    return count;
  }, 0);

  const filteredAndSortedTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const matchesSolicitante = matchesSelectedValues(
        task.solicitante,
        filters.solicitante,
      );
      const matchesProjeto = matchesSelectedValues(
        task.projeto,
        filters.projeto,
      );
      const matchesAtividade = matchesSelectedValues(
        task.atividade,
        filters.atividade,
      );
      const matchesDescricao = matchesSelectedValues(
        task.descricao,
        filters.descricao,
      );
      const matchesResponsavel = matchesSelectedValues(
        task.responsavel,
        filters.responsavel,
      );
      const matchesStatus = matchesSelectedValues(task.status, filters.status);

      return (
        matchesSolicitante &&
        matchesProjeto &&
        matchesAtividade &&
        matchesDescricao &&
        matchesResponsavel &&
        matchesStatus
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      const firstValue = normalizeForSort(a[sortConfig.key]);
      const secondValue = normalizeForSort(b[sortConfig.key]);

      if (firstValue < secondValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (firstValue > secondValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });

    return sorted;
  }, [tasks, filters, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedTasks.length / ITEMS_PER_PAGE),
  );

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedTasks, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const handleSort = (key: SortKey) => {
    if (key === "id") {
      setSortConfig({ key: "id", direction: "asc" });
      return;
    }

    setSortConfig((previous) => {
      if (previous.key === key) {
        return {
          key,
          direction: previous.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  };

  const handleCreate = () => {
    setTaskToEdit(null);
    setShowInlineForm(true);
  };

  const handleToggleFilter = (field: FilterField, value: string) => {
    setFilters((previous) => {
      const currentValues = previous[field];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...previous,
        [field]: nextValues,
      };
    });
  };

  const handleClearFilters = () => {
    setFilters({
      solicitante: [],
      projeto: [],
      atividade: [],
      descricao: [],
      responsavel: [],
      status: [],
    });
  };

  const handleEdit = (task: ProjectTask) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleDelete = (task: ProjectTask) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir a atividade \"${task.atividade}\" (ID ${task.id})?`,
    );

    if (!confirmed) {
      return;
    }

    setTasks((previous) => previous.filter((item) => item.id !== task.id));
    setToast({ type: "success", message: "Atividade excluída com sucesso." });
  };

  const handleSave = (taskData: ProjectTaskInput) => {
    if (taskToEdit) {
      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskToEdit.id
            ? { ...task, ...taskData, id: taskToEdit.id }
            : task,
        ),
      );
      setToast({
        type: "success",
        message: "Atividade atualizada com sucesso.",
      });
    } else {
      setTasks((previous) => {
        const newTask: ProjectTask = {
          id: getNextId(previous),
          ...taskData,
        };

        return [...previous, newTask];
      });
      setToast({ type: "success", message: "Atividade criada com sucesso." });
    }

    setIsModalOpen(false);
    setShowInlineForm(false);
    setTaskToEdit(null);
  };

  const handleExportCsv = () => {
    if (filteredAndSortedTasks.length === 0) {
      setToast({
        type: "error",
        message: "Não há dados para exportar com os filtros atuais.",
      });
      return;
    }

    const headers = [
      "ID",
      "Solicitante",
      "Projeto",
      "Atividade",
      "Descrição",
      "Responsável",
      "Data início previsto",
      "Data término previsto",
      "Data início real",
      "Data término real",
      "Status",
    ];

    const rows = filteredAndSortedTasks.map((task) => [
      task.id,
      task.solicitante,
      task.projeto,
      task.atividade,
      task.descricao,
      task.responsavel,
      toExcelDate(task.dataInicioPrevisto),
      toExcelDate(task.dataTerminoPrevisto),
      toExcelDate(task.dataInicioReal),
      toExcelDate(task.dataTerminoReal),
      task.status,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Atividades");

    const colWidths = [8, 18, 18, 22, 28, 18, 18, 18, 18, 18, 16];
    ws["!cols"] = colWidths.map((width) => ({ wch: width }));
    ws["!autofilter"] = { ref: ws["!ref"] ?? "A1:K1" };

    const activeFilterColumns = new Set<number>();
    filterFields.forEach((field, index) => {
      if (hasActiveFilter(filters, field)) {
        activeFilterColumns.add(index + 1);
      }
    });

    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "0F766E" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "0F172A" } },
        bottom: { style: "thin", color: { rgb: "0F172A" } },
        left: { style: "thin", color: { rgb: "0F172A" } },
        right: { style: "thin", color: { rgb: "0F172A" } },
      },
    };

    const baseCellStyle = {
      alignment: { vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "D1D5DB" } },
        bottom: { style: "thin", color: { rgb: "D1D5DB" } },
        left: { style: "thin", color: { rgb: "D1D5DB" } },
        right: { style: "thin", color: { rgb: "D1D5DB" } },
      },
    };

    const highlightedCellStyle = {
      ...baseCellStyle,
      fill: { fgColor: { rgb: "DCFCE7" } },
    };

    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          ...headerStyle,
          fill: activeFilterColumns.has(col)
            ? { fgColor: { rgb: "065F46" } }
            : headerStyle.fill,
        };
      }
    }

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellRef]) {
          const isDateColumn = col >= 6 && col <= 9;
          const isFilteredColumn = activeFilterColumns.has(col);
          ws[cellRef].s = {
            ...(isFilteredColumn ? highlightedCellStyle : baseCellStyle),
            alignment: {
              horizontal: isDateColumn ? "center" : "left",
              vertical: "center",
              wrapText: true,
            },
          };

          if (isDateColumn && typeof ws[cellRef].v === "number") {
            ws[cellRef].z = "dd/mm/yyyy";
          }
        }
      }
    }

    XLSX.writeFile(wb, "atividades_projeto.xlsx");

    setToast({ type: "success", message: "Excel exportado com sucesso." });
  };

  return (
    <TaskManagerPage
      tasks={paginatedTasks}
      taskToEdit={taskToEdit}
      isModalOpen={isModalOpen}
      showInlineForm={showInlineForm}
      isFiltersOpen={isFiltersOpen}
      activeFilterCount={activeFilterCount}
      filters={filters}
      sortConfig={sortConfig}
      currentPage={currentPage}
      totalPages={totalPages}
      solicitanteOptions={solicitanteOptions}
      projetoOptions={projetoOptions}
      activityOptions={activityOptions}
      descricaoOptions={descricaoOptions}
      responsavelOptions={responsavelOptions}
      toast={toast}
      onToggleFilters={() => setIsFiltersOpen((previous) => !previous)}
      onToggleFilter={handleToggleFilter}
      onClearFilters={handleClearFilters}
      onSort={handleSort}
      onCreate={handleCreate}
      onExportCsv={handleExportCsv}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onModalClose={() => {
        setIsModalOpen(false);
        setTaskToEdit(null);
      }}
      onModalSave={handleSave}
      onInlineCancel={() => setShowInlineForm(false)}
      onInlineSave={handleSave}
      onPrevPage={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
      onNextPage={() =>
        setCurrentPage((previous) => Math.min(totalPages, previous + 1))
      }
    />
  );
}

export default App;
