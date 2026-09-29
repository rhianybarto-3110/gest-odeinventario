import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Search,
  Filter,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { InventoryDatabase, StockMovement } from '../types/inventory';

interface ReportsViewProps {
  db: InventoryDatabase;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ db }) => {
  const [reportTab, setReportTab] = useState<'position' | 'movements'>('position');

  // Filters for Position
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTypeId, setFilterTypeId] = useState('');
  const [filterLocationId, setFilterLocationId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'zero' | 'normal'>('all');

  // Filters for Movements
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'ENTRADA' | 'SAIDA'>('all');
  const [movementDateStart, setMovementDateStart] = useState('');
  const [movementDateEnd, setMovementDateEnd] = useState('');

  // Calculations for current position
  const filteredArticles = db.articles.filter(art => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      art.code.toLowerCase().includes(q) ||
      art.name.toLowerCase().includes(q) ||
      (art.technicalSpecs && art.technicalSpecs.toLowerCase().includes(q));

    const matchesType = !filterTypeId || art.typeId === filterTypeId;
    const matchesLocation = !filterLocationId || art.defaultLocationId === filterLocationId;

    let matchesStatus = true;
    if (filterStatus === 'critical') {
      matchesStatus = art.currentStock <= art.minStock && art.currentStock > 0;
    } else if (filterStatus === 'zero') {
      matchesStatus = art.currentStock === 0;
    } else if (filterStatus === 'normal') {
      matchesStatus = art.currentStock > art.minStock;
    }

    return matchesSearch && matchesType && matchesLocation && matchesStatus;
  });

  // Filter movements
  const filteredMovements = db.movements.filter(mov => {
    const art = db.articles.find(a => a.id === mov.articleId);
    const q = movementSearch.toLowerCase();
    const matchesSearch =
      (art && (art.code.toLowerCase().includes(q) || art.name.toLowerCase().includes(q))) ||
      mov.locationName.toLowerCase().includes(q) ||
      (mov.destinationOrRequester && mov.destinationOrRequester.toLowerCase().includes(q)) ||
      (mov.documentNumber && mov.documentNumber.toLowerCase().includes(q)) ||
      mov.responsible.toLowerCase().includes(q) ||
      mov.reason.toLowerCase().includes(q);

    const matchesType = movementTypeFilter === 'all' || mov.type === movementTypeFilter;

    let matchesDate = true;
    if (movementDateStart) {
      matchesDate = matchesDate && new Date(mov.timestamp) >= new Date(movementDateStart);
    }
    if (movementDateEnd) {
      const endDate = new Date(movementDateEnd);
      endDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(mov.timestamp) <= endDate;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const totalFilteredValue = filteredArticles.reduce(
    (acc, a) => acc + (a.currentStock || 0) * (a.unitCost || 0),
    0
  );
  const totalFilteredUnits = filteredArticles.reduce((acc, a) => acc + (a.currentStock || 0), 0);

  // Export to CSV
  const handleExportCSV = () => {
    if (reportTab === 'position') {
      const headers = [
        'Código Único',
        'Nome do Artigo',
        'Tipo',
        'Grupo',
        'Subgrupo',
        'Unidade',
        'Estoque Mínimo',
        'Estoque Atual',
        'Localização Padrão',
        'Custo Unitário (R$)',
        'Valor Total (R$)',
        'Status',
        'Especificações Técnicas',
      ];

      const rows = filteredArticles.map(art => {
        const tipo = db.types.find(t => t.id === art.typeId)?.name || '';
        const grupo = db.groups.find(g => g.id === art.groupId)?.name || '';
        const subgrupo = db.subgroups.find(s => s.id === art.subgroupId)?.name || '';
        const local = db.locations.find(l => l.id === art.defaultLocationId);
        const localStr = local ? `[${local.code}] ${local.name}` : 'Não definida';
        const totalCost = (art.currentStock || 0) * (art.unitCost || 0);

        let statusStr = 'NORMAL';
        if (art.currentStock === 0) statusStr = 'ZERADO';
        else if (art.currentStock <= art.minStock) statusStr = 'CRÍTICO';

        return [
          `"${art.code}"`,
          `"${art.name.replace(/"/g, '""')}"`,
          `"${tipo}"`,
          `"${grupo}"`,
          `"${subgrupo}"`,
          `"${art.unit}"`,
          art.minStock,
          art.currentStock,
          `"${localStr}"`,
          art.unitCost?.toFixed(2) || '0.00',
          totalCost.toFixed(2),
          `"${statusStr}"`,
          `"${(art.technicalSpecs || '').replace(/"/g, '""')}"`,
        ].join(';');
      });

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `SENAI_SP_Relatorio_Posicao_Estoque_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      // Export movements
      const headers = [
        'Data/Hora',
        'Tipo de Movimento',
        'Código do Artigo',
        'Nome do Artigo',
        'Quantidade',
        'Unidade',
        'Saldo Anterior',
        'Novo Saldo',
        'Localização',
        'Documento/NF',
        'Lote',
        'Destino/Solicitante',
        'Motivo',
        'Responsável',
      ];

      const rows = filteredMovements.map(mov => {
        const art = db.articles.find(a => a.id === mov.articleId);
        return [
          `"${new Date(mov.timestamp).toLocaleString('pt-BR')}"`,
          `"${mov.type}"`,
          `"${art?.code || ''}"`,
          `"${(art?.name || '').replace(/"/g, '""')}"`,
          mov.quantity,
          `"${art?.unit || 'UN'}"`,
          mov.previousStock,
          mov.newStock,
          `"${mov.locationName.replace(/"/g, '""')}"`,
          `"${(mov.documentNumber || '').replace(/"/g, '""')}"`,
          `"${(mov.batchNumber || '').replace(/"/g, '""')}"`,
          `"${(mov.destinationOrRequester || '').replace(/"/g, '""')}"`,
          `"${mov.reason.replace(/"/g, '""')}"`,
          `"${mov.responsible.replace(/"/g, '""')}"`,
        ].join(';');
      });

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `SENAI_SP_Relatorio_Movimentacoes_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header (No-print) */}
      <div className="no-print bg-white rounded-xl border border-neutral-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-red-100 text-red-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-neutral-900">
              Relatórios e Posição do Estoque em Tempo Real
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Consulte a posição completa, analise histórico de movimentações, filtre por hierarquia e emita o relatório oficial impresso ou exportado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV / Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório Oficial</span>
          </button>
        </div>
      </div>

      {/* Official SENAI-SP Print Header (Visible ONLY when printing) */}
      <div className="print-only mb-6 border-b-2 border-black pb-4 text-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black tracking-tighter bg-black text-white px-2 py-0.5">
              SENAI
            </div>
            <div>
              <div className="font-extrabold text-sm uppercase tracking-wider">
                SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI-SP
              </div>
              <div className="text-xs">
                Escola e Faculdade de Tecnologia SENAI • Controle de Estoques e Patrimônio
              </div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold">
              {reportTab === 'position' ? 'RELATÓRIO DE POSIÇÃO DE ESTOQUE' : 'HISTÓRICO DE MOVIMENTAÇÕES'}
            </div>
            <div>Data de Emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</div>
            <div>Responsável Técnica & Desenvolvedora: Rhiany Barto</div>
          </div>
        </div>
      </div>

      {/* Tab Switcher & KPIs (No-print) */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex space-x-2 bg-neutral-200/80 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setReportTab('position')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition cursor-pointer ${
              reportTab === 'position'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Boxes className="w-4 h-4 text-red-600" />
            <span>Posição Atual do Estoque ({filteredArticles.length})</span>
          </button>
          <button
            onClick={() => setReportTab('movements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition cursor-pointer ${
              reportTab === 'movements'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-neutral-700" />
            <span>Histórico de Movimentações ({filteredMovements.length})</span>
          </button>
        </div>

        {reportTab === 'position' && (
          <div className="flex items-center gap-4 text-xs font-semibold text-neutral-600">
            <div>
              Total de Itens:{' '}
              <span className="font-mono font-bold text-neutral-900">{totalFilteredUnits} un</span>
            </div>
            <div>
              Valor Total:{' '}
              <span className="font-mono font-bold text-neutral-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totalFilteredValue
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: POSIÇÃO DE ESTOQUE */}
      {reportTab === 'position' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden print-card">
          {/* Filters Bar (No-print) */}
          <div className="no-print p-4 border-b border-neutral-200 bg-neutral-50/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar código, nome ou specs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none bg-white"
              />
            </div>

            <div>
              <select
                value={filterTypeId}
                onChange={e => setFilterTypeId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none bg-white"
              >
                <option value="">Todos os Tipos</option>
                {db.types.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.code}] {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterLocationId}
                onChange={e => setFilterLocationId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none bg-white"
              >
                <option value="">Todas as Localizações</option>
                {db.locations.map(l => (
                  <option key={l.id} value={l.id}>
                    [{l.code}] {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none bg-white"
              >
                <option value="all">Todos os Status</option>
                <option value="normal">Estoque Normal</option>
                <option value="critical">Estoque Crítico (Abaixo do Mínimo)</option>
                <option value="zero">Estoque Zerado</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-800">
              <thead className="bg-neutral-100 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Código Único</th>
                  <th className="py-3 px-4">Artigo / Especificação</th>
                  <th className="py-3 px-4">Hierarquia</th>
                  <th className="py-3 px-4">Local de Guarda</th>
                  <th className="py-3 px-4 text-center">Unid.</th>
                  <th className="py-3 px-4 text-right">Mínimo</th>
                  <th className="py-3 px-4 text-right">Saldo Atual</th>
                  <th className="py-3 px-4 text-right">Custo Unit.</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-neutral-400">
                      Nenhum artigo encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map(art => {
                    const tipo = db.types.find(t => t.id === art.typeId);
                    const sub = db.subgroups.find(s => s.id === art.subgroupId);
                    const location = db.locations.find(l => l.id === art.defaultLocationId);
                    const isCritical = art.currentStock <= art.minStock && art.currentStock > 0;
                    const isZero = art.currentStock === 0;
                    const totalVal = (art.currentStock || 0) * (art.unitCost || 0);

                    return (
                      <tr key={art.id} className="hover:bg-neutral-50 transition print-break-inside-avoid">
                        <td className="py-2.5 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                          {art.code}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-neutral-900">{art.name}</div>
                          {art.technicalSpecs && (
                            <div className="text-[10px] text-neutral-500 mt-0.5 max-w-xs truncate">
                              {art.technicalSpecs}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-neutral-600 text-[11px]">
                          <div>{tipo ? tipo.name : '—'}</div>
                          <div className="text-neutral-400 text-[10px]">
                            {sub ? sub.name : '—'}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-[11px] text-neutral-600">
                          {location ? (
                            <div>
                              <span className="font-mono font-semibold">[{location.code}]</span>{' '}
                              <span>{location.name}</span>
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic">Não alocado</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-semibold">
                          {art.unit}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-neutral-500">
                          {art.minStock}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-extrabold text-neutral-900">
                          {art.currentStock}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-neutral-600">
                          R$ {(art.unitCost || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-neutral-900">
                          R$ {totalVal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isZero ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-900 text-white">
                              ZERADO
                            </span>
                          ) : isCritical ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                              CRÍTICO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                              NORMAL
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HISTÓRICO DE MOVIMENTAÇÕES */}
      {reportTab === 'movements' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden print-card">
          {/* Movement Filters Bar (No-print) */}
          <div className="no-print p-4 border-b border-neutral-200 bg-neutral-50/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por artigo, destino, NF, responsável..."
                value={movementSearch}
                onChange={e => setMovementSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none bg-white"
              />
            </div>

            <div>
              <select
                value={movementTypeFilter}
                onChange={e => setMovementTypeFilter(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none bg-white"
              >
                <option value="all">Todas as Movimentações</option>
                <option value="ENTRADA">Apenas Entradas</option>
                <option value="SAIDA">Apenas Saídas</option>
              </select>
            </div>

            <div>
              <input
                type="date"
                value={movementDateStart}
                onChange={e => setMovementDateStart(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none bg-white"
                placeholder="Data Inicial"
              />
            </div>

            <div>
              <input
                type="date"
                value={movementDateEnd}
                onChange={e => setMovementDateEnd(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none bg-white"
                placeholder="Data Final"
              />
            </div>
          </div>

          {/* Movements Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-800">
              <thead className="bg-neutral-100 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4 text-center">Tipo</th>
                  <th className="py-3 px-4">Artigo</th>
                  <th className="py-3 px-4 text-right">Qtd. Movimentada</th>
                  <th className="py-3 px-4 text-center">Saldo (Antes → Depois)</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">Destino / Solicitante / NF</th>
                  <th className="py-3 px-4">Motivo</th>
                  <th className="py-3 px-4">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-400">
                      Nenhuma movimentação registrada para os critérios informados.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(mov => {
                    const art = db.articles.find(a => a.id === mov.articleId);
                    const isEntrada = mov.type === 'ENTRADA';

                    return (
                      <tr key={mov.id} className="hover:bg-neutral-50 transition print-break-inside-avoid">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-neutral-600 whitespace-nowrap">
                          {new Date(mov.timestamp).toLocaleDateString('pt-BR')}{' '}
                          <span className="text-neutral-400">
                            {new Date(mov.timestamp).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isEntrada
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isEntrada ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            {mov.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-mono font-bold text-neutral-900">
                            {art ? art.code : '—'}
                          </div>
                          <div className="text-[11px] text-neutral-600 truncate max-w-[200px]">
                            {art ? art.name : 'Material não identificado'}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold">
                          <span className={isEntrada ? 'text-emerald-700' : 'text-red-700'}>
                            {isEntrada ? '+' : '-'}
                            {mov.quantity} {art?.unit || 'UN'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                          {mov.previousStock} → <strong className="text-neutral-900">{mov.newStock}</strong>
                        </td>
                        <td className="py-2.5 px-4 text-[11px] text-neutral-600">
                          {mov.locationName}
                        </td>
                        <td className="py-2.5 px-4 text-[11px]">
                          {mov.destinationOrRequester && (
                            <div className="font-medium text-neutral-900">
                              {mov.destinationOrRequester}
                            </div>
                          )}
                          {mov.documentNumber && (
                            <div className="text-neutral-500 text-[10px]">
                              Doc: {mov.documentNumber}
                            </div>
                          )}
                          {mov.batchNumber && (
                            <div className="text-neutral-500 text-[10px]">
                              Lote: {mov.batchNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-[11px] text-neutral-600 max-w-[150px] truncate">
                          {mov.reason}
                        </td>
                        <td className="py-2.5 px-4 text-[11px] text-neutral-600 whitespace-nowrap">
                          {mov.responsible}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Signatures Section (Visible ONLY in Print mode) */}
      <div className="print-only mt-12 pt-8 border-t border-neutral-400">
        <div className="grid grid-cols-2 gap-12 text-center text-xs text-black">
          <div>
            <div className="border-t border-black w-64 mx-auto pt-2 font-bold">
              Rhiany Barto
            </div>
            <div>Responsável Técnica & Desenvolvedora Full-Stack</div>
            <div className="text-[10px] text-neutral-600">Engenharia de Software</div>
          </div>
          <div>
            <div className="border-t border-black w-64 mx-auto pt-2 font-bold">
              Coordenação de Almoxarifado / Gestão
            </div>
            <div>Escola e Faculdade SENAI-SP</div>
            <div className="text-[10px] text-neutral-600">Validação e Conferência Física</div>
          </div>
        </div>
      </div>
    </div>
  );
};
