import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Github,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  Sparkles,
  Trash2,
  ExternalLink,
  Save,
  Key,
} from 'lucide-react';
import {
  InventoryDatabase,
  GitHubSyncConfig,
  SyncHistoryEntry,
} from '../types/inventory';
import {
  loadGitHubConfig,
  saveGitHubConfig,
  pushToGitHub,
  pullFromGitHub,
  exportDatabaseToFile,
  validateAndParseImportedJson,
  loadSyncHistory,
} from '../services/storage';

interface SyncViewProps {
  db: InventoryDatabase;
  onUpdateDatabase: (newDb: InventoryDatabase) => void;
  onLoadSampleData: () => void;
  onResetDatabase: () => void;
}

export const SyncView: React.FC<SyncViewProps> = ({
  db,
  onUpdateDatabase,
  onLoadSampleData,
  onResetDatabase,
}) => {
  const [githubConfig, setGithubConfig] = useState<GitHubSyncConfig>(loadGitHubConfig());
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>(loadSyncHistory());

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for GitHub
  const [token, setToken] = useState(githubConfig.token);
  const [mode, setMode] = useState<'gist' | 'repo'>(githubConfig.mode || 'gist');
  const [gistId, setGistId] = useState(githubConfig.gistId || '');
  const [repoOwner, setRepoOwner] = useState(githubConfig.repoOwner || '');
  const [repoName, setRepoName] = useState(githubConfig.repoName || '');
  const [branch, setBranch] = useState(githubConfig.branch || 'main');
  const [autoSync, setAutoSync] = useState(githubConfig.autoSync || false);

  const refreshHistory = () => {
    setSyncHistory(loadSyncHistory());
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GitHubSyncConfig = {
      token: token.trim(),
      mode,
      gistId: gistId.trim() || undefined,
      repoOwner: repoOwner.trim() || undefined,
      repoName: repoName.trim() || undefined,
      branch: branch.trim() || 'main',
      filePath: 'senai_sp_estoque_db.json',
      autoSync,
      lastSync: githubConfig.lastSync,
    };
    saveGitHubConfig(updated);
    setGithubConfig(updated);
    setSuccessMsg('Configurações do GitHub salvas com sucesso!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handlePushGitHub = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await pushToGitHub(db, {
        token: token.trim(),
        mode,
        gistId: gistId.trim() || undefined,
        repoOwner: repoOwner.trim() || undefined,
        repoName: repoName.trim() || undefined,
        branch: branch.trim() || 'main',
        filePath: 'senai_sp_estoque_db.json',
        autoSync,
      });

      if (result.success) {
        if (result.gistId && !gistId) {
          setGistId(result.gistId);
          const updated = { ...githubConfig, gistId: result.gistId };
          saveGitHubConfig(updated);
          setGithubConfig(updated);
        }
        setSuccessMsg(result.message + (result.details ? ` (${result.details})` : ''));
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao comunicar com o GitHub.');
    } finally {
      setIsLoading(false);
      refreshHistory();
    }
  };

  const handlePullGitHub = async () => {
    if (
      !confirm(
        'Atenção: Carregar dados do GitHub substituirá o banco de dados atual nesta sessão. Deseja continuar?'
      )
    ) {
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const pulledDb = await pullFromGitHub({
        token: token.trim(),
        mode,
        gistId: gistId.trim() || undefined,
        repoOwner: repoOwner.trim() || undefined,
        repoName: repoName.trim() || undefined,
        branch: branch.trim() || 'main',
        filePath: 'senai_sp_estoque_db.json',
        autoSync,
      });

      onUpdateDatabase(pulledDb);
      setSuccessMsg(
        `Dados restaurados do GitHub com sucesso! (${pulledDb.articles.length} artigos carregados)`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar dados do GitHub.');
    } finally {
      setIsLoading(false);
      refreshHistory();
    }
  };

  // Google Drive: Export File
  const handleExportGoogleDrive = () => {
    exportDatabaseToFile(db);
    setSuccessMsg(
      'Arquivo de backup gerado! Salve este arquivo na sua pasta do Google Drive para armazenamento em nuvem.'
    );
    refreshHistory();
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // Google Drive: Import File
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const importedDb = validateAndParseImportedJson(text);
        if (
          confirm(
            `Confirmar restauração do banco com ${importedDb.articles.length} artigos e ${importedDb.movements.length} movimentações?`
          )
        ) {
          onUpdateDatabase(importedDb);
          setSuccessMsg('Banco de dados restaurado com sucesso a partir do arquivo!');
          refreshHistory();
        }
      } catch (err: any) {
        setErrorMsg('Arquivo de backup inválido: ' + err.message);
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-red-100 text-red-700">
              <Cloud className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-neutral-900">
              Persistência e Sincronização em Nuvem
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Escolha sua estratégia de persistência: versionamento automatizado via <strong>GitHub (Gist/Repo)</strong> ou arquivamento via <strong>Google Drive</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Persistência Local Ativa
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* Grid: GitHub Sync & Google Drive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: GitHub Integration (Versioned) */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">
                    Sincronização com GitHub
                  </h3>
                  <span className="text-[10px] text-neutral-400">
                    Histórico de versões e commits automáticos
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800 uppercase">
                {mode === 'gist' ? 'Gist Privado' : 'Repositório'}
              </span>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  GitHub Personal Access Token (PAT)
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-neutral-300 font-mono text-xs focus:ring-1 focus:ring-red-600 outline-none"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Necessário escopo <code className="bg-neutral-100 px-1">gist</code> para Gists ou{' '}
                  <code className="bg-neutral-100 px-1">repo</code> para repositórios.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Modo de Armazenamento GitHub
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ghMode"
                      value="gist"
                      checked={mode === 'gist'}
                      onChange={() => setMode('gist')}
                      className="accent-red-600"
                    />
                    <span>GitHub Gist (Recomendado)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ghMode"
                      value="repo"
                      checked={mode === 'repo'}
                      onChange={() => setMode('repo')}
                      className="accent-red-600"
                    />
                    <span>Repositório</span>
                  </label>
                </div>
              </div>

              {mode === 'gist' ? (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    ID do Gist (Opcional - deixe vazio para criar um novo)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: d41d8cd98f00b204e9800998ecf8427e"
                    value={gistId}
                    onChange={e => setGistId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 font-mono text-xs focus:ring-1 focus:ring-red-600 outline-none"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Usuário / Org
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: senai-sp"
                      value={repoOwner}
                      onChange={e => setRepoOwner(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Repositório
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: controle-estoque"
                      value={repoName}
                      onChange={e => setRepoName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-900 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Token</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-wrap items-center gap-2">
            <button
              onClick={handlePushGitHub}
              disabled={isLoading || !token}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Sincronizando...' : 'Enviar para GitHub'}</span>
            </button>
            <button
              onClick={handlePullGitHub}
              disabled={isLoading || !token}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold border border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar do GitHub</span>
            </button>
          </div>
        </div>

        {/* Card 2: Google Drive Backup & Restore */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">
                  Integração Google Drive (Arquivo JSON)
                </h3>
                <span className="text-[10px] text-neutral-400">
                  Exportação e importação direta para sua conta Google Drive
                </span>
              </div>
            </div>

            <div className="space-y-3 mt-4 text-xs text-neutral-600">
              <p>
                Permite exportar um instantâneo seguro do banco de dados para salvar na sua pasta do Google Drive ou restaurar a qualquer momento.
              </p>

              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1.5">
                <div className="font-semibold text-neutral-800">Conteúdo do Arquivo de Backup:</div>
                <ul className="list-disc list-inside text-neutral-500 text-[11px] space-y-0.5">
                  <li>Toda a árvore hierárquica (Tipos, Grupos, Subgrupos, Artigos)</li>
                  <li>Todas as localizações físicas cadastradas</li>
                  <li>Auditoria de todas as movimentações (Entradas e Saídas)</li>
                  <li>Saldos consolidados em tempo real</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-200 space-y-2">
            <button
              onClick={handleExportGoogleDrive}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Backup para Google Drive (.json)</span>
            </button>

            <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs border border-neutral-300 transition cursor-pointer">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Restaurar Backup do Google Drive (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Database State Management & Testing Tools */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-6">
        <h3 className="font-bold text-neutral-900 text-sm mb-1 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-red-600" />
          Gerenciamento e Validação do Banco de Dados
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Ferramentas para testes, validação da estrutura vazia e carga de amostra didática.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-neutral-800">
                Amostra Didática SENAI-SP
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Carrega oficinas de Mecânica, Elétrica e EPIs com histórico para demonstração.
              </div>
            </div>
            <button
              onClick={onLoadSampleData}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Carregar Amostra</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-red-900">
                Zerar Banco de Dados (Estrutura Limpa)
              </div>
              <div className="text-[11px] text-red-700 mt-0.5">
                Remove todos os registros e deixa o banco 100% vazio para novo teste.
              </div>
            </div>
            <button
              onClick={onResetDatabase}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Tudo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync and Backup History Log */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-600" />
            <h3 className="font-bold text-neutral-900 text-sm">
              Histórico de Sincronizações e Backups
            </h3>
          </div>
          <span className="text-xs text-neutral-400">
            {syncHistory.length} operações registradas
          </span>
        </div>

        <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto text-xs">
          {syncHistory.length === 0 ? (
            <div className="p-6 text-center text-neutral-400 text-xs">
              Nenhuma operação de backup ou sincronização registrada nesta sessão ainda.
            </div>
          ) : (
            syncHistory.map(entry => (
              <div key={entry.id} className="p-3.5 flex items-start justify-between gap-3 hover:bg-neutral-50 transition">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`p-1 rounded mt-0.5 ${
                      entry.status === 'success'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {entry.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <div>
                    <div className="font-semibold text-neutral-800">{entry.message}</div>
                    {entry.details && (
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5 truncate max-w-lg">
                        {entry.details}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 font-mono whitespace-nowrap">
                  {new Date(entry.timestamp).toLocaleString('pt-BR')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
