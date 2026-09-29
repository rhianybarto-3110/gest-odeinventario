import React from 'react';
import { ShieldCheck, HardDrive, UserCheck, Code2, Database } from 'lucide-react';
import { InventoryDatabase } from '../types/inventory';

interface FooterProps {
  db: InventoryDatabase;
}

export const Footer: React.FC<FooterProps> = ({ db }) => {
  const formattedLastUpdate = new Date(db.lastUpdated).toLocaleString('pt-BR');

  return (
    <footer className="no-print bg-neutral-900 border-t border-neutral-800 text-neutral-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Institutional / School info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm">SENAI-SP</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-300 font-medium">Controle de Estoque & Almoxarifado</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              Sistema Didático e Operacional de Gestão de Insumos, Ferramentas e Equipamentos.
            </p>
          </div>

          {/* Technical Responsibility (Mandatory Requirement) */}
          <div className="bg-neutral-800/80 rounded-lg p-3 border border-neutral-700/80 text-center md:text-left flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-950 border border-red-800 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-red-400 font-bold">
                Responsável Técnica & Desenvolvedora
              </div>
              <div className="text-white font-semibold text-sm">
                Rhiany Barto
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Code2 className="w-3 h-3 text-neutral-500" />
                <span>Desenvolvimento Full-Stack & Engenharia de Software</span>
              </div>
            </div>
          </div>

          {/* Persistence & System Status */}
          <div className="flex flex-col md:items-end space-y-1 text-[11px]">
            <div className="flex items-center gap-2 text-neutral-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Persistência Local Ativa (Pronta para Testes)</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-neutral-500">
              {db.articles.length} Artigo(s) • {db.movements.length} Movimentação(ões)
            </div>
            <div className="text-neutral-500">
              Última atualização: {formattedLastUpdate}
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800/80 mt-4 pt-4 flex flex-col sm:flex-row items-center justify-between text-neutral-500 text-[11px] gap-2">
          <div>
            © {new Date().getFullYear()} SENAI São Paulo — Todos os direitos reservados para uso educacional e industrial.
          </div>
          <div className="flex items-center gap-3">
            <span className="hover:text-neutral-400">Padronização ABNT/SENAI</span>
            <span>•</span>
            <span className="hover:text-neutral-400">Armazenamento GitHub & Google Drive</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
