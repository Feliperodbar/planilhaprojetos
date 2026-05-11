import type { FormEvent } from "react";
import type { ProjectTask } from "../types/project";

interface AdminCommentModalProps {
  isOpen: boolean;
  task: ProjectTask | null;
  onClose: () => void;
  onSave: (text: string) => void;
}

export function AdminCommentModal({
  isOpen,
  task,
  onClose,
  onSave,
}: AdminCommentModalProps) {
  if (!isOpen || !task) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("commentText") ?? "").trim();
    if (!value) {
      return;
    }

    onSave(value);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-emerald-100 bg-white p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-1 text-xl font-semibold text-gray-800">
          Comentar atividade
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Atividade: <strong>{task.atividade}</strong>
        </p>
        {task.adminComment && (
          <p className="mb-2 text-xs text-amber-700">
            Esta atividade já possui comentário. Salvar irá substituir o
            comentário atual.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            name="commentText"
            rows={4}
            defaultValue={task.adminComment?.text ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            placeholder="Digite uma sinalização para o usuário"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
            >
              Salvar comentário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
