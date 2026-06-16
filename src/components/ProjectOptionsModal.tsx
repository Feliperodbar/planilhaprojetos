import { useMemo, useState } from "react";
import type { FormEvent } from "react";

interface ProjectOptionsModalProps {
  isOpen: boolean;
  options: string[];
  onClose: () => void;
  onAdd: (projectName: string) => void;
  onRemove: (projectName: string) => void;
}

export function ProjectOptionsModal({
  isOpen,
  options,
  onClose,
  onAdd,
  onRemove,
}: ProjectOptionsModalProps) {
  const [projectName, setProjectName] = useState("");

  const cleanedOptions = useMemo(
    () => [...new Set(options.filter(Boolean).map((option) => option.trim()))],
    [options],
  );

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = projectName.trim();

    if (!value) {
      return;
    }

    onAdd(value);
    setProjectName("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-2 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="mt-4 w-full max-w-lg rounded-t-3xl border border-emerald-100 bg-white p-4 shadow-lg sm:mt-0 sm:rounded-xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Gerenciar projetos
        </h2>

        <form
          className="mb-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            placeholder="Novo projeto"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 sm:w-auto"
          >
            Adicionar
          </button>
        </form>

        <div className="max-h-60 space-y-2 overflow-y-auto">
          {cleanedOptions.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum projeto cadastrado.</p>
          ) : (
            cleanedOptions.map((option) => (
              <div
                key={option}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-gray-700">{option}</span>
                <button
                  type="button"
                  onClick={() => onRemove(option)}
                  className="w-full rounded bg-red-600 px-2 py-2 text-xs font-medium text-white hover:bg-red-700 sm:w-auto sm:px-2 sm:py-1"
                >
                  Remover
                </button>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
