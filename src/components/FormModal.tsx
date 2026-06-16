import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type {
  ProjectTask,
  ProjectTaskInput,
  TaskStatus,
} from "../types/project";

interface FormModalProps {
  isOpen: boolean;
  taskToEdit: ProjectTask | null;
  projetoOptions: string[];
  allowNewProjectOption: boolean;
  onClose: () => void;
  onSave: (task: ProjectTaskInput) => void;
}

interface FormErrors {
  projeto?: string;
  atividade?: string;
}

const statusOptions: TaskStatus[] = [
  "Não iniciado",
  "Em andamento",
  "Concluído",
];

const initialFormData: ProjectTaskInput = {
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

interface SelectWithNewProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allowNewOption?: boolean;
  required?: boolean;
  error?: string;
}

function SelectWithNew({
  label,
  value,
  onChange,
  options,
  allowNewOption = true,
  required,
  error,
}: SelectWithNewProps) {
  const [isCreatingNewOption, setIsCreatingNewOption] = useState(false);

  const cleanedOptions = useMemo(
    () => [...new Set(options.filter(Boolean).map((item) => item.trim()))],
    [options],
  );

  const isCustomValue =
    allowNewOption && value !== "" && !cleanedOptions.includes(value);
  const showNewInput = isCreatingNewOption || isCustomValue;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        value={showNewInput ? "__novo__" : value}
        onChange={(event) => {
          if (!allowNewOption) {
            onChange(event.target.value);
            return;
          }

          if (event.target.value === "__novo__") {
            setIsCreatingNewOption(true);
            onChange("");
            return;
          }

          setIsCreatingNewOption(false);
          onChange(event.target.value);
        }}
        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
      >
        <option value="">Selecione</option>
        {cleanedOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        {allowNewOption && <option value="__novo__">+ Adicionar novo</option>}
      </select>

      {showNewInput && (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          placeholder={`Digite um novo ${label.toLowerCase()}`}
        />
      )}

      {required && error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export function FormModal({
  isOpen,
  taskToEdit,
  projetoOptions,
  allowNewProjectOption,
  onClose,
  onSave,
}: FormModalProps) {
  const [formData, setFormData] = useState<ProjectTaskInput>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (taskToEdit) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...taskWithoutId } = taskToEdit;
      // eslint-disable-next-line
      setFormData(taskWithoutId);
      setErrors({});
      return;
    }

    setFormData(initialFormData);
    setErrors({});
  }, [isOpen, taskToEdit]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!formData.projeto.trim()) {
      nextErrors.projeto = "Projeto é obrigatório.";
    }

    if (!formData.atividade.trim()) {
      nextErrors.atividade = "Atividade é obrigatória.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      ...formData,
      solicitante: formData.solicitante.trim(),
      projeto: formData.projeto.trim(),
      atividade: formData.atividade.trim(),
      descricao: formData.descricao.trim(),
      responsavel: formData.responsavel.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-2 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="mt-4 w-full max-w-xl rounded-t-3xl bg-white p-4 shadow-lg sm:mt-0 sm:rounded-2xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {taskToEdit ? "Editar atividade" : "Nova atividade"}
          </h2>
        </div>

        <form
          id="activity-form"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <div className="sm:col-span-2">
            <SelectWithNew
              label="Projeto *"
              value={formData.projeto}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, projeto: value }))
              }
              options={projetoOptions}
              allowNewOption={allowNewProjectOption}
              required
              error={errors.projeto}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Atividade *
            </label>
            <input
              type="text"
              value={formData.atividade}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  atividade: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Informe a atividade"
            />
            {errors.atividade && (
              <p className="mt-1 text-sm text-red-600">{errors.atividade}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Descrição
            </label>
            <textarea
              rows={3}
              value={formData.descricao}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  descricao: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Detalhes da atividade"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Data início previsto
            </label>
            <input
              type="date"
              value={formData.dataInicioPrevisto}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  dataInicioPrevisto: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Data término previsto
            </label>
            <input
              type="date"
              value={formData.dataTerminoPrevisto}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  dataTerminoPrevisto: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Data início real
            </label>
            <input
              type="date"
              value={formData.dataInicioReal}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  dataInicioReal: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Data término real
            </label>
            <input
              type="date"
              value={formData.dataTerminoReal}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  dataTerminoReal: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  status: event.target.value as TaskStatus,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </form>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            form="activity-form"
            type="submit"
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 sm:w-auto"
          >
            {taskToEdit ? "Atualizar" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}
