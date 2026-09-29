export interface ItemType {
  id: string;
  code: string; // Ex: TIP-01
  name: string;
  description?: string;
  createdAt: string;
}

export interface ItemGroup {
  id: string;
  typeId: string;
  code: string; // Ex: TIP-01.GRP-01
  name: string;
  description?: string;
  createdAt: string;
}

export interface ItemSubgroup {
  id: string;
  typeId: string;
  groupId: string;
  code: string; // Ex: TIP-01.GRP-01.SUB-01
  name: string;
  description?: string;
  createdAt: string;
}

export interface Article {
  id: string;
  typeId: string;
  groupId: string;
  subgroupId: string;
  code: string; // Ex: TIP-01.GRP-01.SUB-01.ART-001
  name: string;
  description?: string;
  unit: string; // UN, KG, M, L, CX, PAR, PC, RL, etc.
  currentStock: number;
  minStock: number;
  maxStock?: number;
  defaultLocationId?: string;
  unitCost?: number; // Preço unitário médio ou última entrada em R$
  technicalSpecs?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageLocation {
  id: string;
  code: string; // Ex: ALM-A1-E02-P03
  name: string; // Ex: Almoxarifado Central - Prateleira A
  building: string; // Ex: Bloco A - Mecânica
  zone?: string; // Ex: Corredor 2
  shelf?: string; // Ex: Estante 4, Prateleira B
  description?: string;
  active: boolean;
  createdAt: string;
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE';

export interface StockMovement {
  id: string;
  articleId: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  locationId: string;
  locationName: string;
  documentNumber?: string; // Nota Fiscal, Pedido, Requisição, OS
  batchNumber?: string; // Lote
  destinationOrRequester?: string; // Destino, Turma, Instrutor, Laboratório
  reason: string; // Motivo / Finalidade
  unitCost?: number; // R$ unitário
  responsible: string; // Responsável pelo registro da movimentação
  timestamp: string; // ISO string
  notes?: string;
}

export interface InventoryDatabase {
  types: ItemType[];
  groups: ItemGroup[];
  subgroups: ItemSubgroup[];
  articles: Article[];
  locations: StorageLocation[];
  movements: StockMovement[];
  lastUpdated: string;
  version: number;
}

export interface GitHubSyncConfig {
  token: string;
  mode: 'gist' | 'repo';
  gistId?: string;
  repoOwner?: string;
  repoName?: string;
  branch?: string;
  filePath?: string;
  autoSync: boolean;
  lastSync?: string;
}

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  target: 'github_gist' | 'github_repo' | 'google_drive_export' | 'google_drive_import' | 'local_backup';
  status: 'success' | 'error';
  message: string;
  details?: string;
}
