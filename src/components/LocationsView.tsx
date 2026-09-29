import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  Building,
  Layers,
  AlertCircle,
  Package,
} from 'lucide-react';
import { StorageLocation, InventoryDatabase } from '../types/inventory';
import { generateNextLocationCode } from '../utils/codeGenerator';

interface LocationsViewProps {
  db: InventoryDatabase;
  onSaveLocation: (loc: StorageLocation) => void;
  onDeleteLocation: (locId: string) => void;
}

export const LocationsView: React.FC<LocationsViewProps> = ({
  db,
  onSaveLocation,
  onDeleteLocation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<StorageLocation | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formBuilding, setFormBuilding] = useState('');
  const [formZone, setFormZone] = useState('');
  const [formShelf, setFormShelf] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenModal = (locToEdit?: StorageLocation) => {
    setErrorMessage(null);
    if (locToEdit) {
      setEditingLoc(locToEdit);
      setFormCode(locToEdit.code);
      setFormName(locToEdit.name);
      setFormBuilding(locToEdit.building);
      setFormZone(locToEdit.zone || '');
      setFormShelf(locToEdit.shelf || '');
      setFormDesc(locToEdit.description || '');
    } else {
      setEditingLoc(null);
      setFormCode(generateNextLocationCode(db.locations));
      setFormName('');
      setFormBuilding('Bloco Principal');
      setFormZone('');
      setFormShelf('');
      setFormDesc('');
    }
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim() || !formBuilding.trim()) {
      setErrorMessage('Código, nome e bloco/prédio são obrigatórios.');
      return;
    }

    const duplicate = db.locations.find(
      l => l.code.toUpperCase() === formCode.trim().toUpperCase() && l.id !== editingLoc?.id
    );
    if (duplicate) {
      setErrorMessage(`O código ${formCode} já está em uso.`);
      return;
    }

    const locObj: StorageLocation = {
      id: editingLoc ? editingLoc.id : 'loc_' + Date.now(),
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      building: formBuilding.trim(),
      zone: formZone.trim() || undefined,
      shelf: formShelf.trim() || undefined,
      description: formDesc.trim() || undefined,
      active: true,
      createdAt: editingLoc ? editingLoc.createdAt : new Date().toISOString(),
    };

    onSaveLocation(locObj);
    setModalOpen(false);
  };

  const filteredLocations = db.locations.filter(loc => {
    const q = searchTerm.toLowerCase();
    return (
      loc.code.toLowerCase().includes(q) ||
      loc.name.toLowerCase().includes(q) ||
      loc.building.toLowerCase().includes(q) ||
      (loc.zone && loc.zone.toLowerCase().includes(q)) ||
      (loc.shelf && loc.shelf.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-red-100 text-red-700">
              <MapPin className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-neutral-900">
              Localizações de Armazenamento
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Cadastre galpões, almoxarifados, corredores, estantes e prateleiras para rastreabilidade física dos materiais.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Localização</span>
        </button>
      </div>

      {/* Search and List */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código, nome, bloco ou estante..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none bg-white"
            />
          </div>
          <div className="text-xs text-neutral-500">
            Total: <strong>{db.locations.length}</strong> localizações cadastradas
          </div>
        </div>

        {filteredLocations.length === 0 ? (
          <div className="py-12 text-center text-neutral-400">
            <MapPin className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
            <div className="font-semibold text-neutral-700 text-sm">
              Nenhuma localização cadastrada
            </div>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Clique em "+ Nova Localização" para definir os espaços físicos onde os materiais serão guardados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {filteredLocations.map(loc => {
              // Itens com esta localização padrão ou movimentados para cá
              const assignedArticles = db.articles.filter(
                a => a.defaultLocationId === loc.id
              );
              const relatedMovementsCount = db.movements.filter(
                m => m.locationId === loc.id
              ).length;

              return (
                <div
                  key={loc.id}
                  className="rounded-xl border border-neutral-200 p-4 bg-white hover:border-neutral-300 transition shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-900 text-white">
                        {loc.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenModal(loc)}
                          className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
                          title="Editar Local"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (assignedArticles.length > 0 || relatedMovementsCount > 0) {
                              if (
                                !confirm(
                                  `Esta localização possui ${assignedArticles.length} artigo(s) ou ${relatedMovementsCount} histórico(s) vinculados. Deseja realmente excluir?`
                                )
                              ) {
                                return;
                              }
                            }
                            onDeleteLocation(loc.id);
                          }}
                          className="p-1 text-neutral-400 hover:text-red-600 rounded"
                          title="Excluir Local"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-neutral-900 text-sm mt-2">
                      {loc.name}
                    </h3>

                    <div className="space-y-1 mt-2 text-xs text-neutral-600">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{loc.building}</span>
                      </div>
                      {(loc.zone || loc.shelf) && (
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-neutral-400" />
                          <span>
                            {loc.zone} {loc.shelf ? `• ${loc.shelf}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {loc.description && (
                      <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2">
                        {loc.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-red-600" />
                      {assignedArticles.length} artigos associados
                    </span>
                    <span className="font-mono text-neutral-400">
                      {relatedMovementsCount} movimentações
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nova / Editar Localização */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-neutral-300 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              {editingLoc ? 'Editar Localização' : 'Nova Localização de Armazenamento'}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Identifique o ponto físico onde os materiais ficam alocados.
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Código da Localização (Gerado Automaticamente) *
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-xs uppercase font-bold focus:ring-1 focus:ring-red-600 outline-none"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Ex: LOC-01, ALM-A1, EST-02-P3
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome da Localização *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Almoxarifado Central - Prateleira A"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Prédio / Bloco / Unidade *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bloco A - Oficinas de Mecânica"
                  value={formBuilding}
                  onChange={e => setFormBuilding(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Zona / Corredor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Corredor 3"
                    value={formZone}
                    onChange={e => setFormZone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Estante / Prateleira / Gaveta
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Estante 02, Prateleira B"
                    value={formShelf}
                    onChange={e => setFormShelf(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Observações adicionais
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Local fechado sob chave, restrito a instrutores..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs"
                >
                  Salvar Localização
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
