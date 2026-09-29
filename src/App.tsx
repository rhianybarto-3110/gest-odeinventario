/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  InventoryDatabase,
  ItemType,
  ItemGroup,
  ItemSubgroup,
  Article,
  StorageLocation,
  StockMovement,
} from './types/inventory';
import {
  loadDatabase,
  saveDatabase,
  INITIAL_EMPTY_DB,
  getSampleSENAIWorkshopData,
  loadGitHubConfig,
  pushToGitHub,
} from './services/storage';
import { Navbar, ActiveTab } from './components/Navbar';
import { Footer } from './components/Footer';
import { DashboardView } from './components/DashboardView';
import { HierarchyView } from './components/HierarchyView';
import { LocationsView } from './components/LocationsView';
import { StockEntryView } from './components/StockEntryView';
import { StockExitView } from './components/StockExitView';
import { ReportsView } from './components/ReportsView';
import { SyncView } from './components/SyncView';
import { OnboardingModal } from './components/OnboardingModal';

export default function App() {
  const [db, setDb] = useState<InventoryDatabase>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    // Abre automaticamente no primeiro uso se não tiver sido concluído antes
    try {
      return !localStorage.getItem('senai_onboarding_completed');
    } catch {
      return false;
    }
  });

  // Save to persistent local storage on state update
  const updateDbAndSave = useCallback((newDb: InventoryDatabase) => {
    setDb(newDb);
    saveDatabase(newDb);

    // Auto-sync with GitHub in background if configured
    try {
      const ghConfig = loadGitHubConfig();
      if (ghConfig.autoSync && ghConfig.token) {
        pushToGitHub(newDb, ghConfig).catch(err => {
          console.warn('Auto-sync GitHub background warning:', err);
        });
      }
    } catch (err) {
      // Ignora erro de auto-sync em background
    }
  }, []);

  // Listen to multi-tab sync
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('senai_estoque_sync');
      channel.onmessage = event => {
        if (event.data?.type === 'DATABASE_UPDATED') {
          const fresh = loadDatabase();
          setDb(fresh);
        }
      };
      return () => {
        channel.close();
      };
    } catch {
      // BroadcastChannel opcional
    }
  }, []);

  // Tipo handlers
  const handleSaveType = (type: ItemType) => {
    const existingIndex = db.types.findIndex(t => t.id === type.id);
    let updatedTypes: ItemType[];
    if (existingIndex >= 0) {
      updatedTypes = [...db.types];
      updatedTypes[existingIndex] = type;
    } else {
      updatedTypes = [...db.types, type];
    }
    updateDbAndSave({ ...db, types: updatedTypes });
  };

  const handleDeleteType = (typeId: string) => {
    const updatedTypes = db.types.filter(t => t.id !== typeId);
    updateDbAndSave({ ...db, types: updatedTypes });
  };

  // Grupo handlers
  const handleSaveGroup = (group: ItemGroup) => {
    const existingIndex = db.groups.findIndex(g => g.id === group.id);
    let updatedGroups: ItemGroup[];
    if (existingIndex >= 0) {
      updatedGroups = [...db.groups];
      updatedGroups[existingIndex] = group;
    } else {
      updatedGroups = [...db.groups, group];
    }
    updateDbAndSave({ ...db, groups: updatedGroups });
  };

  const handleDeleteGroup = (groupId: string) => {
    const updatedGroups = db.groups.filter(g => g.id !== groupId);
    updateDbAndSave({ ...db, groups: updatedGroups });
  };

  // Subgrupo handlers
  const handleSaveSubgroup = (subgroup: ItemSubgroup) => {
    const existingIndex = db.subgroups.findIndex(s => s.id === subgroup.id);
    let updatedSubgroups: ItemSubgroup[];
    if (existingIndex >= 0) {
      updatedSubgroups = [...db.subgroups];
      updatedSubgroups[existingIndex] = subgroup;
    } else {
      updatedSubgroups = [...db.subgroups, subgroup];
    }
    updateDbAndSave({ ...db, subgroups: updatedSubgroups });
  };

  const handleDeleteSubgroup = (subgroupId: string) => {
    const updatedSubgroups = db.subgroups.filter(s => s.id !== subgroupId);
    updateDbAndSave({ ...db, subgroups: updatedSubgroups });
  };

  // Artigo handlers
  const handleSaveArticle = (article: Article) => {
    const existingIndex = db.articles.findIndex(a => a.id === article.id);
    let updatedArticles: Article[];
    if (existingIndex >= 0) {
      updatedArticles = [...db.articles];
      updatedArticles[existingIndex] = article;
    } else {
      updatedArticles = [...db.articles, article];
    }
    updateDbAndSave({ ...db, articles: updatedArticles });
  };

  const handleDeleteArticle = (articleId: string) => {
    const updatedArticles = db.articles.filter(a => a.id !== articleId);
    updateDbAndSave({ ...db, articles: updatedArticles });
  };

  // Localização handlers
  const handleSaveLocation = (loc: StorageLocation) => {
    const existingIndex = db.locations.findIndex(l => l.id === loc.id);
    let updatedLocs: StorageLocation[];
    if (existingIndex >= 0) {
      updatedLocs = [...db.locations];
      updatedLocs[existingIndex] = loc;
    } else {
      updatedLocs = [...db.locations, loc];
    }
    updateDbAndSave({ ...db, locations: updatedLocs });
  };

  const handleDeleteLocation = (locId: string) => {
    const updatedLocs = db.locations.filter(l => l.id !== locId);
    updateDbAndSave({ ...db, locations: updatedLocs });
  };

  // Movimentação handler (Entrada ou Saída)
  const handleRecordMovement = (movement: StockMovement) => {
    const targetArticleIndex = db.articles.findIndex(a => a.id === movement.articleId);
    if (targetArticleIndex === -1) return;

    const targetArticle = db.articles[targetArticleIndex];
    let newStock = targetArticle.currentStock;

    if (movement.type === 'ENTRADA') {
      newStock += movement.quantity;
    } else if (movement.type === 'SAIDA') {
      newStock = Math.max(0, newStock - movement.quantity);
    }

    const updatedArticle: Article = {
      ...targetArticle,
      currentStock: newStock,
      defaultLocationId: movement.locationId || targetArticle.defaultLocationId,
      unitCost: movement.unitCost !== undefined ? movement.unitCost : targetArticle.unitCost,
      updatedAt: new Date().toISOString(),
    };

    const updatedArticles = [...db.articles];
    updatedArticles[targetArticleIndex] = updatedArticle;

    const updatedMovements = [movement, ...db.movements];

    updateDbAndSave({
      ...db,
      articles: updatedArticles,
      movements: updatedMovements,
    });
  };

  // Carregar dados de amostra (Didático SENAI-SP)
  const handleLoadSampleData = () => {
    if (
      confirm(
        'Deseja carregar a amostra de dados didática com oficinas de mecânica, comandos elétricos e EPIs?'
      )
    ) {
      const sample = getSampleSENAIWorkshopData();
      updateDbAndSave(sample);
      setActiveTab('dashboard');
    }
  };

  // Resetar banco para estrutura vazia
  const handleResetDatabase = () => {
    if (
      confirm(
        'Atenção: Esta ação limpará todos os artigos, hierarquias, movimentações e localizações, deixando a estrutura 100% vazia para testes. Deseja continuar?'
      )
    ) {
      const empty = { ...INITIAL_EMPTY_DB, lastUpdated: new Date().toISOString() };
      updateDbAndSave(empty);
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 text-neutral-900 selection:bg-red-200 selection:text-red-900">
      {/* Header and Menu Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        db={db}
        onOpenSync={() => setActiveTab('sync')}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            db={db}
            setActiveTab={setActiveTab}
            onLoadSampleData={handleLoadSampleData}
            onOpenTutorial={() => setIsTutorialOpen(true)}
          />
        )}

        {activeTab === 'hierarchy' && (
          <HierarchyView
            db={db}
            onSaveType={handleSaveType}
            onDeleteType={handleDeleteType}
            onSaveGroup={handleSaveGroup}
            onDeleteGroup={handleDeleteGroup}
            onSaveSubgroup={handleSaveSubgroup}
            onDeleteSubgroup={handleDeleteSubgroup}
            onSaveArticle={handleSaveArticle}
            onDeleteArticle={handleDeleteArticle}
            locations={db.locations}
          />
        )}

        {activeTab === 'locations' && (
          <LocationsView
            db={db}
            onSaveLocation={handleSaveLocation}
            onDeleteLocation={handleDeleteLocation}
          />
        )}

        {activeTab === 'entry' && (
          <StockEntryView
            db={db}
            onRecordMovement={handleRecordMovement}
            onNavigateToHierarchy={() => setActiveTab('hierarchy')}
            onNavigateToLocations={() => setActiveTab('locations')}
          />
        )}

        {activeTab === 'exit' && (
          <StockExitView
            db={db}
            onRecordMovement={handleRecordMovement}
            onNavigateToHierarchy={() => setActiveTab('hierarchy')}
          />
        )}

        {activeTab === 'reports' && <ReportsView db={db} />}

        {activeTab === 'sync' && (
          <SyncView
            db={db}
            onUpdateDatabase={updateDbAndSave}
            onLoadSampleData={handleLoadSampleData}
            onResetDatabase={handleResetDatabase}
          />
        )}
      </main>

      {/* Interactive Onboarding Tour Modal */}
      <OnboardingModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        setActiveTab={setActiveTab}
        onLoadSampleData={handleLoadSampleData}
        hasArticles={db.articles.length > 0}
      />

      {/* Technical Responsibility and Institutional Footer */}
      <Footer db={db} />
    </div>
  );
}
