export interface ColorTheme {
    key: string;
    label: string;
    cor_primaria: string;
    cor_acento: string;
}

export interface BackgroundPreset {
    key: string;
    label: string;
    css: string;
    fadeColor: string; // cor final do gradiente — usada no fade da foto hero
    dark?: boolean;    // texto claro sobre fundo escuro
}

export const COLOR_THEMES: ColorTheme[] = [
    { key: 'forest',     label: 'Floresta',   cor_primaria: '#4a6e3a', cor_acento: '#a08040' },
    { key: 'rose',       label: 'Rosa',       cor_primaria: '#8b3a52', cor_acento: '#c4856a' },
    { key: 'ocean',      label: 'Oceano',     cor_primaria: '#1e4a6e', cor_acento: '#4a90a8' },
    { key: 'gold',       label: 'Dourado',    cor_primaria: '#7a5020', cor_acento: '#c4a050' },
    { key: 'plum',       label: 'Ameixa',     cor_primaria: '#5a2d6e', cor_acento: '#b06890' },
    { key: 'slate',      label: 'Ardósia',    cor_primaria: '#2d4a5a', cor_acento: '#6a9a8a' },
    { key: 'terracotta', label: 'Terracota',  cor_primaria: '#7a3a2a', cor_acento: '#c4804a' },
    { key: 'sage',       label: 'Sálvia',     cor_primaria: '#3a5a4a', cor_acento: '#8ab090' },
    { key: 'burgundy',   label: 'Borgonha',   cor_primaria: '#6e1e2e', cor_acento: '#a06848' },
    { key: 'navy',       label: 'Marinho',    cor_primaria: '#1a2a4e', cor_acento: '#7090b8' },
    { key: 'blush',      label: 'Blush',      cor_primaria: '#9a4a6a', cor_acento: '#d4a070' },
    { key: 'custom',     label: 'Personaliz.',cor_primaria: '',        cor_acento: '' },
];

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
    { key: 'warm',   label: 'Creme',      css: 'linear-gradient(160deg, #f5f2ea 0%, #e8e2d0 100%)', fadeColor: '#e8e2d0' },
    { key: 'white',  label: 'Branco',     css: 'linear-gradient(160deg, #fefefe 0%, #f5f5f5 100%)', fadeColor: '#f5f5f5' },
    { key: 'blush',  label: 'Rosê',       css: 'linear-gradient(160deg, #fdf2f2 0%, #f0e4e4 100%)', fadeColor: '#f0e4e4' },
    { key: 'sage',   label: 'Sage',       css: 'linear-gradient(160deg, #f2f5f0 0%, #e4ece0 100%)', fadeColor: '#e4ece0' },
    { key: 'stone',  label: 'Pedra',      css: 'linear-gradient(160deg, #f2f0ee 0%, #e2deda 100%)', fadeColor: '#e2deda' },
    { key: 'sky',    label: 'Céu',        css: 'linear-gradient(160deg, #f0f4fd 0%, #e0eaf8 100%)', fadeColor: '#e0eaf8' },
    { key: 'amber',  label: 'Âmbar',      css: 'linear-gradient(160deg, #fdf5e4 0%, #f0e4c4 100%)', fadeColor: '#f0e4c4' },
    { key: 'dusk',   label: 'Entardecer', css: 'linear-gradient(160deg, #f5eef5 0%, #e8dce8 100%)', fadeColor: '#e8dce8' },
    { key: 'night',  label: 'Noturno',    css: 'linear-gradient(160deg, #1a1a2a 0%, #0e0e18 100%)', fadeColor: '#0e0e18', dark: true },
    { key: 'forest', label: 'Bosque',     css: 'linear-gradient(160deg, #1a2a1a 0%, #0e180e 100%)', fadeColor: '#0e180e', dark: true },
    { key: 'wine',   label: 'Vinho',      css: 'linear-gradient(160deg, #2a1a1e 0%, #180e10 100%)', fadeColor: '#180e10', dark: true },
    { key: 'ocean',  label: 'Mar',        css: 'linear-gradient(160deg, #0e1a2a 0%, #060e18 100%)', fadeColor: '#060e18', dark: true },
];
