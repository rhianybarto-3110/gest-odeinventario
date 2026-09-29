import React, { useState, useId } from 'react';
import {
  Layers,
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  Box,
  Tag,
  Search,
  Check,
  AlertCircle,
  PackagePlus,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ItemType,
  ItemGroup,
  ItemSubgroup,
  Article,
  StorageLocation,
  InventoryDatabase,
} from '../types/inventory';
import {
  generateNextTypeCode,
  generateNextGroupCode,
  generateNextSubgroupCode,
  generateNextArticleCode,
} from '../utils/codeGenerator';

interface HierarchyViewProps {
  db: InventoryDatabase;
  onSaveType: (type: ItemType) => void;
  onDeleteType: (typeId: string) => void;
  onSaveGroup: (group: ItemGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onSaveSubgroup: (subgroup: ItemSubgroup) => void;
  onDeleteSubgroup: (subgroupId: string) => void;
  onSaveArticle: (article: Article) => void;
  onDeleteArticle: (articleId: string) => void;
  locations: StorageLocation[];
}

export const HierarchyView: React.FC<HierarchyViewProps> = ({
  db,
  onSaveType,
  onDeleteType,
  onSaveGroup,
  onDeleteGroup,
  onSaveSubgroup,
  onDeleteSubgroup,
  onSaveArticle,
  onDeleteArticle,
  locations,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string | null>(null);

  // Modals state
  const [modalMode, setModalMode] = useState<'type' | 'group' | 'subgroup' | 'article' | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formParentTypeId, setFormParentTypeId] = useState('');
  const [formParentGroupId, setFormParentGroupId] = useState('');
  const [formParentSubgroupId, setFormParentSubgroupId] = useState('');

  // Article specific form states
  const [formUnit, setFormUnit] = useState('UN');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formInitialStock, setFormInitialStock] = useState('0');
  const [formUnitCost, setFormUnitCost] = useState('0.00');
  const [formLocationId, setFormLocationId] = useState('');
  const [formSpecs, setFormSpecs] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Open modal helpers
  const handleOpenTypeModal = (typeToEdit?: ItemType) => {
    setErrorMessage(null);
    if (typeToEdit) {
      setEditingItem(typeToEdit);
      setFormCode(typeToEdit.code);
      setFormName(typeToEdit.name);
      setFormDesc(typeToEdit.description || '');
    } else {
      setEditingItem(null);
      const nextCode = generateNextTypeCode(db.types);
      setFormCode(nextCode);
      setFormName('');
      setFormDesc('');
    }
    setModalMode('type');
  };

  const handleOpenGroupModal = (parentType?: ItemType, groupToEdit?: ItemGroup) => {
    setErrorMessage(null);
    const targetTypeId = parentType ? parentType.id : selectedTypeId || db.types[0]?.id || '';
    setFormParentTypeId(targetTypeId);

    if (groupToEdit) {
      setEditingItem(groupToEdit);
      setFormCode(groupToEdit.code);
      setFormName(groupToEdit.name);
      setFormDesc(groupToEdit.description || '');
      setFormParentTypeId(groupToEdit.typeId);
    } else {
      setEditingItem(null);
      const parent = db.types.find(t => t.id === targetTypeId);
      const nextCode = parent ? generateNextGroupCode(parent, db.groups) : 'GRP-01';
      setFormCode(nextCode);
      setFormName('');
      setFormDesc('');
    }
    setModalMode('group');
  };

  const handleOpenSubgroupModal = (parentGroup?: ItemGroup, subgroupToEdit?: ItemSubgroup) => {
    setErrorMessage(null);
    const targetGroupId = parentGroup ? parentGroup.id : selectedGroupId || db.groups[0]?.id || '';
    setFormParentGroupId(targetGroupId);

    if (subgroupToEdit) {
      setEditingItem(subgroupToEdit);
      setFormCode(subgroupToEdit.code);
      setFormName(subgroupToEdit.name);
      setFormDesc(subgroupToEdit.description || '');
      setFormParentGroupId(subgroupToEdit.groupId);
      setFormParentTypeId(subgroupToEdit.typeId);
    } else {
      setEditingItem(null);
      const parent = db.groups.find(g => g.id === targetGroupId);
      const nextCode = parent ? generateNextSubgroupCode(parent, db.subgroups) : 'SUB-01';
      setFormCode(nextCode);
      setFormName('');
      setFormDesc('');
      if (parent) {
        setFormParentTypeId(parent.typeId);
      }
    }
    setModalMode('subgroup');
  };

  const handleOpenArticleModal = (parentSubgroup?: ItemSubgroup, articleToEdit?: Article) => {
    setErrorMessage(null);
    const targetSubgroupId = parentSubgroup ? parentSubgroup.id : selectedSubgroupId || db.subgroups[0]?.id || '';
    setFormParentSubgroupId(targetSubgroupId);

    if (articleToEdit) {
      setEditingItem(articleToEdit);
      setFormCode(articleToEdit.code);
      setFormName(articleToEdit.name);
      setFormDesc(articleToEdit.description || '');
      setFormParentSubgroupId(articleToEdit.subgroupId);
      setFormParentGroupId(articleToEdit.groupId);
      setFormParentTypeId(articleToEdit.typeId);
      setFormUnit(articleToEdit.unit);
      setFormMinStock(String(articleToEdit.minStock));
      setFormInitialStock(String(articleToEdit.currentStock));
      setFormUnitCost(String(articleToEdit.unitCost || 0));
      setFormLocationId(articleToEdit.defaultLocationId || '');
      setFormSpecs(articleToEdit.technicalSpecs || '');
    } else {
      setEditingItem(null);
      const sub = db.subgroups.find(s => s.id === targetSubgroupId);
      const nextCode = sub ? generateNextArticleCode(sub, db.articles) : 'ART-001';
      setFormCode(nextCode);
      setFormName('');
      setFormDesc('');
      setFormUnit('UN');
      setFormMinStock('5');
      setFormInitialStock('0');
      setFormUnitCost('0.00');
      setFormLocationId(locations[0]?.id || '');
      setFormSpecs('');
      if (sub) {
        setFormParentGroupId(sub.groupId);
        setFormParentTypeId(sub.typeId);
      }
    }
    setModalMode('article');
  };

  // Submit forms
  const handleSubmitType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMessage('O nome do Tipo é obrigatório.');
      return;
    }
    if (!formCode.trim()) {
      setErrorMessage('O código do Tipo é obrigatório.');
      return;
    }

    // Check duplicate code
    const duplicate = db.types.find(
      t => t.code.toUpperCase() === formCode.trim().toUpperCase() && t.id !== editingItem?.id
    );
    if (duplicate) {
      setErrorMessage(`O código ${formCode} já está em uso por outro Tipo.`);
      return;
    }

    const typeObj: ItemType = {
      id: editingItem ? editingItem.id : 'tip_' + Date.now(),
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      description: formDesc.trim(),
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
    };

    onSaveType(typeObj);
    setSelectedTypeId(typeObj.id);
    setModalMode(null);
  };

  const handleSubmitGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formParentTypeId) {
      setErrorMessage('Selecione o Tipo pai.');
      return;
    }
    if (!formName.trim() || !formCode.trim()) {
      setErrorMessage('Nome e código do Grupo são obrigatórios.');
      return;
    }

    const duplicate = db.groups.find(
      g => g.code.toUpperCase() === formCode.trim().toUpperCase() && g.id !== editingItem?.id
    );
    if (duplicate) {
      setErrorMessage(`O código ${formCode} já está em uso.`);
      return;
    }

    const groupObj: ItemGroup = {
      id: editingItem ? editingItem.id : 'grp_' + Date.now(),
      typeId: formParentTypeId,
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      description: formDesc.trim(),
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
    };

    onSaveGroup(groupObj);
    setSelectedGroupId(groupObj.id);
    setModalMode(null);
  };

  const handleSubmitSubgroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formParentGroupId) {
      setErrorMessage('Selecione o Grupo pai.');
      return;
    }
    if (!formName.trim() || !formCode.trim()) {
      setErrorMessage('Nome e código do Subgrupo são obrigatórios.');
      return;
    }

    const parentGroup = db.groups.find(g => g.id === formParentGroupId);
    if (!parentGroup) {
      setErrorMessage('Grupo pai não encontrado.');
      return;
    }

    const duplicate = db.subgroups.find(
      s => s.code.toUpperCase() === formCode.trim().toUpperCase() && s.id !== editingItem?.id
    );
    if (duplicate) {
      setErrorMessage(`O código ${formCode} já está em uso.`);
      return;
    }

    const subgroupObj: ItemSubgroup = {
      id: editingItem ? editingItem.id : 'sub_' + Date.now(),
      groupId: formParentGroupId,
      typeId: parentGroup.typeId,
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      description: formDesc.trim(),
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
    };

    onSaveSubgroup(subgroupObj);
    setSelectedSubgroupId(subgroupObj.id);
    setModalMode(null);
  };

  const handleSubmitArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formParentSubgroupId) {
      setErrorMessage('Selecione o Subgrupo.');
      return;
    }
    if (!formName.trim() || !formCode.trim()) {
      setErrorMessage('Nome e código do Artigo são obrigatórios.');
      return;
    }

    const parentSub = db.subgroups.find(s => s.id === formParentSubgroupId);
    if (!parentSub) {
      setErrorMessage('Subgrupo não encontrado.');
      return;
    }

    const duplicate = db.articles.find(
      a => a.code.toUpperCase() === formCode.trim().toUpperCase() && a.id !== editingItem?.id
    );
    if (duplicate) {
      setErrorMessage(`O código único ${formCode} já está cadastrado.`);
      return;
    }

    const min = parseFloat(formMinStock) || 0;
    const initial = parseFloat(formInitialStock) || 0;
    const cost = parseFloat(formUnitCost) || 0;

    const articleObj: Article = {
      id: editingItem ? editingItem.id : 'art_' + Date.now(),
      typeId: parentSub.typeId,
      groupId: parentSub.groupId,
      subgroupId: parentSub.id,
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      description: formDesc.trim(),
      unit: formUnit.trim().toUpperCase(),
      minStock: min,
      currentStock: editingItem ? editingItem.currentStock : initial,
      unitCost: cost,
      defaultLocationId: formLocationId || undefined,
      technicalSpecs: formSpecs.trim(),
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveArticle(articleObj);
    setModalMode(null);
  };

  // Filtered lists
  const filteredArticles = db.articles.filter(art => {
    const matchesSearch =
      art.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (art.technicalSpecs && art.technicalSpecs.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = !selectedTypeId || art.typeId === selectedTypeId;
    const matchesGroup = !selectedGroupId || art.groupId === selectedGroupId;
    const matchesSubgroup = !selectedSubgroupId || art.subgroupId === selectedSubgroupId;

    return matchesSearch && matchesType && matchesGroup && matchesSubgroup;
  });

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-red-100 text-red-700">
              <FolderTree className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-neutral-900">
              Estrutura Hierárquica de Materiais
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Padronização oficial: <strong className="text-neutral-800">Tipo</strong> → <strong className="text-neutral-800">Grupo</strong> → <strong className="text-neutral-800">Subgrupo</strong> → <strong className="text-neutral-800">Artigo</strong> com codificação única automática.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenTypeModal()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Tipo</span>
          </button>
          <button
            onClick={() => handleOpenGroupModal()}
            disabled={db.types.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold border border-neutral-300 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Grupo</span>
          </button>
          <button
            onClick={() => handleOpenSubgroupModal()}
            disabled={db.groups.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold border border-neutral-300 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Subgrupo</span>
          </button>
          <button
            onClick={() => handleOpenArticleModal()}
            disabled={db.subgroups.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Novo Artigo</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Tree/Filters Sidebar + Articles Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hierarchical Filter Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-red-600" />
                Níveis Hierárquicos
              </span>
              {(selectedTypeId || selectedGroupId || selectedSubgroupId) && (
                <button
                  onClick={() => {
                    setSelectedTypeId(null);
                    setSelectedGroupId(null);
                    setSelectedSubgroupId(null);
                  }}
                  className="text-[11px] text-red-600 font-semibold hover:underline"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            {db.types.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400">
                Nenhum Tipo cadastrado ainda. Clique em <strong>"+ Novo Tipo"</strong> para iniciar.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {db.types.map(tipo => {
                  const isTypeSelected = selectedTypeId === tipo.id;
                  const groupsForType = db.groups.filter(g => g.typeId === tipo.id);
                  const articlesForType = db.articles.filter(a => a.typeId === tipo.id);

                  return (
                    <div
                      key={tipo.id}
                      className={`rounded-lg border transition ${
                        isTypeSelected
                          ? 'border-red-500 bg-red-50/40'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {/* Tipo Header */}
                      <div className="p-2.5 flex items-center justify-between gap-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => {
                            if (isTypeSelected) {
                              setSelectedTypeId(null);
                              setSelectedGroupId(null);
                              setSelectedSubgroupId(null);
                            } else {
                              setSelectedTypeId(tipo.id);
                              setSelectedGroupId(null);
                              setSelectedSubgroupId(null);
                            }
                          }}
                        >
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-900 text-white">
                            {tipo.code}
                          </span>
                          <span className="font-semibold text-xs text-neutral-900 truncate">
                            {tipo.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            ({articlesForType.length})
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenTypeModal(tipo)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
                            title="Editar Tipo"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (groupsForType.length > 0) {
                                alert('Não é possível excluir um Tipo que possui Grupos vinculados. Exclua primeiro os Grupos.');
                                return;
                              }
                              if (confirm(`Excluir Tipo "${tipo.name}" (${tipo.code})?`)) {
                                onDeleteType(tipo.id);
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-red-600 rounded"
                            title="Excluir Tipo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Grupos do Tipo */}
                      {isTypeSelected && (
                        <div className="pl-4 pr-2 pb-2 pt-1 border-t border-red-200/60 space-y-1.5 bg-white/70">
                          {groupsForType.length === 0 ? (
                            <div className="text-[11px] text-neutral-400 italic py-1">
                              Nenhum grupo neste tipo.{' '}
                              <button
                                onClick={() => handleOpenGroupModal(tipo)}
                                className="text-red-600 font-semibold underline"
                              >
                                + Adicionar Grupo
                              </button>
                            </div>
                          ) : (
                            groupsForType.map(grupo => {
                              const isGroupSelected = selectedGroupId === grupo.id;
                              const subgroupsForGroup = db.subgroups.filter(s => s.groupId === grupo.id);

                              return (
                                <div
                                  key={grupo.id}
                                  className={`rounded border text-xs ${
                                    isGroupSelected
                                      ? 'border-neutral-900 bg-neutral-100'
                                      : 'border-neutral-200 bg-neutral-50/50'
                                  }`}
                                >
                                  <div className="p-2 flex items-center justify-between gap-1">
                                    <div
                                      className="flex items-center gap-1.5 cursor-pointer flex-1 truncate"
                                      onClick={() => {
                                        setSelectedGroupId(isGroupSelected ? null : grupo.id);
                                        setSelectedSubgroupId(null);
                                      }}
                                    >
                                      <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-neutral-200 text-neutral-800">
                                        {grupo.code}
                                      </span>
                                      <span className="font-medium text-neutral-800 truncate">
                                        {grupo.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                      <button
                                        onClick={() => handleOpenGroupModal(tipo, grupo)}
                                        className="p-1 text-neutral-400 hover:text-neutral-700"
                                      >
                                        <Edit2 className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (subgroupsForGroup.length > 0) {
                                            alert('Não é possível excluir Grupo com Subgrupos vinculados.');
                                            return;
                                          }
                                          if (confirm(`Excluir Grupo "${grupo.name}"?`)) {
                                            onDeleteGroup(grupo.id);
                                          }
                                        }}
                                        className="p-1 text-neutral-400 hover:text-red-600"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Subgrupos */}
                                  {isGroupSelected && (
                                    <div className="pl-3 pr-2 pb-2 pt-1 border-t border-neutral-200 space-y-1">
                                      {subgroupsForGroup.length === 0 ? (
                                        <div className="text-[10px] text-neutral-400 italic">
                                          Nenhum subgrupo.{' '}
                                          <button
                                            onClick={() => handleOpenSubgroupModal(grupo)}
                                            className="text-red-600 font-semibold underline"
                                          >
                                            + Subgrupo
                                          </button>
                                        </div>
                                      ) : (
                                        subgroupsForGroup.map(sub => {
                                          const isSubSelected = selectedSubgroupId === sub.id;
                                          return (
                                            <div
                                              key={sub.id}
                                              className={`p-1.5 rounded flex items-center justify-between text-[11px] ${
                                                isSubSelected
                                                  ? 'bg-red-700 text-white'
                                                  : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200'
                                              }`}
                                            >
                                              <div
                                                className="cursor-pointer truncate flex-1"
                                                onClick={() =>
                                                  setSelectedSubgroupId(isSubSelected ? null : sub.id)
                                                }
                                              >
                                                <span className="font-mono text-[9px] mr-1 opacity-80">
                                                  {sub.code}
                                                </span>
                                                <span className="font-medium">{sub.name}</span>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={() => handleOpenSubgroupModal(grupo, sub)}
                                                  className={`p-0.5 ${
                                                    isSubSelected ? 'text-white' : 'text-neutral-400 hover:text-neutral-700'
                                                  }`}
                                                >
                                                  <Edit2 className="w-2.5 h-2.5" />
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    const hasArticles = db.articles.some(
                                                      a => a.subgroupId === sub.id
                                                    );
                                                    if (hasArticles) {
                                                      alert('Não é possível excluir Subgrupo com Artigos vinculados.');
                                                      return;
                                                    }
                                                    if (confirm(`Excluir Subgrupo "${sub.name}"?`)) {
                                                      onDeleteSubgroup(sub.id);
                                                    }
                                                  }}
                                                  className={`p-0.5 ${
                                                    isSubSelected ? 'text-white' : 'text-neutral-400 hover:text-red-600'
                                                  }`}
                                                >
                                                  <Trash2 className="w-2.5 h-2.5" />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                      <button
                                        onClick={() => handleOpenSubgroupModal(grupo)}
                                        className="w-full text-center py-1 rounded bg-neutral-200/60 hover:bg-neutral-200 text-neutral-700 text-[10px] font-semibold"
                                      >
                                        + Novo Subgrupo em {grupo.name}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                          <button
                            onClick={() => handleOpenGroupModal(tipo)}
                            className="w-full text-center py-1 rounded bg-neutral-200/60 hover:bg-neutral-200 text-neutral-700 text-[10px] font-semibold"
                          >
                            + Novo Grupo em {tipo.name}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Articles Table Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
            {/* Search and Filters bar */}
            <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50/50">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar artigo por código, nome ou specs..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none bg-white"
                />
              </div>

              <div className="text-xs text-neutral-500 flex items-center gap-2 w-full sm:w-auto justify-end">
                <span>
                  Exibindo <strong>{filteredArticles.length}</strong> de <strong>{db.articles.length}</strong> artigo(s)
                </span>
              </div>
            </div>

            {/* Articles Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-100 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Código Único Hierárquico</th>
                    <th className="py-3 px-4">Artigo & Detalhes</th>
                    <th className="py-3 px-4 text-center">Unidade</th>
                    <th className="py-3 px-4 text-right">Mínimo</th>
                    <th className="py-3 px-4 text-right">Saldo Atual</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-400">
                        <Box className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                        <div className="font-semibold text-neutral-700 text-sm">
                          Nenhum artigo encontrado
                        </div>
                        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                          {db.subgroups.length === 0
                            ? 'Cadastre Tipo, Grupo e Subgrupo antes de criar Artigos.'
                            : 'Clique no botão "+ Novo Artigo" para cadastrar o primeiro material.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map(art => {
                      const parentSub = db.subgroups.find(s => s.id === art.subgroupId);
                      const isLowStock = art.currentStock <= art.minStock;

                      return (
                        <tr key={art.id} className="hover:bg-neutral-50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                            <span className="px-2 py-1 rounded bg-neutral-100 border border-neutral-200">
                              {art.code}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-neutral-900 text-sm">{art.name}</div>
                            {art.technicalSpecs && (
                              <div className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                                {art.technicalSpecs}
                              </div>
                            )}
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              Subgrupo: {parentSub ? parentSub.name : '—'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded bg-neutral-100 font-mono text-[11px] font-semibold">
                              {art.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-neutral-500">
                            {art.minStock}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            <span
                              className={`font-bold px-2 py-0.5 rounded ${
                                isLowStock
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {art.currentStock}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenArticleModal(parentSub, art)}
                                className="p-1 text-neutral-500 hover:text-neutral-900 rounded"
                                title="Editar Artigo"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  const hasMovements = db.movements.some(
                                    m => m.articleId === art.id
                                  );
                                  if (hasMovements) {
                                    alert(
                                      'Atenção: Este artigo já possui movimentações de estoque registradas e não pode ser excluído por conformidade de auditoria.'
                                    );
                                    return;
                                  }
                                  if (confirm(`Excluir Artigo "${art.name}" (${art.code})?`)) {
                                    onDeleteArticle(art.id);
                                  }
                                }}
                                className="p-1 text-neutral-500 hover:text-red-600 rounded"
                                title="Excluir Artigo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: TIPO */}
      {modalMode === 'type' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-neutral-300 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              {editingItem ? 'Editar Tipo de Material' : 'Cadastrar Novo Tipo'}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Nível 1 da hierarquia (Ex: Mecânica Industrial, Eletroeletrônica, EPIs)
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitType} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Código Único do Tipo (Gerado Automaticamente)
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-xs uppercase font-bold focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Exemplo padrão: TIP-01, TIP-02
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome do Tipo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mecânica e Usinagem"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes ou escopo desta categoria..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs"
                >
                  Salvar Tipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GRUPO */}
      {modalMode === 'group' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-neutral-300 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              {editingItem ? 'Editar Grupo' : 'Cadastrar Novo Grupo'}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Nível 2 da hierarquia (Ex: Ferramentas de Corte, Condutores, Fixadores)
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Vincular ao Tipo (Pai) *
                </label>
                <select
                  required
                  value={formParentTypeId}
                  onChange={e => {
                    const newTypeId = e.target.value;
                    setFormParentTypeId(newTypeId);
                    const parent = db.types.find(t => t.id === newTypeId);
                    if (parent && !editingItem) {
                      setFormCode(generateNextGroupCode(parent, db.groups));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                >
                  <option value="">Selecione o Tipo...</option>
                  {db.types.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Código Único do Grupo (Hierárquico)
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-xs uppercase font-bold focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Exemplo gerado: TIP-01.GRP-01
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome do Grupo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ferramentas de Corte"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs"
                >
                  Salvar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBGRUPO */}
      {modalMode === 'subgroup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-neutral-300 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              {editingItem ? 'Editar Subgrupo' : 'Cadastrar Novo Subgrupo'}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Nível 3 da hierarquia (Ex: Brocas HSS, Cabos Flexíveis 750V)
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSubgroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Vincular ao Grupo (Pai) *
                </label>
                <select
                  required
                  value={formParentGroupId}
                  onChange={e => {
                    const newGroupId = e.target.value;
                    setFormParentGroupId(newGroupId);
                    const parent = db.groups.find(g => g.id === newGroupId);
                    if (parent && !editingItem) {
                      setFormCode(generateNextSubgroupCode(parent, db.subgroups));
                      setFormParentTypeId(parent.typeId);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                >
                  <option value="">Selecione o Grupo...</option>
                  {db.groups.map(g => {
                    const parentType = db.types.find(t => t.id === g.typeId);
                    return (
                      <option key={g.id} value={g.id}>
                        [{g.code}] {g.name} ({parentType?.name || 'Tipo'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Código Único do Subgrupo (Hierárquico)
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-xs uppercase font-bold focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Exemplo gerado: TIP-01.GRP-01.SUB-01
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome do Subgrupo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Brocas HSS Aço Rápido"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs"
                >
                  Salvar Subgrupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ARTIGO */}
      {modalMode === 'article' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl border border-neutral-300 shadow-xl max-w-lg w-full p-6 my-8">
            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              {editingItem ? 'Editar Artigo' : 'Cadastrar Novo Artigo (Item de Estoque)'}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Nível 4 da hierarquia. Gera o código único exclusivo do material.
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitArticle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Vincular ao Subgrupo *
                </label>
                <select
                  required
                  value={formParentSubgroupId}
                  onChange={e => {
                    const newSubId = e.target.value;
                    setFormParentSubgroupId(newSubId);
                    const sub = db.subgroups.find(s => s.id === newSubId);
                    if (sub && !editingItem) {
                      setFormCode(generateNextArticleCode(sub, db.articles));
                      setFormParentGroupId(sub.groupId);
                      setFormParentTypeId(sub.typeId);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                >
                  <option value="">Selecione o Subgrupo...</option>
                  {db.subgroups.map(s => {
                    const group = db.groups.find(g => g.id === s.groupId);
                    return (
                      <option key={s.id} value={s.id}>
                        [{s.code}] {s.name} ({group?.name})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Código Único do Artigo (Gerado Automaticamente) *
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-xs uppercase font-bold focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none bg-neutral-50"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Ex: TIP-01.GRP-01.SUB-01.ART-001
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome do Artigo / Material *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Broca HSS 6,0mm DIN 338"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Unidade de Medida *
                  </label>
                  <select
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="KG">KG (Quilograma)</option>
                    <option value="M">M (Metro linear)</option>
                    <option value="M2">M² (Metro quadrado)</option>
                    <option value="L">L (Litro)</option>
                    <option value="CX">CX (Caixa)</option>
                    <option value="PAR">PAR (Par)</option>
                    <option value="PC">PC (Peça)</option>
                    <option value="RL">RL (Rolo)</option>
                    <option value="KIT">KIT (Conjunto)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Estoque Mínimo (Segurança) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formMinStock}
                    onChange={e => setFormMinStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none font-mono"
                  />
                </div>
              </div>

              {!editingItem && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Saldo Inicial (Opcional - pode iniciar com 0)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formInitialStock}
                    onChange={e => setFormInitialStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none font-mono"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Por padrão sugerido 0, pois novas entradas podem ser registradas no menu de Entrada.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Custo Unitário Estimado (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formUnitCost}
                    onChange={e => setFormUnitCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Localização Padrão
                  </label>
                  <select
                    value={formLocationId}
                    onChange={e => setFormLocationId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                  >
                    <option value="">Nenhuma ou Definir na Entrada</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        [{loc.code}] {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Especificações Técnicas / ABNT / Fabricante
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: HSS retificada DIN 338, fabricante Dormer, CA 34082..."
                  value={formSpecs}
                  onChange={e => setFormSpecs(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs"
                >
                  {editingItem ? 'Salvar Alterações' : 'Cadastrar Artigo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
