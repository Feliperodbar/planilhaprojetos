import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SortConfig, SortKey } from "./components/Table";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { TaskManagerPage } from "./pages/TaskManagerPage";
import neoHeaderLogo from "./assets/neoheader.svg";
import type { ProjectTask, ProjectTaskInput } from "./types/project";

const STORAGE_KEY = "project_tasks";
const ITEMS_PER_PAGE = 8;

const filterFields = [
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

function escapeCsvValue(value: string | number) {
  const normalized = String(value ?? "");
  const escaped = normalized.replace(/"/g, '""');

  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}

function isTaskDelayed(task: ProjectTask, today: Date) {
  if (task.status === "Concluído" || !task.dataTerminoPrevisto) {
    return false;
  }

  const deadline = new Date(`${task.dataTerminoPrevisto}T00:00:00`);
  const normalizedToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return deadline < normalizedToday;
}

function toPercentage(partial: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((partial / total) * 100);
}

function getTaskProductivityScore(task: ProjectTask, today: Date) {
  if (task.status === "Concluído") {
    return 100;
  }

  if (isTaskDelayed(task, today)) {
    return 0;
  }

  if (task.status === "Em andamento") {
    return 60;
  }

  return 20;
}

async function loadImageDataUrl(src: string) {
  const response = await fetch(src);
  const svgText = await response.text();
  const image = new Image();

  return await new Promise<string>((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Não foi possível criar o contexto do canvas."));
        return;
      }

      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () =>
      reject(new Error("Não foi possível carregar o logo."));
    image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`;
  });
}

function App() {
  const [tasks, setTasks] = useLocalStorage<ProjectTask[]>(STORAGE_KEY, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ProjectTask | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    projeto: [],
    atividade: [],
    descricao: [],
    responsavel: [],
    status: [],
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>(defaultSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<ToastState | null>(null);

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

  const productivityPercentage = useMemo(() => {
    if (tasks.length === 0) {
      return 0;
    }

    const today = new Date();
    const totalScore = tasks.reduce((sum, task) => {
      return sum + getTaskProductivityScore(task, today);
    }, 0);

    return toPercentage(totalScore, tasks.length * 100);
  }, [tasks]);

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
    setIsModalOpen(true);
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
      task.projeto,
      task.atividade,
      task.descricao,
      task.responsavel,
      formatDate(task.dataInicioPrevisto),
      formatDate(task.dataTerminoPrevisto),
      formatDate(task.dataInicioReal),
      formatDate(task.dataTerminoReal),
      task.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = "atividades_projeto.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(downloadUrl);

    setToast({ type: "success", message: "CSV exportado com sucesso." });
  };

  const handleExportExcel = () => {
    if (filteredAndSortedTasks.length === 0) {
      setToast({
        type: "error",
        message: "Não há dados para exportar com os filtros atuais.",
      });
      return;
    }

    const headers = [
      "ID",
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
      task.projeto,
      task.atividade,
      task.descricao,
      task.responsavel,
      formatDate(task.dataInicioPrevisto),
      formatDate(task.dataTerminoPrevisto),
      formatDate(task.dataInicioReal),
      formatDate(task.dataTerminoReal),
      task.status,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Atividades");
    XLSX.writeFile(workbook, "atividades_projeto.xlsx");

    setToast({ type: "success", message: "Excel exportado com sucesso." });
  };

  const handleExportPdf = async () => {
    if (filteredAndSortedTasks.length === 0) {
      setToast({
        type: "error",
        message: "Não há dados para exportar com os filtros atuais.",
      });
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const logoDataUrl = await loadImageDataUrl(neoHeaderLogo);
      const margin = 8;
      const headerHeight = 24;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const exportDate = new Date().toLocaleDateString("pt-BR");

      const headers = [
        "ID",
        "Projeto",
        "Atividade",
        "Descrição",
        "Responsável",
        "Início Prev.",
        "Término Prev.",
        "Início Real",
        "Término Real",
        "Status",
      ];

      const rows = filteredAndSortedTasks.map((task) => [
        task.id.toString(),
        task.projeto,
        task.atividade,
        task.descricao || "-",
        task.responsavel,
        formatDate(task.dataInicioPrevisto),
        formatDate(task.dataTerminoPrevisto),
        formatDate(task.dataInicioReal),
        formatDate(task.dataTerminoReal),
        task.status,
      ]);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: margin + headerHeight + 4,
        margin: {
          top: margin + headerHeight + 4,
          left: margin,
          right: margin,
          bottom: 12,
        },
        tableWidth: "auto",
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 1.5,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          fillColor: [15, 118, 110],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          fontSize: 8,
        },
        bodyStyles: {
          textColor: [30, 41, 59],
          valign: "middle",
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [240, 253, 250],
        },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: 31 },
          2: { cellWidth: 35 },
          3: { cellWidth: 54 },
          4: { cellWidth: 29 },
          5: { cellWidth: 22, halign: "center" },
          6: { cellWidth: 22, halign: "center" },
          7: { cellWidth: 22, halign: "center" },
          8: { cellWidth: 22, halign: "center" },
          9: { cellWidth: 22, halign: "center" },
        },
        didDrawPage: () => {
          doc.addImage(logoDataUrl, "PNG", margin, margin - 1, 46, 11);

          doc.setFontSize(16);
          doc.setTextColor(15, 118, 110);
          doc.text("Gestão de Atividades", margin + 52, margin + 4);

          doc.setFontSize(11);
          doc.setTextColor(100, 116, 139);
          doc.text(`Exportado em: ${exportDate}`, margin + 52, margin + 10);

          doc.setDrawColor(226, 232, 240);
          doc.line(margin, 22, pageWidth - margin, 22);

          doc.setFontSize(10);
          doc.setTextColor(128, 128, 128);
          doc.text(
            `Página ${doc.getCurrentPageInfo().pageNumber}`,
            pageWidth - margin,
            pageHeight - 5,
            { align: "right" },
          );
        },
      });

      doc.save("atividades_projeto.pdf");
      setToast({ type: "success", message: "PDF exportado com sucesso." });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      setToast({
        type: "error",
        message: "Erro ao gerar PDF. Verifique o console.",
      });
    }
  };

  return (
    <TaskManagerPage
      tasks={paginatedTasks}
      taskToEdit={taskToEdit}
      isModalOpen={isModalOpen}
      isExportModalOpen={isExportModalOpen}
      isFiltersOpen={isFiltersOpen}
      activeFilterCount={activeFilterCount}
      filters={filters}
      sortConfig={sortConfig}
      currentPage={currentPage}
      totalPages={totalPages}
      projetoOptions={projetoOptions}
      activityOptions={activityOptions}
      descricaoOptions={descricaoOptions}
      responsavelOptions={responsavelOptions}
      productivityPercentage={productivityPercentage}
      toast={toast}
      onToggleFilters={() => setIsFiltersOpen((previous) => !previous)}
      onToggleFilter={handleToggleFilter}
      onClearFilters={handleClearFilters}
      onSort={handleSort}
      onCreate={handleCreate}
      onExport={() => setIsExportModalOpen(true)}
      onExportExcel={handleExportExcel}
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
      onExportModalClose={() => setIsExportModalOpen(false)}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onModalClose={() => {
        setIsModalOpen(false);
        setTaskToEdit(null);
      }}
      onModalSave={handleSave}
      onPrevPage={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
      onNextPage={() =>
        setCurrentPage((previous) => Math.min(totalPages, previous + 1))
      }
    />
  );
}

export default App;
