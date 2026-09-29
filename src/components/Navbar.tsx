import React from 'react';
import {
  Boxes,
  Layers,
  MapPin,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  Cloud,
  AlertTriangle,
  PackageCheck,
  RefreshCw,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { InventoryDatabase } from '../types/inventory';

export type ActiveTab =
  | 'dashboard'
  | 'hierarchy'
  | 'locations'
  | 'entry'
  | 'exit'
  | 'reports'
  | 'sync';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  db: InventoryDatabase;
  onOpenSync: () => void;
  onOpenTutorial: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  db,
  onOpenSync,
  onOpenTutorial,
}) => {
  // Contagem de itens críticos (estoque <= estoque mínimo)
  const criticalItemsCount = db.articles.filter(
    a => a.currentStock <= a.minStock
  ).length;

  const totalArticles = db.articles.length;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Painel Geral',
      icon: <Boxes className="w-5 h-5" />,
    },
    {
      id: 'hierarchy',
      label: 'Hierarquia & Artigos',
      icon: <Layers className="w-5 h-5" />,
      badge: totalArticles > 0 ? totalArticles : undefined,
    },
    {
      id: 'locations',
      label: 'Localizações',
      icon: <MapPin className="w-5 h-5" />,
      badge: db.locations.length > 0 ? db.locations.length : undefined,
    },
    {
      id: 'entry',
      label: 'Entrada de Material',
      icon: <ArrowDownLeft className="w-5 h-5 text-emerald-600" />,
    },
    {
      id: 'exit',
      label: 'Saída de Material',
      icon: <ArrowUpRight className="w-5 h-5 text-red-600" />,
    },
    {
      id: 'reports',
      label: 'Relatórios & Posição',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      badge: criticalItemsCount > 0 ? criticalItemsCount : undefined,
      badgeColor: 'bg-red-600 text-white',
    },
    {
      id: 'sync',
      label: 'Persistência & Nuvem',
      icon: <Cloud className="w-5 h-5" />,
    },
  ];

  return (
    <header className="bg-neutral-900 border-b border-neutral-800 text-white sticky top-0 z-40 shadow-md">
      {/* Top Banner SENAI SP */}
      <div className="bg-red-700 px-4 py-1.5 flex items-center justify-between text-xs font-semibold text-white tracking-wide">
        <div className="flex items-center gap-2">
          <span className="bg-white text-red-700 px-1.5 py-0.5 rounded font-black tracking-tighter text-xs">
            SENAI
          </span>
          <span className="font-bold">SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SÃO PAULO</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-red-100 font-normal">
          <span>Escola e Faculdade de Tecnologia SENAI-SP</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-300"></span>
          <span>Controle de Estoque e Almoxarifado</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-xl shadow-inner group-hover:bg-red-700 transition">
                S
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-white group-hover:text-red-400 transition">
                    SENAI-SP <span className="text-red-500 font-extrabold">SIGE</span>
                  </h1>
                  <span className="hidden md:inline-block text-[11px] font-medium bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-700">
                    v1.0.0
                  </span>
                </div>
                <p className="text-xs text-neutral-400 hidden sm:block">
                  Sistema Integrado de Gestão e Controle de Estoques
                </p>
                <div className="flex items-center gap-1.5 text-[11px] leading-tight mt-0.5">
                  <span className="text-neutral-400">Desenvolvedora:</span>
                  <span className="text-red-400 font-bold">Rhiany Barto</span>
                </div>
              </div>
            </button>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {criticalItemsCount > 0 && (
              <button
                onClick={() => setActiveTab('reports')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-950/80 border border-red-800 text-red-300 text-xs font-medium hover:bg-red-900 transition"
                title={`${criticalItemsCount} artigos com estoque mínimo atingido`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>{criticalItemsCount} Alerta{criticalItemsCount > 1 ? 's' : ''} de Estoque</span>
              </button>
            )}

            {/* Botão Tutorial / Como Usar */}
            <button
              onClick={onOpenTutorial}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer border border-red-500"
              title="Abrir Tutorial e Guia Interativo de Uso"
            >
              <HelpCircle className="w-4 h-4 animate-bounce" />
              <span className="hidden sm:inline">Como Usar / Tutorial</span>
              <span className="sm:hidden">Ajuda</span>
            </button>

            <button
              onClick={onOpenSync}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-medium transition cursor-pointer"
              title="Gerenciar sincronização com GitHub e Google Drive"
            >
              <RefreshCw className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Sincronização</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Menu Tabs */}
      <nav className="bg-neutral-950/90 border-t border-neutral-800 px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 py-1.5">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-red-700 text-white shadow-sm ring-1 ring-red-500'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                      item.badgeColor || (isActive ? 'bg-red-900 text-red-100' : 'bg-neutral-800 text-neutral-300')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

