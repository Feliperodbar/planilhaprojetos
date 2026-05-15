import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { UserAccount } from "../types/auth";

interface AuthGateProps {
  accounts: UserAccount[];
  onLogin: (account: UserAccount) => void;
}

export function AuthGate({ accounts, onLogin }: AuthGateProps) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [password] = useState("123456");
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = useMemo(() => {
    return accounts.find((account) => account.id === accountId) ?? null;
  }, [accounts, accountId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedAccount) {
      setError("Selecione uma conta.");
      return;
    }

    if (selectedAccount.password !== password) {
      setError("Senha inválida.");
      return;
    }

    setError(null);
    onLogin(selectedAccount);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#ecfdf5_100%)] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-[1520px] items-center justify-center">
        <div className="flex w-full max-w-md flex-col gap-4">
          <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-7">
            <h1 className="text-2xl font-semibold text-slate-900">
              Gerenciador de Tarefas
            </h1>
            <p className="text-sm text-slate-600">
              Acesse sua conta para continuar
            </p>
          </section>

          <section className="rounded-[20px] border border-white/60 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Conta
                </label>
                <select
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (
                      {account.role === "admin" ? "Administrador" : "Comum"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  placeholder="Digite sua senha"
                />
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Credenciais locais de demonstração. Não use em ambiente de
                produção.
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Entrar
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
