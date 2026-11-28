// Emoji + couleurs pour chaque type de cuisine (utilisé sur l'accueil et les cartes restaurant)
export interface CuisineStyle { emoji: string; from: string; to: string; }

const STYLES: Record<string, CuisineStyle> = {
  pizza: { emoji: '🍕', from: '#ff9a3c', to: '#ff5e3a' },
  italienne: { emoji: '🍝', from: '#56ab2f', to: '#a8c64a' },
  grillades: { emoji: '🍖', from: '#c0392b', to: '#e67e22' },
  tunisienne: { emoji: '🥘', from: '#e55d87', to: '#f5a25d' },
  burgers: { emoji: '🍔', from: '#f7971e', to: '#ffd200' },
  japonaise: { emoji: '🍣', from: '#ee0979', to: '#ff6a00' },
  libanaise: { emoji: '🥙', from: '#11998e', to: '#38ef7d' },
  desserts: { emoji: '🍰', from: '#fc5c7d', to: '#6a82fb' },
  'fast-food': { emoji: '🍟', from: '#f7971e', to: '#ffd200' },
};
const DEFAULT: CuisineStyle = { emoji: '🍽️', from: '#FF6B35', to: '#c0392b' };

export function cuisineStyle(name: string | undefined): CuisineStyle {
  return STYLES[(name ?? '').trim().toLowerCase()] ?? DEFAULT;
}

export function cuisineGradient(name: string | undefined): string {
  const s = cuisineStyle(name);
  return `linear-gradient(135deg, ${s.from}, ${s.to})`;
}
