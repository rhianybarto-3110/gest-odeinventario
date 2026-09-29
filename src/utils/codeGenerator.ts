import { ItemType, ItemGroup, ItemSubgroup, Article, StorageLocation } from '../types/inventory';

export function padZero(num: number, size = 2): string {
  let s = num.toString();
  while (s.length < size) s = '0' + s;
  return s;
}

/**
 * Gera código automático para Tipo (Ex: TIP-01)
 */
export function generateNextTypeCode(existingTypes: ItemType[], prefix = 'TIP'): string {
  const existingNumbers = existingTypes
    .map(t => {
      const match = t.code.match(new RegExp(`^${prefix}-(\\d+)`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);

  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${prefix}-${padZero(nextNumber, 2)}`;
}

/**
 * Gera código automático para Grupo dentro de um Tipo (Ex: TIP-01.GRP-01)
 */
export function generateNextGroupCode(
  parentType: ItemType,
  existingGroups: ItemGroup[],
  prefix = 'GRP'
): string {
  const siblings = existingGroups.filter(g => g.typeId === parentType.id);
  const existingNumbers = siblings
    .map(g => {
      const parts = g.code.split(`.${prefix}-`);
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    })
    .filter(n => n > 0);

  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${parentType.code}.${prefix}-${padZero(nextNumber, 2)}`;
}

/**
 * Gera código automático para Subgrupo dentro de um Grupo (Ex: TIP-01.GRP-01.SUB-01)
 */
export function generateNextSubgroupCode(
  parentGroup: ItemGroup,
  existingSubgroups: ItemSubgroup[],
  prefix = 'SUB'
): string {
  const siblings = existingSubgroups.filter(s => s.groupId === parentGroup.id);
  const existingNumbers = siblings
    .map(s => {
      const parts = s.code.split(`.${prefix}-`);
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    })
    .filter(n => n > 0);

  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${parentGroup.code}.${prefix}-${padZero(nextNumber, 2)}`;
}

/**
 * Gera código automático para Artigo dentro de um Subgrupo (Ex: TIP-01.GRP-01.SUB-01.ART-001)
 */
export function generateNextArticleCode(
  parentSubgroup: ItemSubgroup,
  existingArticles: Article[],
  prefix = 'ART'
): string {
  const siblings = existingArticles.filter(a => a.subgroupId === parentSubgroup.id);
  const existingNumbers = siblings
    .map(a => {
      const parts = a.code.split(`.${prefix}-`);
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    })
    .filter(n => n > 0);

  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${parentSubgroup.code}.${prefix}-${padZero(nextNumber, 3)}`;
}

/**
 * Gera código automático para Localização (Ex: LOC-01 ou ALM-01)
 */
export function generateNextLocationCode(existingLocations: StorageLocation[], prefix = 'LOC'): string {
  const existingNumbers = existingLocations
    .map(l => {
      const match = l.code.match(new RegExp(`^${prefix}-(\\d+)`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);

  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${prefix}-${padZero(nextNumber, 2)}`;
}
