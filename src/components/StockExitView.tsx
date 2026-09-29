import React, { useState } from 'react';
import {
  ArrowUpRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  MapPin,
  Tag,
  User,
  GraduationCap,
} from 'lucide-react';
import {
  InventoryDatabase,
  Article,
  StorageLocation,
  StockMovement,
} from '../types/inventory';

interface StockExitViewProps {
  db: InventoryDatabase;
  onRecordMovement: (movement: StockMovement) => void;
  onNavigateToHierarchy: () => void;
}

export const StockExitView: React.FC<StockExitViewProps> = ({
  db,
  onRecordMovement,
  onNavigateToHierarchy,
}) => {
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [quantity, setQuantity] = useState('');
  const [locationId, setLocationId] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('Aula Prática em Laboratório / Oficina');
  const [responsible, setResponsible] = useState('Rhiany Barto (Resp. Técnica)');
  const [notes, setNotes] = useState('');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const selectedArticle = db.articles.find(a => a.id === selectedArticleId);

  const handleSelectArticle = (art: Article) => {
    setSelectedArticleId(art.id);
    if (art.defaultLocationId) {
      setLocationId(art.defaultLocationId);
    } else if (db.locations.length > 0 && !locationId) {
      setLocationId(db.locations[0].id);
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
    setWarningMessage(null);

    if (!selectedArticle) {
      setErrorMessage('Por favor, selecione um artigo da lista.');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage('Informe uma quantidade de saída válida maior que zero.');
      return;
    }

    if (qty > selectedArticle.currentStock) {
      setErrorMessage(
        `Quantidade solicitada (${qty} ${selectedArticle.unit}) excede o saldo disponível em estoque (${selectedArticle.currentStock} ${selectedArticle.unit}).`
      );
      return;
    }

    if (!locationId) {
      setErrorMessage('Selecione o local de retirada do material.');
      return;
    }

    if (!destination.trim()) {
      setErrorMessage('Informe o destino ou solicitante (Ex: Turma, Laboratório, Ordem de Serviço).');
      return;
    }

    const targetLocation = db.locations.find(l => l.id === locationId);
    const locationName = targetLocation
      ? `[${targetLocation.code}] ${targetLocation.name}`
      : 'Local Não Informado';

    const previousStock = selectedArticle.currentStock || 0;
    const newStock = previousStock - qty;

    const movement: StockMovement = {
      id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      articleId: selectedArticle.id,
      type: 'SAIDA',
      quantity: qty,
      previousStock,
      newStock,
      locationId,
      locationName,
      documentNumber: docNumber.trim() || undefined,
      destinationOrRequester: destination.trim(),
      reason: reason.trim(),
      unitCost: selectedArticle.unitCost || 0,
      responsible: responsible.trim() || 'Almoxarifado SENAI',
      timestamp: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    onRecordMovement(movement);

    let msg = `Saída de ${qty} ${selectedArticle.unit} registrada com sucesso para ${selectedArticle.code}. Saldo restante: ${newStock} ${selectedArticle.unit}.`;
    if (newStock <= selectedArticle.minStock) {
      setWarningMessage(
        `Atenção: O artigo ${selectedArticle.code} atingiu ou ficou abaixo do estoque mínimo de segurança (${selectedArticle.minStock} ${selectedArticle.unit})!`
      );
    }

    setSuccessMessage(msg);

    // Reset inputs
    setQuantity('');
    setDocNumber('');
    setDestination('');
    setNotes('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Registrar Saída de Materiais
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              Requisição de peças para oficinas, aulas práticas didáticas, laboratórios ou manutenção industrial.
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Baixa Registrada no Estoque!</div>
            <div>{successMessage}</div>
          </div>
        </div>
      )}

      {warningMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Alerta de Estoque Mínimo</div>
            <div>{warningMessage}</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Erro ao Registrar Saída</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {db.articles.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="font-bold text-neutral-900 text-base">
            Nenhum artigo cadastrado
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto mb-4">
            Cadastre artigos e faça entradas no estoque antes de realizar saídas.
          </p>
          <button
            onClick={onNavigateToHierarchy}
            className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-800 transition"
          >
            Ir para Cadastro Hierárquico
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Seleção do Artigo */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                <Tag className="w-4 h-4 text-red-600" />
                1. Seleção do Material a Retirar
              </h3>
              {selectedArticle && (
                <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Selecionado: {selectedArticle.code}
                </span>
              )}
            </div>

            <div>
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar artigo por código ou nome..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                {filteredArticles.map(art => {
                  const isSelected = art.id === selectedArticleId;
                  const isZero = art.currentStock <= 0;

                  return (
                    <div
                      key={art.id}
                      onClick={() => handleSelectArticle(art)}
                      className={`p-3 flex items-center justify-between text-xs cursor-pointer transition ${
                        isSelected
                          ? 'bg-red-50 border-l-4 border-l-red-600'
                          : isZero
                          ? 'opacity-60 bg-neutral-50 hover:bg-neutral-100'
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
                        <div
                          className={`font-mono font-bold ${
                            isZero ? 'text-red-600' : 'text-neutral-900'
                          }`}
                        >
                          Saldo Disponível: {art.currentStock} {art.unit}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Estoque Mínimo: {art.minStock} {art.unit}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Dados da Saída */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              2. Dados da Baixa / Requisição
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Quantidade a Retirar *
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
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono font-bold text-sm focus:ring-1 focus:ring-red-600 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-neutral-400">
                    {selectedArticle?.unit || 'UN'}
                  </span>
                </div>
                {selectedArticle && (
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Disponível: {selectedArticle.currentStock} {selectedArticle.unit}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Local de Retirada Física *
                </label>
                <select
                  required
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                >
                  <option value="">Selecione o local de onde o item sairá...</option>
                  {db.locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      [{loc.code}] {loc.name} ({loc.building})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Destino / Solicitante (Turma, Oficina ou Instrutor) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Oficina Mecânica 02 - Turma Mecatrônica Vespertino"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  N° da Ordem de Serviço / Requisição
                </label>
                <input
                  type="text"
                  placeholder="Ex: OS-2026-089 ou REQ-AULA-14"
                  value={docNumber}
                  onChange={e => setDocNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Finalidade / Motivo da Saída *
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                >
                  <option value="Aula Prática em Laboratório / Oficina">Aula Prática em Laboratório / Oficina</option>
                  <option value="Projeto de Conclusão de Curso (TCC)">Projeto de Conclusão de Curso (TCC)</option>
                  <option value="Manutenção Predial / Máquinas">Manutenção Predial / Máquinas</option>
                  <option value="Consumo em Testes e Ensaios">Consumo em Testes e Ensaios</option>
                  <option value="Avaria / Quebra Didática">Avaria / Quebra Didática</option>
                  <option value="Outro">Outro Destino</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Responsável pela Liberação *
                </label>
                <input
                  type="text"
                  required
                  value={responsible}
                  onChange={e => setResponsible(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Observações Adicionais
              </label>
              <textarea
                rows={2}
                placeholder="Insira notas sobre a devolução de sobras ou estado da entrega..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
              />
            </div>

            {/* Simulação em Tempo Real do Saldo Restante */}
            {selectedArticle && quantity && parseFloat(quantity) > 0 && (
              <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-lg flex items-center justify-between text-xs text-neutral-900">
                <div>
                  <div className="font-semibold">Saldo Atual vs Nova Saída:</div>
                  <div className="text-[11px] text-neutral-600">
                    {selectedArticle.currentStock} {selectedArticle.unit} - {quantity} {selectedArticle.unit}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase font-semibold text-neutral-600">Novo Saldo Previsto</div>
                  <div
                    className={`text-base font-extrabold font-mono ${
                      (selectedArticle.currentStock || 0) - (parseFloat(quantity) || 0) <= selectedArticle.minStock
                        ? 'text-red-700'
                        : 'text-neutral-900'
                    }`}
                  >
                    {(selectedArticle.currentStock || 0) - (parseFloat(quantity) || 0)} {selectedArticle.unit}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition cursor-pointer"
            >
              <ArrowUpRight className="w-5 h-5" />
              <span>Confirmar Saída de Material</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
