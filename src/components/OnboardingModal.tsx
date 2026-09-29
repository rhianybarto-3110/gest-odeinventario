import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  MapPin,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  BookOpen,
  Boxes,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ActiveTab } from './Navbar';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onLoadSampleData: () => void;
  hasArticles: boolean;
}

interface StepItem {
  id: number;
  title: string;
  badge: string;
  tabTarget?: ActiveTab;
  icon: React.ReactNode;
  description: string;
  bulletPoints: { title: string; desc: string }[];
  exampleSnippet?: { label: string; text: string; code?: string };
  actionLabel?: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onLoadSampleData,
  hasArticles,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps: StepItem[] = [
    {
      id: 1,
      title: 'Bem-vindo ao SIGE SENAI-SP',
      badge: 'Visão Geral',
      icon: <Boxes className="w-6 h-6 text-red-600" />,
      description:
        'O Sistema Integrado de Gestão de Estoques foi desenvolvido para escolas e faculdades de tecnologia SENAI-SP, oferecendo controle rigoroso e rastreável de ferramentas, insumos e equipamentos industriais.',
      bulletPoints: [
        {
          title: 'Interface Sóbria e Funcional',
          desc: 'Padronizada nas cores institucionais (branco, vermelho e preto) com botões e atalhos rápidos destacados.',
        },
        {
          title: 'Estrutura Limpa para Testes',
          desc: 'O sistema inicia vazio conforme requisitos para que você teste do zero, com total persistência de dados.',
        },
        {
          title: 'Auditoria e Responsabilidade Técnica',
          desc: 'Rastreabilidade completa de operadores e conformidade técnica (Resp. Técnico: Rhiany Barto).',
        },
      ],
      exampleSnippet: {
        label: 'Dica inicial rápida',
        text: 'Navegue pelo menu superior em qualquer momento para alternar entre as etapas de cadastro, movimentações e relatórios.',
      },
    },
    {
      id: 2,
      title: '1. Cadastro Hierárquico em 4 Níveis',
      badge: 'Tipo → Grupo → Subgrupo → Artigo',
      tabTarget: 'hierarchy',
      icon: <Layers className="w-6 h-6 text-red-600" />,
      description:
        'Para manter o padrão de almoxarifado industrial, os materiais são organizados hierarquicamente. Cada nível recebe um código único gerado automaticamente pelo sistema.',
      bulletPoints: [
        {
          title: 'Tipo (Nível 1)',
          desc: 'A grande área tecnológica (Ex: "Mecânica e Usinagem" → TIP-01).',
        },
        {
          title: 'Grupo (Nível 2)',
          desc: 'Família do material vinculada ao Tipo (Ex: "Ferramentas de Corte" → TIP-01.GRP-01).',
        },
        {
          title: 'Subgrupo (Nível 3)',
          desc: 'Especificação da família (Ex: "Brocas HSS Aço Rápido" → TIP-01.GRP-01.SUB-01).',
        },
        {
          title: 'Artigo (Nível 4 - Item Final)',
          desc: 'O item com estoque (Ex: "Broca 6,0mm DIN 338" → TIP-01.GRP-01.SUB-01.ART-001).',
        },
      ],
      exampleSnippet: {
        label: 'Exemplo de Código Automático',
        text: 'Ao criar um Artigo no subgrupo, o sistema gera instantaneamente:',
        code: 'TIP-01.GRP-01.SUB-01.ART-001',
      },
      actionLabel: 'Acessar Cadastro Hierárquico',
    },
    {
      id: 3,
      title: '2. Localizações Físicas de Armazenamento',
      badge: 'Onde o item fica guardado',
      tabTarget: 'locations',
      icon: <MapPin className="w-6 h-6 text-red-600" />,
      description:
        'Evite perdas e agilize a localização de insumos cadastrando os espaços físicos do almoxarifado escolar.',
      bulletPoints: [
        {
          title: 'Prédio ou Bloco',
          desc: 'Ex: "Bloco A - Oficinas de Usinagem" ou "Bloco B - Laboratórios de Eletrotécnica".',
        },
        {
          title: 'Almoxarifado & Corredor',
          desc: 'Identifique se é almoxarifado central, sala de ferramentas ou armário técnico.',
        },
        {
          title: 'Estante, Prateleira e Gaveta',
          desc: 'Detalhe a posição exata para que instrutores e alunos encontrem o item sem demora.',
        },
      ],
      exampleSnippet: {
        label: 'Formato Recomendado',
        text: 'Código: LOC-01 | Nome: Almoxarifado Mecânica - Estante 01, Gaveta B3',
      },
      actionLabel: 'Acessar Localizações',
    },
    {
      id: 4,
      title: '3. Movimentações de Estoque (Entradas e Saídas)',
      badge: 'Entrada & Saída',
      tabTarget: 'entry',
      icon: <ArrowDownLeft className="w-6 h-6 text-emerald-600" />,
      description:
        'Controle cada unidade física que entra ou sai com rastreabilidade total de justificativa e solicitante.',
      bulletPoints: [
        {
          title: 'Registrar Entrada',
          desc: 'Lance compras de fornecedores, doações industriais ou devoluções de aulas com NF, lote e custo unitário.',
        },
        {
          title: 'Registrar Saída com Proteção',
          desc: 'O sistema bloqueia saídas superiores ao estoque disponível e emite alerta automático se atingir o estoque mínimo.',
        },
        {
          title: 'Destino e Ordem de Serviço',
          desc: 'Identifique se a saída foi para a turma de Mecânica, laboratório de CLP ou manutenção predial.',
        },
      ],
      exampleSnippet: {
        label: 'Cálculo em Tempo Real',
        text: 'Ao digitar a quantidade, o sistema projeta imediatamente o novo saldo antes de você confirmar!',
      },
      actionLabel: 'Testar Entrada de Materiais',
    },
    {
      id: 5,
      title: '4. Relatórios & Posição Completa em Tempo Real',
      badge: 'Auditoria & Impressão',
      tabTarget: 'reports',
      icon: <FileSpreadsheet className="w-6 h-6 text-red-600" />,
      description:
        'Tenha visibilidade total do inventário com filtros dinâmicos, alertas de estoque crítico e emissão de documentos.',
      bulletPoints: [
        {
          title: 'Posição do Estoque Atualizada',
          desc: 'Veja saldos, localizações de guarda, valores totais e itens zerados ou críticos em tempo real.',
        },
        {
          title: 'Auditoria de Histórico',
          desc: 'Consulte quem movimentou, quando, qual quantidade e qual documento deu suporte à baixa.',
        },
        {
          title: 'Exportação CSV & Impressão Oficial',
          desc: 'Baixe em formato compatível com Excel ou imprima o relatório oficial timbrado do SENAI-SP para assinaturas.',
        },
      ],
      exampleSnippet: {
        label: 'Impressão Formatada',
        text: 'O botão "Imprimir Relatório Oficial" gera uma folha formal limpa (sem menus da web), pronta para PDF ou prancheta.',
      },
      actionLabel: 'Ver Relatórios de Estoque',
    },
    {
      id: 6,
      title: '5. Persistência de Dados, GitHub e Google Drive',
      badge: 'Seus Dados Seguros',
      tabTarget: 'sync',
      icon: <Cloud className="w-6 h-6 text-blue-600" />,
      description:
        'Seus dados permanecem salvos entre sessões e podem ser sincronizados com versionamento no GitHub ou backups no Google Drive.',
      bulletPoints: [
        {
          title: 'Persistência Local Automática',
          desc: 'Toda alteração é gravada instantaneamente no navegador e sincronizada entre abas.',
        },
        {
          title: 'Sincronização com GitHub (Gist / Repo)',
          desc: 'Insira seu token do GitHub para criar histórico de commits e versionamento automático de cada lote.',
        },
        {
          title: 'Backups para Google Drive',
          desc: 'Exporte backups em JSON com data e hora para arquivamento no Drive e restaure a qualquer momento.',
        },
      ],
      exampleSnippet: {
        label: 'Testes Imediatos',
        text: 'Você pode começar com a estrutura 100% vazia ou carregar a amostra didática com 1 clique para experimentar tudo!',
      },
      actionLabel: 'Abrir Painel de Sincronização',
    },
  ];

  const current = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('senai_onboarding_completed', 'true');
    onClose();
  };

  const handleNavigateAndClose = (tab?: ActiveTab) => {
    if (tab) {
      setActiveTab(tab);
    }
    handleComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-neutral-300 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header do Modal */}
        <div className="bg-neutral-900 text-white p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-700 flex items-center justify-center font-bold text-white shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-800 text-red-100 uppercase tracking-wider">
                  Guia Prático de Primeiro Uso
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  Passo {currentStep + 1} de {steps.length}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {current.title}
              </h2>
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Fechar Tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-200 h-1.5 flex">
          {steps.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`flex-1 h-full transition-all cursor-pointer ${
                idx === currentStep
                  ? 'bg-red-600'
                  : idx < currentStep
                  ? 'bg-red-800'
                  : 'bg-neutral-200 hover:bg-neutral-300'
              }`}
              title={`Ir para passo ${idx + 1}`}
            />
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Description */}
          <div className="flex items-start gap-3.5 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            <div className="p-2 rounded-lg bg-white border border-neutral-200 shadow-xs shrink-0 mt-0.5">
              {current.icon}
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">
                {current.badge}
              </span>
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-medium">
                {current.description}
              </p>
            </div>
          </div>

          {/* Key Bullet Points */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              Como Funciona na Prática:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {current.bulletPoints.map((pt, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition text-xs"
                >
                  <div className="font-bold text-neutral-900 flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    {pt.title}
                  </div>
                  <p className="text-neutral-500 text-[11px] leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Example / Code Snippet */}
          {current.exampleSnippet && (
            <div className="p-3.5 rounded-xl bg-neutral-900 text-white text-xs space-y-1">
              <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                {current.exampleSnippet.label}
              </div>
              <div className="text-neutral-300 text-xs">
                {current.exampleSnippet.text}
              </div>
              {current.exampleSnippet.code && (
                <div className="mt-2 p-2 rounded bg-black/60 font-mono text-emerald-400 font-bold text-xs border border-neutral-700">
                  {current.exampleSnippet.code}
                </div>
              )}
            </div>
          )}

          {/* Sample Data Callout on First Step or Last Step */}
          {(currentStep === 0 || currentStep === steps.length - 1) && !hasArticles && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-red-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  Deseja testar com dados simulados agora?
                </div>
                <div className="text-neutral-600 text-[11px] mt-0.5">
                  Carregue um exemplo didático completo (oficina de usinagem, elétrica e EPIs) com 1 clique.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLoadSampleData();
                  handleComplete();
                }}
                className="px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition shrink-0 shadow-xs cursor-pointer"
              >
                Carregar Amostra Didática
              </button>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="bg-neutral-50 border-t border-neutral-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={handleComplete}
              className="text-xs text-neutral-500 hover:text-neutral-800 font-medium px-2 py-1"
            >
              Pular Tutorial
            </button>

            {current.tabTarget && (
              <button
                onClick={() => handleNavigateAndClose(current.tabTarget)}
                className="text-xs text-red-700 hover:text-red-900 font-bold flex items-center gap-1 bg-red-50 px-2.5 py-1.5 rounded border border-red-200"
              >
                <span>{current.actionLabel || 'Ir para esta tela'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3.5 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <span>{currentStep === steps.length - 1 ? 'Concluir Tutorial' : 'Próximo'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
