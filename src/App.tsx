import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SortConfig, SortKey } from "./components/Table";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { TaskManagerPage } from "./pages/TaskManagerPage";
import { AuthGate } from "./components/AuthGate";
import { ProjectOptionsModal } from "./components/ProjectOptionsModal";
import { AdminCommentModal } from "./components/AdminCommentModal";
import { UserReplyModal } from "./components/UserReplyModal";
import type { ProjectTask, ProjectTaskInput } from "./types/project";
import type { SessionState, SessionUser, UserAccount } from "./types/auth";
import {
  canCommentTask,
  canCreateProjectOption,
  canCreateTask,
  canDeleteProjectOption,
  canDeleteTask,
  canEditTask,
  canExportUserData,
  canViewTask,
} from "./utils/permissions";

const STORAGE_KEY = "project_tasks";
const PROJECT_OPTIONS_KEY = "project_options";
const AUTH_ACCOUNTS_KEY = "auth_accounts";
const AUTH_SESSION_KEY = "auth_session";
const ITEMS_PER_PAGE = 8;

const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: "user-felipe",
    name: "Felipe",
    email: "felipe@email.com",
    password: "123456",
    role: "user",
  },
  {
    id: "admin-felipe",
    name: "Felipeadm",
    email: "felipe@email.com",
    password: "123456",
    role: "admin",
  },
];

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

interface LegacyProjectTask {
  id: number;
  solicitante: string;
  projeto: string;
  atividade: string;
  descricao: string;
  responsavel: string;
  dataInicioPrevisto: string;
  dataTerminoPrevisto: string;
  dataInicioReal: string;
  dataTerminoReal: string;
  status: ProjectTask["status"];
  ownerId?: string;
  ownerName?: string;
  adminComments?: Array<{
    id: string;
    text: string;
    createdAt: string;
    createdById: string;
    createdByName: string;
  }>;
  adminComment?: ProjectTask["adminComment"];
}

const defaultSortConfig: SortConfig = {
  key: "id",
  direction: "asc",
};

function toSessionUser(account: UserAccount): SessionUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
  };
}

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

function normalizeProjectOptions(options: string[]) {
  return [...new Set(options.map((option) => option.trim()).filter(Boolean))];
}

function getSafeFilenamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function createCommentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function App() {
  const [accounts] = useLocalStorage<UserAccount[]>(
    AUTH_ACCOUNTS_KEY,
    INITIAL_ACCOUNTS,
  );
  const [session, setSession] = useLocalStorage<SessionState | null>(
    AUTH_SESSION_KEY,
    null,
  );
  const [tasks, setTasks] = useLocalStorage<ProjectTask[]>(STORAGE_KEY, []);
  const [projectOptions, setProjectOptions] = useLocalStorage<string[]>(
    PROJECT_OPTIONS_KEY,
    [],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isProjectOptionsOpen, setIsProjectOptionsOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [commentTargetTask, setCommentTargetTask] =
    useState<ProjectTask | null>(null);
  const [replyTargetTask, setReplyTargetTask] = useState<ProjectTask | null>(
    null,
  );
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
  const [selectedUserId, setSelectedUserId] = useState(
    () => INITIAL_ACCOUNTS.find((account) => account.role === "user")?.id ?? "",
  );
  const [toast, setToast] = useState<ToastState | null>(null);

  const currentUser = session?.user ?? null;

  const userAccounts = useMemo(
    () => accounts.filter((account) => account.role === "user"),
    [accounts],
  );

  useEffect(() => {
    setTasks((previous) => {
      if (previous.length === 0) {
        return previous;
      }

      const fallbackUser = currentUser
        ? currentUser
        : userAccounts[0]
          ? toSessionUser(userAccounts[0])
          : toSessionUser(INITIAL_ACCOUNTS[0]);

      let changed = false;

      const migrated = previous.map((rawTask) => {
        const task = rawTask as unknown as LegacyProjectTask;
        const legacySingleComment = task.adminComment ?? null;
        const legacyCommentsArray = Array.isArray(task.adminComments)
          ? task.adminComments
          : [];
        const migratedComment =
          legacySingleComment ?? legacyCommentsArray.at(-1) ?? null;

        const nextTask: ProjectTask = {
          ...task,
          ownerId: task.ownerId || fallbackUser.id,
          ownerName: task.ownerName || fallbackUser.name,
          adminComment: migratedComment,
        };

        if (
          !task.ownerId ||
          !task.ownerName ||
          task.adminComment === undefined ||
          Array.isArray(task.adminComments)
        ) {
          changed = true;
        }

        return nextTask;
      });

      if (!changed) {
        return previous;
      }

      return migrated;
    });
  }, [currentUser, setTasks, userAccounts]);

  useEffect(() => {
    setProjectOptions((previous) => {
      if (previous.length > 0) {
        const normalized = normalizeProjectOptions(previous);
        if (normalized.length === previous.length) {
          return previous;
        }
        return normalized;
      }

      const fromTasks = normalizeProjectOptions(
        tasks.map((task) => task.projeto),
      );
      return fromTasks;
    });
  }, [setProjectOptions, tasks]);

  const targetUserId = useMemo(() => {
    if (!currentUser) {
      return "";
    }

    if (currentUser.role === "user") {
      return currentUser.id;
    }

    const selectedExists = userAccounts.some(
      (account) => account.id === selectedUserId,
    );
    if (selectedExists) {
      return selectedUserId;
    }

    return userAccounts[0]?.id ?? "";
  }, [currentUser, selectedUserId, userAccounts]);

  const targetUser = useMemo(() => {
    if (!targetUserId) {
      return null;
    }

    return accounts.find((account) => account.id === targetUserId) ?? null;
  }, [accounts, targetUserId]);

  const scopedTasks = useMemo(() => {
    if (!currentUser || !targetUserId) {
      return [];
    }

    return tasks.filter((task) => canViewTask(currentUser, task, targetUserId));
  }, [currentUser, targetUserId, tasks]);

  const projetoOptions = useMemo(
    () => normalizeProjectOptions(projectOptions),
    [projectOptions],
  );

  const responsavelOptions = useMemo(
    () => [
      ...new Set(scopedTasks.map((task) => task.responsavel).filter(Boolean)),
    ],
    [scopedTasks],
  );

  const activityOptions = useMemo(
    () => [
      ...new Set(scopedTasks.map((task) => task.atividade).filter(Boolean)),
    ],
    [scopedTasks],
  );

  const descricaoOptions = useMemo(
    () => [
      ...new Set(scopedTasks.map((task) => task.descricao).filter(Boolean)),
    ],
    [scopedTasks],
  );

  const activeFilterCount = filterFields.reduce((count, field) => {
    if (filters[field].length > 0) {
      return count + 1;
    }

    return count;
  }, 0);

  const filteredAndSortedTasks = useMemo(() => {
    const filtered = scopedTasks.filter((task) => {
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
  }, [scopedTasks, filters, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedTasks.length / ITEMS_PER_PAGE),
  );

  const effectiveCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTasks = useMemo(() => {
    const start = (effectiveCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [effectiveCurrentPage, filteredAndSortedTasks]);

  const productivityPercentage = useMemo(() => {
    if (scopedTasks.length === 0) {
      return 0;
    }

    const today = new Date();
    const totalScore = scopedTasks.reduce((sum, task) => {
      return sum + getTaskProductivityScore(task, today);
    }, 0);

    return toPercentage(totalScore, scopedTasks.length * 100);
  }, [scopedTasks]);

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
    if (!currentUser || !canCreateTask(currentUser)) {
      setToast({
        type: "error",
        message: "Seu perfil não pode criar atividades.",
      });
      return;
    }

    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleToggleFilter = (field: FilterField, value: string) => {
    setCurrentPage(1);
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
    setCurrentPage(1);
    setFilters({
      projeto: [],
      atividade: [],
      descricao: [],
      responsavel: [],
      status: [],
    });
  };

  const handleEdit = (task: ProjectTask) => {
    if (!currentUser || !canEditTask(currentUser, task)) {
      setToast({
        type: "error",
        message: "Seu perfil não pode editar esta atividade.",
      });
      return;
    }

    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleDelete = (task: ProjectTask) => {
    if (!currentUser || !canDeleteTask(currentUser, task)) {
      setToast({
        type: "error",
        message: "Seu perfil não pode excluir esta atividade.",
      });
      return;
    }

    const confirmed = window.confirm(
      `Deseja realmente excluir a atividade "${task.atividade}" (ID ${task.id})?`,
    );

    if (!confirmed) {
      return;
    }

    setTasks((previous) => previous.filter((item) => item.id !== task.id));
    setToast({ type: "success", message: "Atividade excluída com sucesso." });
  };

  const handleSave = (taskData: ProjectTaskInput) => {
    if (!currentUser || !canCreateTask(currentUser)) {
      setToast({
        type: "error",
        message: "Seu perfil não pode salvar atividades.",
      });
      return;
    }

    if (!projetoOptions.includes(taskData.projeto.trim())) {
      setToast({
        type: "error",
        message:
          "Projeto inválido. Selecione um projeto cadastrado pelo administrador.",
      });
      return;
    }

    const normalizedTaskData: ProjectTaskInput = {
      ...taskData,
      responsavel: currentUser.name,
    };

    if (taskToEdit) {
      if (!canEditTask(currentUser, taskToEdit)) {
        setToast({
          type: "error",
          message: "Seu perfil não pode editar esta atividade.",
        });
        return;
      }

      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskToEdit.id
            ? {
                ...task,
                ...normalizedTaskData,
                id: taskToEdit.id,
                ownerId: task.ownerId,
                ownerName: task.ownerName,
                adminComment: task.adminComment,
              }
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
          ownerId: currentUser.id,
          ownerName: currentUser.name,
          adminComment: null,
          ...normalizedTaskData,
        };

        return [...previous, newTask];
      });
      setToast({ type: "success", message: "Atividade criada com sucesso." });
    }

    setIsModalOpen(false);
    setTaskToEdit(null);
  };

  const exportUserName = targetUser?.name ?? currentUser?.name ?? "usuario";
  const exportFilename = `atividades_${getSafeFilenamePart(exportUserName) || "usuario"}`;

  const getExportRows = () => {
    return filteredAndSortedTasks.map((task) => [
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
      task.adminComment?.text || "-",
      task.adminComment?.userReply?.text || "-",
    ]);
  };

  const ensureExportPermission = () => {
    if (!currentUser || !targetUserId) {
      return false;
    }

    if (!canExportUserData(currentUser, targetUserId)) {
      setToast({
        type: "error",
        message: "Seu perfil não pode exportar este conjunto de dados.",
      });
      return false;
    }

    return true;
  };

  const handleExportExcel = () => {
    if (!ensureExportPermission()) {
      return;
    }

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
      "Comentários admin",
      "Resposta do usuário",
    ];

    const rows = getExportRows();

    const exportedAt = new Date().toLocaleString("pt-BR");
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Gestão de Atividades"],
      [
        `${filteredAndSortedTasks.length} registro(s) • Exportado em ${exportedAt}`,
      ],
      [],
      headers,
      ...rows,
    ]) as XLSX.WorkSheet & {
      [cell: string]: any;
      "!cols"?: Array<{ wch: number }>;
      "!rows"?: Array<{ hpt: number }>;
      "!merges"?: Array<{
        s: { r: number; c: number };
        e: { r: number; c: number };
      }>;
    };

    const totalColumns = headers.length;
    const lastColumn = totalColumns - 1;
    const titleRow = 1;
    const subtitleRow = 2;
    const headerRow = 4;
    const dataStartRow = 5;

    worksheet["!merges"] = [
      { s: { r: titleRow - 1, c: 0 }, e: { r: titleRow - 1, c: lastColumn } },
      {
        s: { r: subtitleRow - 1, c: 0 },
        e: { r: subtitleRow - 1, c: lastColumn },
      },
    ];

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 28 },
      { wch: 42 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
    ];

    worksheet["!rows"] = [{ hpt: 24 }, { hpt: 20 }, { hpt: 8 }, { hpt: 22 }];

    const setCellStyle = (address: string, style: Record<string, unknown>) => {
      if (!worksheet[address]) {
        return;
      }

      worksheet[address].s = style;
    };

    const border = {
      top: { style: "thin", color: { rgb: "D6EAD8" } },
      bottom: { style: "thin", color: { rgb: "D6EAD8" } },
      left: { style: "thin", color: { rgb: "D6EAD8" } },
      right: { style: "thin", color: { rgb: "D6EAD8" } },
    } as const;

    const titleStyle = {
      fill: { fgColor: { rgb: "047857" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
      alignment: { horizontal: "center", vertical: "center" },
    };

    const subtitleStyle = {
      fill: { fgColor: { rgb: "ECFDF5" } },
      font: { color: { rgb: "065F46" }, italic: true, sz: 10 },
      alignment: { horizontal: "center", vertical: "center" },
    };

    const headerStyle = {
      fill: { fgColor: { rgb: "10B981" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border,
    };

    const baseRowFill = "FFFFFF";
    const zebraRowFill = "F8FFFC";
    const completedStatusFill = "D1FAE5";
    const inProgressStatusFill = "FEF3C7";
    const pendingStatusFill = "E5E7EB";

    setCellStyle("A1", titleStyle);
    setCellStyle("A2", subtitleStyle);

    for (let columnIndex = 0; columnIndex < totalColumns; columnIndex += 1) {
      const cellAddress = XLSX.utils.encode_cell({
        r: headerRow - 1,
        c: columnIndex,
      });
      setCellStyle(cellAddress, headerStyle);
    }

    const today = new Date();

    rows.forEach((_, rowIndex) => {
      const task = filteredAndSortedTasks[rowIndex];
      const worksheetRow = dataStartRow + rowIndex - 1;
      const isEvenRow = rowIndex % 2 === 0;
      const rowFill = isEvenRow ? baseRowFill : zebraRowFill;
      const isDelayedTask =
        Boolean(task?.dataTerminoPrevisto) &&
        task?.status !== "Concluído" &&
        new Date(`${task.dataTerminoPrevisto}T00:00:00`) <
          new Date(today.getFullYear(), today.getMonth(), today.getDate());

      for (let columnIndex = 0; columnIndex < totalColumns; columnIndex += 1) {
        const cellAddress = XLSX.utils.encode_cell({
          r: worksheetRow,
          c: columnIndex,
        });
        const cell = worksheet[cellAddress];

        if (!cell) {
          continue;
        }

        const isDateColumn = columnIndex >= 5 && columnIndex <= 8;
        const isStatusColumn = columnIndex === 9;
        const isTextColumn = columnIndex === 2 || columnIndex === 3;

        let fillColor = rowFill;

        if (isStatusColumn) {
          const status = String(cell.v ?? "");
          if (status === "Concluído") {
            fillColor = completedStatusFill;
          } else if (status === "Em andamento") {
            fillColor = inProgressStatusFill;
          } else if (status === "Não iniciado") {
            fillColor = pendingStatusFill;
          }
          if (isDelayedTask) {
            fillColor = "FECACA";
          }
        }

        if (isDelayedTask && !isStatusColumn) {
          fillColor = "FEF2F2";
        }

        cell.s = {
          fill: { fgColor: { rgb: fillColor } },
          font: {
            color: { rgb: isStatusColumn ? "1F2937" : "111827" },
            bold: isStatusColumn,
          },
          alignment: {
            horizontal:
              isDateColumn || columnIndex === 0 || isStatusColumn
                ? "center"
                : "left",
            vertical: "center",
            wrapText: isTextColumn,
          },
          border,
        };
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Atividades");
    XLSX.writeFile(workbook, `${exportFilename}.xlsx`);

    setToast({ type: "success", message: "Excel exportado com sucesso." });
  };

  const handleExportPdf = async () => {
    if (!ensureExportPermission()) {
      return;
    }

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
        "Comentários",
        "Resposta",
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
        task.adminComment?.text || "-",
        task.adminComment?.userReply?.text || "-",
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
        didDrawPage: () => {
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

      doc.save(`${exportFilename}.pdf`);
      setToast({ type: "success", message: "PDF exportado com sucesso." });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      setToast({
        type: "error",
        message: "Erro ao gerar PDF. Verifique o console.",
      });
    }
  };

  const handleAddProjectOption = (projectName: string) => {
    if (!currentUser || !canCreateProjectOption(currentUser)) {
      setToast({
        type: "error",
        message: "Seu perfil não pode adicionar projetos.",
      });
      return;
    }

    setProjectOptions((previous) => {
      const merged = normalizeProjectOptions([...previous, projectName]);
      return merged;
    });

    setToast({ type: "success", message: "Projeto adicionado com sucesso." });
  };

  const handleRemoveProjectOption = (projectName: string) => {
    if (!currentUser || !canDeleteProjectOption(currentUser)) {
      setToast({
        type: "error",
        message: "Seu perfil não pode remover projetos.",
      });
      return;
    }

    const isInUse = tasks.some((task) => task.projeto === projectName);
    if (isInUse) {
      setToast({
        type: "error",
        message:
          "Não é possível remover: projeto já está em uso em atividades.",
      });
      return;
    }

    setProjectOptions((previous) =>
      previous.filter((option) => option !== projectName),
    );
    setToast({ type: "success", message: "Projeto removido com sucesso." });
  };

  const handleOpenCommentModal = (task: ProjectTask) => {
    if (!currentUser || !canCommentTask(currentUser)) {
      setToast({
        type: "error",
        message: "Seu perfil não pode comentar atividades.",
      });
      return;
    }

    setCommentTargetTask(task);
    setIsCommentModalOpen(true);
  };

  const handleSaveComment = (text: string) => {
    if (!currentUser || !commentTargetTask || !canCommentTask(currentUser)) {
      return;
    }

    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== commentTargetTask.id) {
          return task;
        }

        return {
          ...task,
          adminComment: {
            id: task.adminComment?.id ?? createCommentId(),
            text,
            createdAt: new Date().toISOString(),
            createdById: currentUser.id,
            createdByName: currentUser.name,
            userReadAt: undefined,
            userReply: undefined,
          },
        };
      }),
    );

    setToast({ type: "success", message: "Comentário salvo com sucesso." });
    setCommentTargetTask(null);
  };

  const handleOpenReplyModal = (task: ProjectTask) => {
    if (!currentUser || !canEditTask(currentUser, task) || !task.adminComment) {
      setToast({
        type: "error",
        message: "Não há comentário do administrador para responder.",
      });
      return;
    }

    setReplyTargetTask(task);
    setIsReplyModalOpen(true);
  };

  const handleSaveReply = (text: string) => {
    if (!currentUser || !replyTargetTask) {
      return;
    }

    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== replyTargetTask.id || !task.adminComment) {
          return task;
        }

        return {
          ...task,
          adminComment: {
            ...task.adminComment,
            userReadAt: new Date().toISOString(),
            userReply: {
              text,
              createdAt: new Date().toISOString(),
              createdById: currentUser.id,
              createdByName: currentUser.name,
            },
          },
        };
      }),
    );

    setToast({ type: "success", message: "Resposta enviada com sucesso." });
    setReplyTargetTask(null);
  };

  const handleMarkCommentRead = (taskToMark: ProjectTask) => {
    if (!currentUser || !canEditTask(currentUser, taskToMark)) {
      return;
    }

    setTasks((previous) =>
      previous.map((task) => {
        if (
          task.id !== taskToMark.id ||
          !task.adminComment ||
          task.adminComment.userReadAt
        ) {
          return task;
        }

        return {
          ...task,
          adminComment: {
            ...task.adminComment,
            userReadAt: new Date().toISOString(),
          },
        };
      }),
    );
  };

  const handleLogin = (account: UserAccount) => {
    setSession({ user: toSessionUser(account) });
    setToast({ type: "success", message: `Bem-vindo, ${account.name}.` });
  };

  const handleLogout = () => {
    setSession(null);
    setTaskToEdit(null);
    setIsModalOpen(false);
    setFilters({
      projeto: [],
      atividade: [],
      descricao: [],
      responsavel: [],
      status: [],
    });
  };

  if (!currentUser) {
    return <AuthGate accounts={accounts} onLogin={handleLogin} />;
  }

  const exportScopeLabel =
    currentUser.role === "admin"
      ? `Atividades de ${targetUser?.name ?? "Colaborador selecionado"}`
      : `Minhas atividades (${currentUser.name})`;

  return (
    <>
      <TaskManagerPage
        currentUser={currentUser}
        selectedUserId={targetUserId}
        selectedUserName={targetUser?.name ?? "Sem usuário selecionado"}
        userOptions={userAccounts.map((account) => ({
          id: account.id,
          name: account.name,
        }))}
        tasks={paginatedTasks}
        taskToEdit={taskToEdit}
        isModalOpen={isModalOpen}
        isExportModalOpen={isExportModalOpen}
        isFiltersOpen={isFiltersOpen}
        activeFilterCount={activeFilterCount}
        filters={filters}
        sortConfig={sortConfig}
        currentPage={effectiveCurrentPage}
        totalPages={totalPages}
        projetoOptions={projetoOptions}
        activityOptions={activityOptions}
        descricaoOptions={descricaoOptions}
        responsavelOptions={responsavelOptions}
        productivityPercentage={productivityPercentage}
        toast={toast}
        canCreateTask={canCreateTask(currentUser)}
        canCommentTask={canCommentTask(currentUser)}
        allowNewProjectOption={false}
        exportScopeLabel={exportScopeLabel}
        onUserChange={(userId) => {
          setSelectedUserId(userId);
          setCurrentPage(1);
          setFilters({
            projeto: [],
            atividade: [],
            descricao: [],
            responsavel: [],
            status: [],
          });
        }}
        onManageProjects={() => setIsProjectOptionsOpen(true)}
        onLogout={handleLogout}
        onToggleFilters={() => setIsFiltersOpen((previous) => !previous)}
        onToggleFilter={handleToggleFilter}
        onClearFilters={handleClearFilters}
        onSort={handleSort}
        onCreate={handleCreate}
        onExport={() => setIsExportModalOpen(true)}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        onExportModalClose={() => setIsExportModalOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onComment={handleOpenCommentModal}
        onReply={handleOpenReplyModal}
        onMarkCommentRead={handleMarkCommentRead}
        currentUserRole={currentUser.role}
        canEditTask={(task) => canEditTask(currentUser, task)}
        canDeleteTask={(task) => canDeleteTask(currentUser, task)}
        canReplyTask={(task) =>
          canEditTask(currentUser, task) && Boolean(task.adminComment)
        }
        onModalClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }}
        onModalSave={handleSave}
        onPrevPage={() =>
          setCurrentPage((previous) =>
            Math.max(1, Math.min(previous, totalPages) - 1),
          )
        }
        onNextPage={() =>
          setCurrentPage((previous) =>
            Math.min(totalPages, Math.min(previous, totalPages) + 1),
          )
        }
      />

      <ProjectOptionsModal
        isOpen={isProjectOptionsOpen}
        options={projetoOptions}
        onClose={() => setIsProjectOptionsOpen(false)}
        onAdd={handleAddProjectOption}
        onRemove={handleRemoveProjectOption}
      />

      <AdminCommentModal
        isOpen={isCommentModalOpen}
        task={commentTargetTask}
        onClose={() => {
          setIsCommentModalOpen(false);
          setCommentTargetTask(null);
        }}
        onSave={handleSaveComment}
      />

      <UserReplyModal
        isOpen={isReplyModalOpen}
        task={replyTargetTask}
        onClose={() => {
          setIsReplyModalOpen(false);
          setReplyTargetTask(null);
        }}
        onSave={handleSaveReply}
      />
    </>
  );
}

export default App;
