import { useEffect, useMemo, useState } from "react";
import type { SortConfig, SortKey } from "./components/Table";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { TaskManagerPage } from "./pages/TaskManagerPage";
import type {
  ProjectTask,
  ProjectTaskInput,
  TaskStatus,
} from "./types/project";

const STORAGE_KEY = "project_tasks";
const ITEMS_PER_PAGE = 8;

interface ToastState {
  type: "success" | "error";
  message: string;
}

const defaultSortConfig: SortConfig = {
  key: "id",
  direction: "asc",
};

const initialTaskInput: ProjectTaskInput = {
  solicitante: "",
  projeto: "",
  atividade: "",
  descricao: "",
  responsavel: "",
  dataInicioPrevisto: "",
  dataTerminoPrevisto: "",
  dataInicioReal: "",
  dataTerminoReal: "",
  status: "Não iniciado",
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

function escapeCsvValue(value: string | number) {
  const formatted = String(value ?? "").replaceAll('"', '""');
  return `"${formatted}"`;
}

function App() {
  const [tasks, setTasks] = useLocalStorage<ProjectTask[]>(STORAGE_KEY, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ProjectTask | null>(null);
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newTaskDraft, setNewTaskDraft] = useState<ProjectTaskInput>(initialTaskInput);
  const [newTaskErrors, setNewTaskErrors] = useState<{
    projeto?: string;
    atividade?: string;
    responsavel?: string;
  }>({});
  const [statusFilter, setStatusFilter] = useState<"Todos" | TaskStatus>(
    "Todos",
  );
  const [responsavelFilter, setResponsavelFilter] = useState("Todos");
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

  const filteredAndSortedTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const matchesStatus =
        statusFilter === "Todos" || task.status === statusFilter;
      const matchesResponsavel =
        responsavelFilter === "Todos" || task.responsavel === responsavelFilter;

      return matchesStatus && matchesResponsavel;
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
  }, [tasks, statusFilter, responsavelFilter, sortConfig]);

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
  }, [statusFilter, responsavelFilter]);

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
    setIsModalOpen(false);
    setCurrentPage(1);
    setIsCreatingInline(true);
    setNewTaskDraft(initialTaskInput);
    setNewTaskErrors({});
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
    setIsCreatingInline(false);
    setTaskToEdit(null);
  };

  const handleNewTaskChange = (field: keyof ProjectTaskInput, value: string) => {
    setNewTaskDraft((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (field === "projeto" || field === "atividade" || field === "responsavel") {
      setNewTaskErrors((previous) => ({ ...previous, [field]: undefined }));
    }
  };

  const handleCreateInlineCancel = () => {
    setIsCreatingInline(false);
    setNewTaskDraft(initialTaskInput);
    setNewTaskErrors({});
  };

  const handleCreateInlineSave = () => {
    const nextErrors: {
      projeto?: string;
      atividade?: string;
      responsavel?: string;
    } = {};

    if (!newTaskDraft.projeto.trim()) {
      nextErrors.projeto = "Projeto é obrigatório.";
    }

    if (!newTaskDraft.atividade.trim()) {
      nextErrors.atividade = "Atividade é obrigatória.";
    }

    if (!newTaskDraft.responsavel.trim()) {
      nextErrors.responsavel = "Responsável é obrigatório.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setNewTaskErrors(nextErrors);
      setToast({ type: "error", message: "Preencha os campos obrigatórios." });
      return;
    }

    handleSave({
      ...newTaskDraft,
      solicitante: newTaskDraft.solicitante.trim(),
      projeto: newTaskDraft.projeto.trim(),
      atividade: newTaskDraft.atividade.trim(),
      descricao: newTaskDraft.descricao.trim(),
      responsavel: newTaskDraft.responsavel.trim(),
    });

    setNewTaskDraft(initialTaskInput);
    setNewTaskErrors({});
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
      task.dataInicioPrevisto,
      task.dataTerminoPrevisto,
      task.dataInicioReal,
      task.dataTerminoReal,
      task.status,
    ]);

    const csvContent = [
      headers.map((header) => escapeCsvValue(header)).join(","),
      ...rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "atividades_projeto.csv";
    link.click();

    window.URL.revokeObjectURL(url);

    setToast({ type: "success", message: "CSV exportado com sucesso." });
  };

  return (
    <TaskManagerPage
      tasks={paginatedTasks}
      taskToEdit={taskToEdit}
      isModalOpen={isModalOpen}
      isCreatingInline={isCreatingInline}
      newTaskDraft={newTaskDraft}
      newTaskErrors={newTaskErrors}
      statusFilter={statusFilter}
      responsavelFilter={responsavelFilter}
      sortConfig={sortConfig}
      currentPage={currentPage}
      totalPages={totalPages}
      solicitanteOptions={solicitanteOptions}
      projetoOptions={projetoOptions}
      responsavelOptions={responsavelOptions}
      toast={toast}
      onStatusFilterChange={setStatusFilter}
      onResponsavelFilterChange={setResponsavelFilter}
      onSort={handleSort}
      onCreate={handleCreate}
      onExportCsv={handleExportCsv}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onNewTaskChange={handleNewTaskChange}
      onCreateInlineSave={handleCreateInlineSave}
      onCreateInlineCancel={handleCreateInlineCancel}
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
