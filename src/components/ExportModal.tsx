interface ExportModalProps {
  isOpen: boolean;
  scopeLabel: string;
  onExcel: () => void;
  onPDF: () => void;
  onClose: () => void;
}

export function ExportModal({
  isOpen,
  scopeLabel,
  onExcel,
  onPDF,
  onClose,
}: ExportModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)] backdrop-blur-xl sm:p-7">
        <div className="mb-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Exportação
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Exportar dados
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Escopo: <strong className="text-slate-900">{scopeLabel}</strong>.
            Escolha o formato desejado.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              onExcel();
              onClose();
            }}
            className="group flex items-center gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-4 text-left font-medium text-emerald-950 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <div>
              <p className="font-semibold">Excel (.xlsx)</p>
              <p className="text-xs text-emerald-700">Planilha para análise</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onPDF();
              onClose();
            }}
            className="group flex items-center gap-4 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-white px-4 py-4 text-left font-medium text-sky-950 transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
          >
            <svg
              className="h-5 w-5 shrink-0 text-sky-700 transition group-hover:scale-110"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <div>
              <p className="font-semibold">PDF</p>
              <p className="text-xs text-sky-700">Documento portátil</p>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </>
  );
}
