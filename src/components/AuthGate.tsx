import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { UserAccount } from "../types/auth";

interface AuthGateProps {
  accounts: UserAccount[];
  onLogin: (account: UserAccount) => void;
}

export function AuthGate({ accounts, onLogin }: AuthGateProps) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [password, setPassword] = useState("");
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
    setPassword("");
    onLogin(selectedAccount);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-100 to-emerald-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">
          Acesso ao sistema
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          Selecione a conta e informe a senha para continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Conta
            </label>
            <select
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
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
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              placeholder="Digite sua senha"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Credenciais locais de demonstração. Não use em ambiente de produção.
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
