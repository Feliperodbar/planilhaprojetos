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
  responsavelOptions: string[];
  onClose: () => void;
  onSave: (task: ProjectTaskInput) => void;
}

interface FormErrors {
  projeto?: string;
  atividade?: string;
  responsavel?: string;
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
  required?: boolean;
  error?: string;
}

function SelectWithNew({
  label,
  value,
  onChange,
  options,
  required,
  error,
}: SelectWithNewProps) {
  const [isNew, setIsNew] = useState(false);

  const cleanedOptions = useMemo(
    () => [...new Set(options.filter(Boolean).map((item) => item.trim()))],
    [options],
  );

  useEffect(() => {
    if (!value) {
      // eslint-disable-next-line
      setIsNew(false);
      return;
    }

    setIsNew(!cleanedOptions.includes(value));
  }, [cleanedOptions, value]);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        value={isNew ? "__novo__" : value}
        onChange={(event) => {
          if (event.target.value === "__novo__") {
            setIsNew(true);
            onChange("");
            return;
          }

          setIsNew(false);
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
        <option value="__novo__">+ Adicionar novo</option>
      </select>

      {isNew && (
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
  responsavelOptions,
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

    if (!formData.responsavel.trim()) {
      nextErrors.responsavel = "Responsável é obrigatório.";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-lg bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {taskToEdit ? "Editar atividade" : "Nova atividade"}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="activity-form"
              className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>

        <form
          id="activity-form"
          className="grid grid-cols-1 gap-3"
          onSubmit={handleSubmit}
        >
          <SelectWithNew
            label="Projeto *"
            value={formData.projeto}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, projeto: value }))
            }
            options={projetoOptions}
            required
            error={errors.projeto}
          />

          <div>
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

          <SelectWithNew
            label="Responsável *"
            value={formData.responsavel}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, responsavel: value }))
            }
            options={responsavelOptions}
            required
            error={errors.responsavel}
          />

          <div>
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
      </div>
    </div>
  );
}
