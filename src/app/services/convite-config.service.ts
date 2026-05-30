import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EventType } from '../models/event-type.model';

export interface SecaoItem {
    id: string;
    ativo: boolean;
    titulo?: string;
    conteudo?: string;
}

export interface ConviteConfig {
    slug: string;
    tipo: EventType;
    rotulo_personalizado?: string;
    noivo: string;
    noiva: string;
    data_casamento: string;          // ISO: '2026-08-15T19:00:00'
    local_nome: string;
    local_endereco: string;
    local_map_embed_url: string;
    local_map_link: string;
    whatsapp_noivo: string;
    whatsapp_noiva: string;
    pix_codigo: string;
    spotify_track_id: string;        // só o ID da track
    instagram: string;
    admin_senha: string;
    // aparência
    cor_primaria: string;            // ex: '#4a6e3a'
    cor_acento: string;              // ex: '#a08040'
    tema: string;                    // 'green' | 'rose' | ...
    // imagens — pode ser URL do Supabase Storage (https://...) ou path relativo legado
    foto_capa: string;
    foto_envelope: string;
    foto_share: string;
    foto_brasao: string;
    // aparência — background
    fundo_tipo: string;            // key de BACKGROUND_PRESETS, ex: 'warm'
    // layout visual
    layout: string;                // 'classico' | 'infantil'
    entrada_tipo: string;          // 'carta' | 'presente' | 'direto'
    // seções visíveis (undefined = usa padrão do tipo de evento)
    show_mapa: boolean;
    show_traje: boolean;
    show_pix: boolean;
    show_confirmacao: boolean;
    show_spotify: boolean;
    show_manual: boolean;
    // novas seções
    show_fotos: boolean;
    show_observacao: boolean;
    show_dicas_presentes: boolean;
    show_recusar: boolean;
    show_traje_pastel: boolean;
    // conteúdo das novas seções
    fotos_galeria: string;          // JSON: string[]
    observacao_texto: string;
    dicas_presentes_texto: string;
    // config de ordem e seções customizadas
    secoes_config: string;          // JSON: SecaoItem[]
}

@Injectable({ providedIn: 'root' })
export class ConviteConfigService {
    private cache = new Map<string, ConviteConfig>();
    readonly current = signal<ConviteConfig | null>(null);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    constructor(private sb: SupabaseService) {}

    async load(slug: string): Promise<ConviteConfig | null> {
        if (this.cache.has(slug)) {
            const cfg = this.cache.get(slug)!;
            this.current.set(cfg);
            return cfg;
        }

        this.loading.set(true);
        this.error.set(null);

        const { data, error } = await this.sb.client
            .from('convites')
            .select('*')
            .eq('slug', slug)
            .single();

        this.loading.set(false);

        if (error || !data) {
            this.error.set('Convite não encontrado.');
            return null;
        }

        const cfg = { ...data, tipo: (data['tipo'] || 'casamento') } as ConviteConfig;
        this.cache.set(slug, cfg);
        this.current.set(cfg);
        return cfg;
    }

    async save(cfg: Partial<ConviteConfig> & { slug: string }): Promise<void> {
        await this.sb.client.from('convites').upsert(cfg, { onConflict: 'slug' });
        this.cache.delete(cfg.slug);
        await this.load(cfg.slug);
    }

    /** Atualiza apenas os campos informados em um evento existente (não faz insert) */
    async updateFields(slug: string, fields: Partial<ConviteConfig>): Promise<void> {
        const { error } = await this.sb.client
            .from('convites')
            .update(fields)
            .eq('slug', slug);
        if (error) throw new Error(error.message);
        this.cache.delete(slug);
        await this.load(slug);
    }

    /** Resolve URL de imagem: URLs do Supabase Storage são usadas diretamente;
     *  paths legados (ex: "capa.jpg") são resolvidos para assets/<slug>/arquivo */
    resolveImageUrl(url: string | undefined | null, slug: string): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `assets/${slug}/${url}`;
    }
}
