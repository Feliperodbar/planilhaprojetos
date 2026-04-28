interface ExportModalProps {
  isOpen: boolean;
  onExcel: () => void;
  onCsv: () => void;
  onPDF: () => void;
  onClose: () => void;
}

export function ExportModal({
  isOpen,
  onExcel,
  onCsv,
  onPDF,
  onClose,
}: ExportModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-emerald-100 bg-white p-6 shadow-lg">
        <h2 className="mb-1 text-lg font-bold text-gray-800">Exportar dados</h2>
        <p className="mb-6 text-sm text-gray-600">
          Escolha o formato desejado para exportar suas atividades.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              onExcel();
              onClose();
            }}
            className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left font-medium text-emerald-900 transition hover:bg-emerald-100"
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
              onCsv();
              onClose();
            }}
            className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left font-medium text-emerald-900 transition hover:bg-emerald-100"
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
              <p className="font-semibold">CSV (.csv)</p>
              <p className="text-xs text-emerald-700">
                Valores separados por vírgula
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onPDF();
              onClose();
            }}
            className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left font-medium text-emerald-900 transition hover:bg-emerald-100"
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
              <p className="font-semibold">PDF</p>
              <p className="text-xs text-emerald-900">Documento portável</p>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-800 transition hover:bg-gray-200"
        >
          Cancelar
        </button>
      </div>
    </>
  );
}
