import React, { useState } from 'react';
import {
  ArrowDownLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Tag,
  DollarSign,
  User,
  Plus,
} from 'lucide-react';
import {
  InventoryDatabase,
  Article,
  StorageLocation,
  StockMovement,
} from '../types/inventory';

interface StockEntryViewProps {
  db: InventoryDatabase;
  onRecordMovement: (movement: StockMovement) => void;
  onNavigateToHierarchy: () => void;
  onNavigateToLocations: () => void;
}

export const StockEntryView: React.FC<StockEntryViewProps> = ({
  db,
  onRecordMovement,
  onNavigateToHierarchy,
  onNavigateToLocations,
}) => {
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [quantity, setQuantity] = useState('');
  const [locationId, setLocationId] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reason, setReason] = useState('Aquisição para Aulas Práticas');
  const [responsible, setResponsible] = useState('Rhiany Barto (Resp. Técnica)');
  const [notes, setNotes] = useState('');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedArticle = db.articles.find(a => a.id === selectedArticleId);

  // When article changes, prefill default location and unit cost
  const handleSelectArticle = (art: Article) => {
    setSelectedArticleId(art.id);
    if (art.defaultLocationId) {
      setLocationId(art.defaultLocationId);
    } else if (db.locations.length > 0 && !locationId) {
      setLocationId(db.locations[0].id);
    }
    if (art.unitCost) {
      setUnitCost(String(art.unitCost));
    }
  };

  const filteredArticles = db.articles.filter(
    a =>
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!selectedArticle) {
      setErrorMessage('Por favor, selecione um artigo da lista.');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage('Informe uma quantidade de entrada válida e maior que zero.');
      return;
    }

    if (!locationId) {
      setErrorMessage('Selecione a localização de armazenamento onde o material será guardado.');
      return;
    }

    const targetLocation = db.locations.find(l => l.id === locationId);
    const locationName = targetLocation
      ? `[${targetLocation.code}] ${targetLocation.name}`
      : 'Localização Não Definida';

    const previousStock = selectedArticle.currentStock || 0;
    const newStock = previousStock + qty;

    const movement: StockMovement = {
      id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      articleId: selectedArticle.id,
      type: 'ENTRADA',
      quantity: qty,
      previousStock,
      newStock,
      locationId,
      locationName,
      documentNumber: docNumber.trim() || undefined,
      batchNumber: batchNumber.trim() || undefined,
      reason: reason.trim(),
      unitCost: parseFloat(unitCost) || selectedArticle.unitCost || 0,
      responsible: responsible.trim() || 'Almoxarifado SENAI',
      timestamp: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    onRecordMovement(movement);

    setSuccessMessage(
      `Entrada de ${qty} ${selectedArticle.unit} registrada com sucesso para o artigo ${selectedArticle.code}! Novo saldo: ${newStock} ${selectedArticle.unit}.`
    );

    // Reset inputs
    setQuantity('');
    setDocNumber('');
    setBatchNumber('');
    setNotes('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Registrar Entrada de Materiais
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              Recebimento de insumos, compras de fornecedores, doações e devoluções para o almoxarifado.
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Movimentação Concluída com Sucesso!</div>
            <div>{successMessage}</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Erro ao Registrar Entrada</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {db.articles.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="font-bold text-neutral-900 text-base">
            Nenhum artigo cadastrado no sistema
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto mb-4">
            Para registrar uma entrada, primeiro cadastre a hierarquia de materiais (Tipo → Grupo → Subgrupo → Artigo).
          </p>
          <button
            onClick={onNavigateToHierarchy}
            className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-800 transition"
          >
            Cadastrar Artigos Agora
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Etapa 1: Seleção do Artigo */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                1. Seleção do Material / Artigo
              </h3>
              {selectedArticle && (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Selecionado: {selectedArticle.code}
                </span>
              )}
            </div>

            <div>
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar artigo por código hierárquico ou nome..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                {filteredArticles.map(art => {
                  const isSelected = art.id === selectedArticleId;
                  return (
                    <div
                      key={art.id}
                      onClick={() => handleSelectArticle(art)}
                      className={`p-3 flex items-center justify-between text-xs cursor-pointer transition ${
                        isSelected
                          ? 'bg-emerald-50 border-l-4 border-l-emerald-600'
                          : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded">
                            {art.code}
                          </span>
                          <span className="font-semibold text-neutral-800">{art.name}</span>
                        </div>
                        {art.technicalSpecs && (
                          <div className="text-[11px] text-neutral-400 mt-0.5 truncate max-w-md">
                            {art.technicalSpecs}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-neutral-900">
                          Estoque Atual: {art.currentStock} {art.unit}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Mínimo: {art.minStock} {art.unit}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Etapa 2: Dados da Movimentação */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              2. Dados da Entrada & Armazenamento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Quantidade de Entrada *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    required
                    placeholder="0"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono font-bold text-sm focus:ring-1 focus:ring-emerald-600 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-neutral-400">
                    {selectedArticle?.unit || 'UN'}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-700">
                    Localização de Armazenamento *
                  </label>
                  <button
                    type="button"
                    onClick={onNavigateToLocations}
                    className="text-[11px] text-red-600 font-semibold hover:underline"
                  >
                    + Criar Local
                  </button>
                </div>
                <select
                  required
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
                >
                  <option value="">Selecione o local de guarda...</option>
                  {db.locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      [{loc.code}] {loc.name} ({loc.building})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  N° Nota Fiscal / Documento
                </label>
                <input
                  type="text"
                  placeholder="Ex: NF-e 045129"
                  value={docNumber}
                  onChange={e => setDocNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  N° Lote / Fabricação
                </label>
                <input
                  type="text"
                  placeholder="Ex: LOTE-2026-A1"
                  value={batchNumber}
                  onChange={e => setBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Custo Unitário da Entrada (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={unitCost}
                  onChange={e => setUnitCost(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-emerald-600 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Motivo da Entrada *
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
                >
                  <option value="Aquisição para Aulas Práticas">Aquisição para Aulas Práticas</option>
                  <option value="Devolução de Oficina/Laboratório">Devolução de Oficina/Laboratório</option>
                  <option value="Doação de Parceiro Industrial (FIESP)">Doação de Parceiro Industrial (FIESP)</option>
                  <option value="Ajuste de Balanço / Inventário">Ajuste de Balanço / Inventário</option>
                  <option value="Transferência entre Unidades SENAI">Transferência entre Unidades SENAI</option>
                  <option value="Outro">Outro Motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Responsável pelo Recebimento *
                </label>
                <input
                  type="text"
                  required
                  value={responsible}
                  onChange={e => setResponsible(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Observações Complementares
              </label>
              <textarea
                rows={2}
                placeholder="Insira detalhes da conferência física, estado da embalagem, etc."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>

            {/* Simulação em Tempo Real do Saldo */}
            {selectedArticle && quantity && parseFloat(quantity) > 0 && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                <div className="space-y-0.5">
                  <div className="font-semibold">Projeção do Estoque:</div>
                  <div className="text-[11px] text-emerald-700">
                    Saldo Anterior ({selectedArticle.currentStock} {selectedArticle.unit}) + Entrada ({quantity} {selectedArticle.unit})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase font-semibold text-emerald-700">Novo Saldo</div>
                  <div className="text-base font-extrabold font-mono text-emerald-900">
                    {(selectedArticle.currentStock || 0) + (parseFloat(quantity) || 0)} {selectedArticle.unit}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition cursor-pointer"
            >
              <ArrowDownLeft className="w-5 h-5" />
              <span>Confirmar Entrada de Material</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
