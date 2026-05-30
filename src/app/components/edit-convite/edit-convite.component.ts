import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConviteConfigService, ConviteConfig, SecaoItem } from '../../services/convite-config.service';
import { EventTypeService } from '../../services/event-type.service';
import { EventTypeConfig, EVENT_TYPES, EventType } from '../../models/event-type.model';
import { UploadService, ImageField } from '../../services/upload.service';
import { AuthService } from '../../services/auth.service';
import { InvitePreviewComponent } from '../invite-preview/invite-preview.component';
import { COLOR_THEMES, BACKGROUND_PRESETS, ColorTheme, BackgroundPreset } from '../../models/themes.model';

interface SecaoDef {
    id: string;
    label: string;
    desc: string;
    tipoBadge?: boolean;
    hasConteudo?: boolean;
}

const BUILTIN_SECTIONS: SecaoDef[] = [
    { id: 'fotos',           label: 'Fotos',                   desc: '12 fotos da aniversariante / homenageado(a)' },
    { id: 'mapa',            label: 'Mapa / Como Chegar',      desc: 'Exibe iframe do Google Maps e botão "Abrir no Maps"' },
    { id: 'traje',           label: 'Traje',                   desc: 'Exibe a seção de traje recomendado',             tipoBadge: true },
    { id: 'traje_pastel',    label: 'Sugestão: Roupa Pastel',  desc: 'Sugere que os convidados usem roupas em tons pastéis' },
    { id: 'pix',             label: 'Presentes / PIX',         desc: 'Exibe botão de cópia do código PIX',             tipoBadge: true },
    { id: 'dicas_presentes', label: 'Dicas de Presentes',      desc: 'Lista de sugestões de presentes',                hasConteudo: true },
    { id: 'confirmacao',     label: 'Confirmação de Presença', desc: 'Exibe botões de Google Agenda e confirmação via WhatsApp' },
    { id: 'recusar',         label: 'Recusar Ida ao Evento',   desc: 'Exibe botão para o convidado declinar o convite' },
    { id: 'observacao',      label: 'Observação',              desc: 'Texto livre de observação para os convidados',   hasConteudo: true },
    { id: 'spotify',         label: 'Música (Spotify)',        desc: 'Exibe o player da música. Requer ID da track na aba Links' },
    { id: 'manual',          label: 'Manual dos Convidados',   desc: 'Exibe os ícones de orientações para os convidados' },
];

@Component({
    selector: 'app-edit-convite',
    standalone: true,
    imports: [CommonModule, FormsModule, InvitePreviewComponent],
    templateUrl: './edit-convite.component.html',
    styleUrls: ['./edit-convite.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditConviteComponent implements OnInit {
    slug = '';
    draft: Partial<ConviteConfig> & { slug: string } = { slug: '' };
    eventTypeCfg: EventTypeConfig | null = null;
    saving = false;
    saved = false;
    uploadingField: ImageField | null = null;
    uploadError = '';
    activeTab: 'info' | 'visual' | 'secoes' | 'links' = 'info';

    secoes: SecaoItem[] = [];

    readonly eventTypes = EVENT_TYPES;
    readonly colorThemes: ColorTheme[] = COLOR_THEMES;
    readonly backgrounds: BackgroundPreset[] = BACKGROUND_PRESETS;
    readonly builtinSections = BUILTIN_SECTIONS;

    readonly imageFields: { field: ImageField; label: string }[] = [
        { field: 'foto_capa',     label: 'Foto de Capa' },
        { field: 'foto_envelope', label: 'Foto do Envelope' },
        { field: 'foto_share',    label: 'Foto para Compartilhar' },
        { field: 'foto_brasao',   label: 'Brasão / Logo' },
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        public configService: ConviteConfigService,
        public eventTypeService: EventTypeService,
        private uploadService: UploadService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
    ) {}

    async ngOnInit() {
        this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
        const cfg = await this.configService.load(this.slug);
        if (!cfg) { this.router.navigate([`/${this.slug}/admin`]); return; }
        // garante defaults para campos novos (spread cfg por último para não sobrescrever valores existentes)
        this.draft = {
            ...cfg,
            show_mapa:        cfg.show_mapa        ?? true,
            show_traje:       cfg.show_traje       ?? true,
            show_pix:         cfg.show_pix         ?? true,
            show_confirmacao: cfg.show_confirmacao ?? true,
            show_spotify:     cfg.show_spotify     ?? true,
            show_manual:      cfg.show_manual      ?? true,
            fundo_tipo:       cfg.fundo_tipo       ?? 'warm',
            layout:           cfg.layout           ?? 'classico',
            entrada_tipo:     cfg.entrada_tipo     ?? 'carta',
        };
        this.buildSecoesFromDraft();
        this.refreshEventType();
        this.cdr.markForCheck();
    }

    refreshEventType() {
        this.eventTypeCfg = this.eventTypeService.getConfig((this.draft.tipo as EventType) || 'casamento');
    }

    onTipoChange() { this.refreshEventType(); }

    get draftAsCfg(): ConviteConfig { return this.draft as ConviteConfig; }

    applyTheme(theme: ColorTheme) {
        if (theme.key === 'custom') return;
        this.draft.cor_primaria = theme.cor_primaria;
        this.draft.cor_acento   = theme.cor_acento;
        this.cdr.markForCheck();
    }

    selectBackground(key: string) {
        this.draft.fundo_tipo = key;
        this.cdr.markForCheck();
    }

    get activeThemeKey(): string {
        return this.colorThemes.find(
            t => t.cor_primaria === this.draft.cor_primaria && t.cor_acento === this.draft.cor_acento
        )?.key ?? 'custom';
    }

    imageUrl(field: ImageField): string {
        const val = (this.draft as unknown as Record<string, string | undefined>)[field];
        return this.configService.resolveImageUrl(val, this.slug);
    }

    async uploadImage(event: Event, field: ImageField) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        this.uploadingField = field;
        this.uploadError = '';
        this.cdr.markForCheck();
        try {
            const url = await this.uploadService.uploadImage(this.slug, file, field);
            (this.draft as unknown as Record<string, string>)[field] = url;
            await this.configService.updateFields(this.slug, { [field]: url });
        } catch (err) {
            this.uploadError = err instanceof Error ? err.message : 'Erro no upload.';
        } finally {
            this.uploadingField = null;
            input.value = '';
            this.cdr.markForCheck();
        }
    }

    async save() {
        this.saving = true;
        this.saved = false;
        this.cdr.markForCheck();
        try {
            await this.configService.updateFields(this.slug, this.draft);
            this.saved = true;
            setTimeout(() => { this.saved = false; this.cdr.markForCheck(); }, 3000);
        } finally {
            this.saving = false;
            this.cdr.markForCheck();
        }
    }

    // ── Gerenciamento de Seções ──────────────────────────────

    private buildSecoesFromDraft() {
        const raw = this.draft.secoes_config;
        if (raw) {
            try {
                const parsed: SecaoItem[] = JSON.parse(raw);
                // garante que nenhuma seção built-in esteja faltando
                const existingIds = new Set(parsed.map(s => s.id));
                for (const def of BUILTIN_SECTIONS) {
                    if (!existingIds.has(def.id)) {
                        parsed.push({ id: def.id, ativo: this.defaultAtivo(def.id) });
                    }
                }
                this.secoes = parsed;
                return;
            } catch { /* fallback abaixo */ }
        }
        // build inicial a partir dos campos show_*
        this.secoes = [
            { id: 'fotos',           ativo: false },
            { id: 'mapa',            ativo: this.draft.show_mapa        ?? true },
            { id: 'traje',           ativo: this.draft.show_traje       ?? true },
            { id: 'traje_pastel',    ativo: false },
            { id: 'pix',             ativo: this.draft.show_pix         ?? true },
            { id: 'dicas_presentes', ativo: false },
            { id: 'confirmacao',     ativo: this.draft.show_confirmacao ?? true },
            { id: 'recusar',         ativo: false },
            { id: 'observacao',      ativo: false },
            { id: 'spotify',         ativo: this.draft.show_spotify     ?? true },
            { id: 'manual',          ativo: this.draft.show_manual      ?? true },
        ];
    }

    private defaultAtivo(id: string): boolean {
        return ['mapa', 'traje', 'pix', 'confirmacao', 'spotify', 'manual'].includes(id);
    }

    syncSecoesToDraft() {
        this.draft.secoes_config = JSON.stringify(this.secoes);
        // mantém campos show_* sincronizados para compatibilidade
        for (const s of this.secoes) {
            switch (s.id) {
                case 'mapa':        this.draft.show_mapa        = s.ativo; break;
                case 'traje':       this.draft.show_traje       = s.ativo; break;
                case 'pix':         this.draft.show_pix         = s.ativo; break;
                case 'confirmacao': this.draft.show_confirmacao = s.ativo; break;
                case 'spotify':     this.draft.show_spotify     = s.ativo; break;
                case 'manual':      this.draft.show_manual      = s.ativo; break;
            }
        }
        this.cdr.markForCheck();
    }

    moveUp(index: number) {
        if (index === 0) return;
        [this.secoes[index - 1], this.secoes[index]] = [this.secoes[index], this.secoes[index - 1]];
        this.syncSecoesToDraft();
    }

    moveDown(index: number) {
        if (index >= this.secoes.length - 1) return;
        [this.secoes[index], this.secoes[index + 1]] = [this.secoes[index + 1], this.secoes[index]];
        this.syncSecoesToDraft();
    }

    toggleSecao(index: number) {
        this.secoes[index] = { ...this.secoes[index], ativo: !this.secoes[index].ativo };
        this.syncSecoesToDraft();
    }

    adicionarSecaoCustom() {
        this.secoes.push({ id: 'custom_' + Date.now(), ativo: true, titulo: 'Nova Seção', conteudo: '' });
        this.syncSecoesToDraft();
    }

    removerSecao(index: number) {
        this.secoes.splice(index, 1);
        this.syncSecoesToDraft();
    }

    getBuiltinDef(id: string): SecaoDef | undefined {
        return BUILTIN_SECTIONS.find(s => s.id === id);
    }

    isCustom(id: string): boolean { return id.startsWith('custom_'); }

    // ──────────────────────────────────────────────────────────

    goAdmin()  { this.router.navigate([`/${this.slug}/admin`]); }
    logout()   { this.authService.logout(); this.router.navigate([`/${this.slug}/login`]); }
}
