import React, { useState } from 'react';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  DollarSign,
  PlusCircle,
  FileSpreadsheet,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Circle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { InventoryDatabase } from '../types/inventory';
import { ActiveTab } from './Navbar';

interface DashboardViewProps {
  db: InventoryDatabase;
  setActiveTab: (tab: ActiveTab) => void;
  onLoadSampleData: () => void;
  onOpenTutorial: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  db,
  setActiveTab,
  onLoadSampleData,
  onOpenTutorial,
}) => {
  const [showChecklist, setShowChecklist] = useState(true);

  const totalArticles = db.articles.length;
  const totalUnits = db.articles.reduce((acc, a) => acc + (a.currentStock || 0), 0);
  const criticalArticles = db.articles.filter(a => a.currentStock <= a.minStock);
  const totalValue = db.articles.reduce(
    (acc, a) => acc + (a.currentStock || 0) * (a.unitCost || 0),
    0
  );
  const totalMovements = db.movements.length;

  const latestMovements = [...db.movements]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const isEmpty = totalArticles === 0 && db.locations.length === 0;

  // Checklist interativo de primeiro uso
  const checklistSteps = [
    {
      id: 'step_loc',
      title: 'Cadastrar Localização Física',
      desc: 'Defina almoxarifados, corredores ou estantes para guardar materiais.',
      completed: db.locations.length > 0,
      targetTab: 'locations' as ActiveTab,
      actionText: '+ Nova Localização',
    },
    {
      id: 'step_hier',
      title: 'Cadastrar Hierarquia e Artigos',
      desc: 'Crie Tipo → Grupo → Subgrupo → Artigo com código único automático.',
      completed: db.articles.length > 0,
      targetTab: 'hierarchy' as ActiveTab,
      actionText: '+ Novo Artigo',
    },
    {
      id: 'step_entry',
      title: 'Registrar Entrada de Material',
      desc: 'Lance o recebimento com NF, lote e localização de guarda.',
      completed: db.movements.some(m => m.type === 'ENTRADA'),
      targetTab: 'entry' as ActiveTab,
      actionText: '+ Registrar Entrada',
    },
    {
      id: 'step_exit',
      title: 'Registrar Saída para Aula / Oficina',
      desc: 'Dê baixa com validação de saldo e aviso de estoque de segurança.',
      completed: db.movements.some(m => m.type === 'SAIDA'),
      targetTab: 'exit' as ActiveTab,
      actionText: '- Registrar Saída',
    },
    {
      id: 'step_report',
      title: 'Consultar Posição e Emitir Relatório',
      desc: 'Veja saldos em tempo real, exporte em CSV ou imprima a folha oficial.',
      completed: totalArticles > 0 && db.movements.length > 0,
      targetTab: 'reports' as ActiveTab,
      actionText: 'Ver Relatórios',
    },
  ];

  const completedCount = checklistSteps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / checklistSteps.length) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome with Tutorial CTA */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                Gestão de Estoques SENAI-SP
              </span>
              <button
                onClick={onOpenTutorial}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-red-400" />
                <span>Tutorial Interativo de Primeiro Uso</span>
              </button>
            </div>
            <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
              Painel de Controle e Almoxarifado
            </h2>
            <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
              Monitore níveis de estoque em tempo real, registre entradas e saídas de insumos e emita relatórios rastreáveis com códigos hierárquicos padronizados.
            </p>
          </div>

          {/* Action buttons destacados */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('entry')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-xs transition cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Registrar Entrada</span>
            </button>
            <button
              onClick={() => setActiveTab('exit')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-sm shadow-xs transition cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>- Registrar Saída</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Posição do Estoque</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Onboarding Checklist Card */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-700 flex items-center justify-center font-bold text-white shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  Guia Prático de Aprendizado & Primeiros Passos
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-red-300 border border-neutral-700">
                  {progressPercent}% Concluído
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Siga os passos recomendados para dominar todas as etapas do controle de estoque.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onOpenTutorial}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ver Tour Passo a Passo</span>
            </button>
            <button
              onClick={() => setShowChecklist(!showChecklist)}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white transition"
              title={showChecklist ? 'Minimizar Guia' : 'Expandir Guia'}
            >
              {showChecklist ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-100 h-1.5">
          <div
            className="bg-red-600 h-1.5 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {showChecklist && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3 bg-neutral-50/50">
            {checklistSteps.map((step, idx) => {
              return (
                <div
                  key={step.id}
                  onClick={() => setActiveTab(step.targetTab)}
                  className={`p-3 rounded-lg border transition cursor-pointer flex flex-col justify-between ${
                    step.completed
                      ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
                      : 'bg-white border-neutral-200 hover:border-red-300 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-neutral-400">
                        0{idx + 1}
                      </span>
                      {step.completed ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Concluído
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-neutral-400">
                          <Circle className="w-3 h-3 text-neutral-300" />
                          Pendente
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-neutral-900 leading-snug">
                      {step.title}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-semibold text-red-700">
                    <span>{step.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Artigos */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-xs hover:border-neutral-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Artigos Cadastrados
            </span>
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-neutral-900">{totalArticles}</div>
            <p className="text-xs text-neutral-500 mt-1">
              {totalUnits} unidades totais em estoque
            </p>
          </div>
        </div>

        {/* Nível Crítico */}
        <div
          onClick={() => setActiveTab('reports')}
          className={`bg-white rounded-xl p-5 border transition cursor-pointer ${
            criticalArticles.length > 0
              ? 'border-red-300 bg-red-50/30 hover:border-red-400'
              : 'border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
              Estoque Mínimo / Crítico
            </span>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                criticalArticles.length > 0
                  ? 'bg-red-100 text-red-700 font-bold'
                  : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-3xl font-extrabold ${
                criticalArticles.length > 0 ? 'text-red-700' : 'text-neutral-900'
              }`}
            >
              {criticalArticles.length}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {criticalArticles.length === 0
                ? 'Nenhum artigo abaixo do estoque de segurança'
                : 'Necessitam de reposição imediata'}
            </p>
          </div>
        </div>

        {/* Valor Total do Estoque */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-xs hover:border-neutral-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Valor Total Estimado
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 truncate">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Baseado no custo unitário cadastrado
            </p>
          </div>
        </div>

        {/* Movimentações */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-xs hover:border-neutral-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Movimentações Registradas
            </span>
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-neutral-900">{totalMovements}</div>
            <p className="text-xs text-neutral-500 mt-1">
              {db.movements.filter(m => m.type === 'ENTRADA').length} entradas •{' '}
              {db.movements.filter(m => m.type === 'SAIDA').length} saídas
            </p>
          </div>
        </div>
      </div>

      {/* If Database is Empty (Ready for testing) */}
      {isEmpty && (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 shadow-xs text-center max-w-3xl mx-auto my-6">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto mb-4 border border-red-200">
            <Boxes className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-3">
            Estrutura Vazia Pronta para Validação
          </span>
          <h3 className="text-xl font-bold text-neutral-900">
            Banco de dados limpo e preparado para seus testes
          </h3>
          <p className="text-sm text-neutral-600 mt-2 max-w-lg mx-auto">
            O sistema inicia sem dados pré-carregados conforme especificado nos requisitos. Você pode iniciar o cadastro hierárquico agora ou carregar uma amostra didática com um clique.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mt-6 mb-8 max-w-xl mx-auto text-xs">
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="font-bold text-neutral-900 mb-1">1. Hierarquia</div>
              <p className="text-neutral-500">Cadastre Tipo → Grupo → Subgrupo → Artigo com código único automático.</p>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="font-bold text-neutral-900 mb-1">2. Localização</div>
              <p className="text-neutral-500">Defina os locais de estoque (Almoxarifado, Estante, Prateleira).</p>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="font-bold text-neutral-900 mb-1">3. Movimentações</div>
              <p className="text-neutral-500">Lance entradas e saídas de materiais com controle e relatórios em tempo real.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('hierarchy')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-sm shadow-xs transition cursor-pointer"
            >
              Começar Cadastro Hierárquico
            </button>
            <button
              onClick={onLoadSampleData}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-sm border border-neutral-300 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Carregar Amostra Didática SENAI (Opcional)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Sections: Alert Items + Latest Movements */}
      {!isEmpty && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1 & 2: Artigos em Nível de Atenção / Visão de Estoque */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-red-700" />
                <h3 className="font-bold text-neutral-900 text-base">
                  Posição dos Principais Artigos
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('reports')}
                className="text-xs font-semibold text-red-700 hover:text-red-800 transition"
              >
                Ver todos os {totalArticles} artigos →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider text-[11px] border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Código Único</th>
                    <th className="py-3 px-4">Artigo</th>
                    <th className="py-3 px-4 text-center">Unidade</th>
                    <th className="py-3 px-4 text-right">Mínimo</th>
                    <th className="py-3 px-4 text-right">Estoque Atual</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {db.articles.slice(0, 6).map(art => {
                    const isCritical = art.currentStock <= art.minStock;
                    const isZero = art.currentStock === 0;

                    return (
                      <tr key={art.id} className="hover:bg-neutral-50 transition">
                        <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                          {art.code}
                        </td>
                        <td className="py-3 px-4 font-medium text-neutral-900">
                          <div>{art.name}</div>
                          {art.technicalSpecs && (
                            <div className="text-[11px] text-neutral-400 truncate max-w-xs">
                              {art.technicalSpecs}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-neutral-100 font-mono text-[11px]">
                            {art.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-neutral-500">
                          {art.minStock}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                          {art.currentStock}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isZero ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-white">
                              ZERADO
                            </span>
                          ) : isCritical ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                              CRÍTICO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                              NORMAL
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coluna 3: Últimas Movimentações */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xs flex flex-col">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-neutral-700" />
                <h3 className="font-bold text-neutral-900 text-base">
                  Movimentações Recentes
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('reports')}
                className="text-xs font-semibold text-red-700 hover:text-red-800 transition"
              >
                Histórico →
              </button>
            </div>

            <div className="p-4 flex-1 divide-y divide-neutral-100">
              {latestMovements.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  Nenhuma movimentação registrada ainda.
                </div>
              ) : (
                latestMovements.map(mov => {
                  const article = db.articles.find(a => a.id === mov.articleId);
                  const isEntrada = mov.type === 'ENTRADA';

                  return (
                    <div key={mov.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-md ${
                              isEntrada ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isEntrada ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div>
                            <div className="font-semibold text-neutral-900 text-xs">
                              {isEntrada ? 'Entrada' : 'Saída'}:{' '}
                              <span className="font-mono text-neutral-600">
                                {article ? article.code : 'Artigo'}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-500 truncate max-w-[180px]">
                              {article ? article.name : 'Item removido'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`text-xs font-bold font-mono ${
                              isEntrada ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {isEntrada ? '+' : '-'}
                            {mov.quantity} {article?.unit || 'UN'}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {new Date(mov.timestamp).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                        <span>Local: {mov.locationName}</span>
                        <span className="truncate max-w-[120px]">{mov.responsible}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Auditoria em tempo real
              </span>
              <span className="font-mono font-medium">{totalMovements} registros</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
