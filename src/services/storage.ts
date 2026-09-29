import {
  InventoryDatabase,
  GitHubSyncConfig,
  SyncHistoryEntry,
  ItemType,
  ItemGroup,
  ItemSubgroup,
  Article,
  StorageLocation,
  StockMovement,
} from '../types/inventory';

const STORAGE_KEY = 'senai_sp_estoque_db_v1';
const GITHUB_CONFIG_KEY = 'senai_sp_github_config_v1';
const SYNC_HISTORY_KEY = 'senai_sp_sync_history_v1';

export const INITIAL_EMPTY_DB: InventoryDatabase = {
  types: [],
  groups: [],
  subgroups: [],
  articles: [],
  locations: [],
  movements: [],
  lastUpdated: new Date().toISOString(),
  version: 1,
};

/**
 * Carrega o banco de dados do armazenamento local.
 * Inicia 100% vazio conforme requisito.
 */
export function loadDatabase(): InventoryDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...INITIAL_EMPTY_DB, lastUpdated: new Date().toISOString() };
    }
    const parsed = JSON.parse(raw);
    return {
      types: Array.isArray(parsed.types) ? parsed.types : [],
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      subgroups: Array.isArray(parsed.subgroups) ? parsed.subgroups : [],
      articles: Array.isArray(parsed.articles) ? parsed.articles : [],
      locations: Array.isArray(parsed.locations) ? parsed.locations : [],
      movements: Array.isArray(parsed.movements) ? parsed.movements : [],
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      version: parsed.version || 1,
    };
  } catch (error) {
    console.error('Erro ao carregar banco local:', error);
    return { ...INITIAL_EMPTY_DB, lastUpdated: new Date().toISOString() };
  }
}

/**
 * Salva o banco de dados no localStorage.
 */
export function saveDatabase(db: InventoryDatabase): void {
  try {
    const toSave: InventoryDatabase = {
      ...db,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));

    // Notificar outras abas caso estejam abertas
    try {
      const channel = new BroadcastChannel('senai_estoque_sync');
      channel.postMessage({ type: 'DATABASE_UPDATED', timestamp: Date.now() });
      channel.close();
    } catch {
      // BroadcastChannel opcional
    }
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
}

/**
 * Carrega a configuração do GitHub
 */
export function loadGitHubConfig(): GitHubSyncConfig {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (!raw) {
      return {
        token: '',
        mode: 'gist',
        autoSync: false,
        branch: 'main',
        filePath: 'senai_sp_estoque_db.json',
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      token: '',
      mode: 'gist',
      autoSync: false,
      branch: 'main',
      filePath: 'senai_sp_estoque_db.json',
    };
  }
}

/**
 * Salva a configuração do GitHub
 */
export function saveGitHubConfig(config: GitHubSyncConfig): void {
  localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Histórico de sincronizações
 */
export function loadSyncHistory(): SyncHistoryEntry[] {
  try {
    const raw = localStorage.getItem(SYNC_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSyncHistoryEntry(entry: Omit<SyncHistoryEntry, 'id' | 'timestamp'>): void {
  try {
    const history = loadSyncHistory();
    const newEntry: SyncHistoryEntry = {
      ...entry,
      id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...history].slice(0, 50); // manter últimos 50
    localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Erro ao salvar histórico de sync:', err);
  }
}

/**
 * Sincroniza dados com GitHub (Gist ou Repositório com commit versionado)
 */
export async function pushToGitHub(
  db: InventoryDatabase,
  config: GitHubSyncConfig,
  commitSummary?: string
): Promise<{ success: boolean; message: string; details?: string; gistId?: string }> {
  if (!config.token.trim()) {
    throw new Error('Token de Acesso Pessoal (PAT) do GitHub não configurado.');
  }

  const payloadString = JSON.stringify(db, null, 2);
  const movementCount = db.movements.length;
  const articleCount = db.articles.length;
  const summaryMsg =
    commitSummary ||
    `SENAI-SP Estoque: Sincronização automática (${articleCount} artigos, ${movementCount} movimentações)`;

  if (config.mode === 'gist') {
    // Sincronização via GitHub Gist
    const filename = 'senai_sp_estoque_db.json';
    const gistData = {
      description: `SENAI-SP SIGE - Banco de Dados de Inventário [${new Date().toLocaleString('pt-BR')}]`,
      public: false,
      files: {
        [filename]: {
          content: payloadString,
        },
      },
    };

    let url = 'https://api.github.com/gists';
    let method = 'POST';

    if (config.gistId && config.gistId.trim()) {
      url = `https://api.github.com/gists/${config.gistId.trim()}`;
      method = 'PATCH';
    }

    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.token.trim()}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(gistData),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const msg = errJson.message || `Erro HTTP ${response.status} ao sincronizar com GitHub Gist`;
      addSyncHistoryEntry({
        target: 'github_gist',
        status: 'error',
        message: 'Falha ao sincronizar com GitHub Gist',
        details: msg,
      });
      return { success: false, message: msg };
    }

    const result = await response.json();
    const newGistId = result.id;

    addSyncHistoryEntry({
      target: 'github_gist',
      status: 'success',
      message: `Sincronizado com sucesso no GitHub Gist (${result.id})`,
      details: summaryMsg,
    });

    return {
      success: true,
      message: 'Dados persistidos com sucesso no GitHub Gist!',
      gistId: newGistId,
      details: result.html_url,
    };
  } else {
    // Sincronização via Repositório GitHub
    if (!config.repoOwner || !config.repoName) {
      throw new Error('Informe o proprietário (owner) e o nome do repositório GitHub.');
    }

    const owner = config.repoOwner.trim();
    const repo = config.repoName.trim();
    const branch = config.branch?.trim() || 'main';
    const filePath = config.filePath?.trim() || 'senai_sp_estoque_db.json';

    // 1. Obter SHA do arquivo se já existir no repositório
    let fileSha: string | undefined;
    try {
      const getFileRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${config.token.trim()}`,
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );
      if (getFileRes.ok) {
        const fileInfo = await getFileRes.json();
        fileSha = fileInfo.sha;
      }
    } catch {
      // Arquivo ainda não existe, será criado
    }

    // Converter para base64 UTF-8 seguro
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(payloadString);
    let binary = '';
    for (let i = 0; i < dataBytes.byteLength; i++) {
      binary += String.fromCharCode(dataBytes[i]);
    }
    const base64Content = btoa(binary);

    const commitBody: Record<string, any> = {
      message: summaryMsg,
      content: base64Content,
      branch: branch,
    };
    if (fileSha) {
      commitBody.sha = fileSha;
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${config.token.trim()}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify(commitBody),
      }
    );

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      const msg = errJson.message || `Erro HTTP ${putRes.status} no GitHub Repo`;
      addSyncHistoryEntry({
        target: 'github_repo',
        status: 'error',
        message: 'Falha ao commitar no repositório GitHub',
        details: msg,
      });
      return { success: false, message: msg };
    }

    const commitResult = await putRes.json();
    addSyncHistoryEntry({
      target: 'github_repo',
      status: 'success',
      message: `Commit realizado com sucesso: ${commitResult.commit?.sha?.substring(0, 7) || 'OK'}`,
      details: summaryMsg,
    });

    return {
      success: true,
      message: 'Commit de inventário salvo com sucesso no GitHub!',
      details: commitResult.commit?.html_url,
    };
  }
}

/**
 * Puxa dados do GitHub (Gist ou Repo)
 */
export async function pullFromGitHub(config: GitHubSyncConfig): Promise<InventoryDatabase> {
  if (!config.token.trim()) {
    throw new Error('Token do GitHub não configurado.');
  }

  if (config.mode === 'gist') {
    if (!config.gistId) {
      throw new Error('ID do Gist não configurado para download.');
    }
    const response = await fetch(`https://api.github.com/gists/${config.gistId.trim()}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.token.trim()}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao baixar Gist: HTTP ${response.status}`);
    }

    const gist = await response.json();
    const filename = 'senai_sp_estoque_db.json';
    const file = gist.files[filename] || Object.values(gist.files)[0];

    if (!file || !file.content) {
      throw new Error('Conteúdo do banco de dados não encontrado no Gist.');
    }

    const parsed = JSON.parse(file.content);
    return parsed;
  } else {
    if (!config.repoOwner || !config.repoName) {
      throw new Error('Informe o repositório para carregar os dados.');
    }
    const owner = config.repoOwner.trim();
    const repo = config.repoName.trim();
    const branch = config.branch?.trim() || 'main';
    const filePath = config.filePath?.trim() || 'senai_sp_estoque_db.json';

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${config.token.trim()}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Erro ao buscar arquivo do repositório: HTTP ${res.status}`);
    }

    const fileInfo = await res.json();
    const binary = atob(fileInfo.content.replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decodedText = new TextDecoder().decode(bytes);
    return JSON.parse(decodedText);
  }
}

/**
 * Exporta arquivo JSON para download / Google Drive
 */
export function exportDatabaseToFile(db: InventoryDatabase): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchor = document.createElement('a');
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
  const filename = `SENAI_SP_Estoque_Backup_${dateStr}_${timeStr}.json`;

  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  addSyncHistoryEntry({
    target: 'google_drive_export',
    status: 'success',
    message: `Arquivo de backup exportado: ${filename}`,
    details: 'Arquivo pronto para upload ou arquivamento no Google Drive',
  });
}

/**
 * Importa arquivo JSON restaurando o banco de dados
 */
export function validateAndParseImportedJson(jsonText: string): InventoryDatabase {
  const parsed = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('O arquivo não contém um objeto JSON válido.');
  }

  // Sanitização e validação das estruturas
  const validatedDb: InventoryDatabase = {
    types: Array.isArray(parsed.types) ? parsed.types : [],
    groups: Array.isArray(parsed.groups) ? parsed.groups : [],
    subgroups: Array.isArray(parsed.subgroups) ? parsed.subgroups : [],
    articles: Array.isArray(parsed.articles) ? parsed.articles : [],
    locations: Array.isArray(parsed.locations) ? parsed.locations : [],
    movements: Array.isArray(parsed.movements) ? parsed.movements : [],
    lastUpdated: new Date().toISOString(),
    version: parsed.version || 1,
  };

  addSyncHistoryEntry({
    target: 'google_drive_import',
    status: 'success',
    message: `Banco restaurado com sucesso (${validatedDb.articles.length} artigos, ${validatedDb.movements.length} movimentações)`,
  });

  return validatedDb;
}

/**
 * Amostra Didática de Dados SENAI SP (Opcional - ativada apenas se o usuário clicar no botão correspondente)
 */
export function getSampleSENAIWorkshopData(): InventoryDatabase {
  const now = new Date().toISOString();

  const types: ItemType[] = [
    {
      id: 'tip_1',
      code: 'TIP-01',
      name: 'Mecânica e Usinagem Industrial',
      description: 'Ferramentas de usinagem, corte, fixação e componentes mecânicos',
      createdAt: now,
    },
    {
      id: 'tip_2',
      code: 'TIP-02',
      name: 'Eletroeletrônica e Automação',
      description: 'Materiais elétricos de comando, cabos, sensores e CLPs',
      createdAt: now,
    },
    {
      id: 'tip_3',
      code: 'TIP-03',
      name: 'EPI e Segurança do Trabalho',
      description: 'Equipamentos de proteção individual para oficinas e laboratórios',
      createdAt: now,
    },
  ];

  const groups: ItemGroup[] = [
    {
      id: 'grp_1',
      typeId: 'tip_1',
      code: 'TIP-01.GRP-01',
      name: 'Ferramentas de Corte',
      description: 'Brocas, machos, fresas e pastilhas intercambiáveis',
      createdAt: now,
    },
    {
      id: 'grp_2',
      typeId: 'tip_2',
      code: 'TIP-02.GRP-01',
      name: 'Cabos e Condutores',
      description: 'Fios e cabos flexíveis de comando e potência',
      createdAt: now,
    },
    {
      id: 'grp_3',
      typeId: 'tip_3',
      code: 'TIP-03.GRP-01',
      name: 'Proteção Ocular e Auditiva',
      description: 'Óculos de proteção ampla visão e protetores auriculares',
      createdAt: now,
    },
  ];

  const subgroups: ItemSubgroup[] = [
    {
      id: 'sub_1',
      typeId: 'tip_1',
      groupId: 'grp_1',
      code: 'TIP-01.GRP-01.SUB-01',
      name: 'Brocas HSS Aço Rápido',
      description: 'Brocas cilíndricas DIN 338 para furação industrial',
      createdAt: now,
    },
    {
      id: 'sub_2',
      typeId: 'tip_2',
      groupId: 'grp_2',
      code: 'TIP-02.GRP-01.SUB-01',
      name: 'Cabos Flexíveis 750V',
      description: 'Condutores flexíveis de cobre para montagem de painéis didáticos',
      createdAt: now,
    },
    {
      id: 'sub_3',
      typeId: 'tip_3',
      groupId: 'grp_3',
      code: 'TIP-03.GRP-01.SUB-01',
      name: 'Óculos de Segurança Incolor',
      description: 'Proteção contra impactos de partículas volantes',
      createdAt: now,
    },
  ];

  const locations: StorageLocation[] = [
    {
      id: 'loc_1',
      code: 'LOC-01',
      name: 'Almoxarifado Mecânica - Estante 01',
      building: 'Bloco A - Oficinas',
      zone: 'Corredor Central',
      shelf: 'Estante 01, Gaveta B3',
      active: true,
      createdAt: now,
    },
    {
      id: 'loc_2',
      code: 'LOC-02',
      name: 'Almoxarifado Elétrica - Painel B',
      building: 'Bloco B - Laboratórios',
      zone: 'Laboratório de Comandos',
      shelf: 'Prateleira Superior P2',
      active: true,
      createdAt: now,
    },
    {
      id: 'loc_3',
      code: 'LOC-03',
      name: 'Armário Geral de EPIs',
      building: 'Bloco C - Administração Técnica',
      zone: 'Hall de EPI',
      shelf: 'Armário de Segurança 02',
      active: true,
      createdAt: now,
    },
  ];

  const articles: Article[] = [
    {
      id: 'art_1',
      typeId: 'tip_1',
      groupId: 'grp_1',
      subgroupId: 'sub_1',
      code: 'TIP-01.GRP-01.SUB-01.ART-001',
      name: 'Broca HSS 6,0mm DIN 338 Dormer',
      description: 'Broca de aço rápido retificada para usinagem em aço carbono',
      unit: 'UN',
      currentStock: 25,
      minStock: 10,
      defaultLocationId: 'loc_1',
      unitCost: 18.5,
      technicalSpecs: 'HSS-G DIN 338, Ângulo de ponta 118º, Norma ABNT',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'art_2',
      typeId: 'tip_2',
      groupId: 'grp_2',
      subgroupId: 'sub_2',
      code: 'TIP-02.GRP-01.SUB-01.ART-001',
      name: 'Cabo Flexível 2,5mm² Azul 750V (Rolo 100m)',
      description: 'Condutor elétrico para ligação de neutro em comandos didáticos',
      unit: 'RL',
      currentStock: 6,
      minStock: 4,
      defaultLocationId: 'loc_2',
      unitCost: 195.0,
      technicalSpecs: 'Cobre eletrolítico têmpera mole, isolação PVC 70ºC anti-chama',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'art_3',
      typeId: 'tip_3',
      groupId: 'grp_3',
      subgroupId: 'sub_3',
      code: 'TIP-03.GRP-01.SUB-01.ART-001',
      name: 'Óculos de Segurança Delta Plus CA 34082',
      description: 'Óculos com lente de policarbonato incolor anti-risco',
      unit: 'UN',
      currentStock: 40,
      minStock: 20,
      defaultLocationId: 'loc_3',
      unitCost: 14.2,
      technicalSpecs: 'Certificado de Aprovação (CA) ativo, proteção UV 99.9%',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const movements: StockMovement[] = [
    {
      id: 'mov_1',
      articleId: 'art_1',
      type: 'ENTRADA',
      quantity: 30,
      previousStock: 0,
      newStock: 30,
      locationId: 'loc_1',
      locationName: 'Almoxarifado Mecânica - Estante 01',
      documentNumber: 'NF-e 004128',
      batchNumber: 'LOTE-2026-HSS',
      reason: 'Aquisição de insumos para aulas práticas do 1º Semestre',
      unitCost: 18.5,
      responsible: 'Rhiany Barto (Resp. Técnico)',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'mov_2',
      articleId: 'art_1',
      type: 'SAIDA',
      quantity: 5,
      previousStock: 30,
      newStock: 25,
      locationId: 'loc_1',
      locationName: 'Almoxarifado Mecânica - Estante 01',
      documentNumber: 'REQ-AULA-102',
      destinationOrRequester: 'Oficina de Tornearia - Turma Mecânica Industrial T2',
      reason: 'Atividade prática de furação e rosqueamento',
      responsible: 'Rhiany Barto (Resp. Técnico)',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  return {
    types,
    groups,
    subgroups,
    articles,
    locations,
    movements,
    lastUpdated: now,
    version: 1,
  };
}
