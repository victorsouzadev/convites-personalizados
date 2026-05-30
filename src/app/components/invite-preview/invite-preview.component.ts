import {
    Component, Input, OnChanges, OnDestroy, DoCheck, NgZone,
    ChangeDetectionStrategy, ChangeDetectorRef, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ConviteConfig, ConviteConfigService, SecaoItem } from '../../services/convite-config.service';
import { EventTypeConfig } from '../../models/event-type.model';
import { BACKGROUND_PRESETS } from '../../models/themes.model';

const DEFAULT_SECOES_ORDER = [
    'fotos', 'mapa', 'traje', 'traje_pastel', 'pix',
    'dicas_presentes', 'confirmacao', 'recusar', 'observacao', 'spotify', 'manual',
];

@Component({
    selector: 'app-invite-preview',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './invite-preview.component.html',
    styleUrls: ['./invite-preview.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitePreviewComponent implements OnChanges, DoCheck, OnDestroy {
    @Input() cfg!: ConviteConfig;
    @Input() eventTypeCfg: EventTypeConfig | null = null;

    timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    safeMapUrl: SafeResourceUrl | null = null;
    safeSpotifyUrl: SafeResourceUrl | null = null;
    private timerId: any;
    private _lastMapUrl = '';
    private _lastSpotifyId = '';

    readonly manualItems = [
        { file: 'confirme_presença.png',                              label: 'Confirme Presença' },
        { file: 'seja_pontual.png',                                   label: 'Seja Pontual' },
        { file: 'convidado_nao_convida.png',                          label: 'Convidado Não Convida' },
        { file: 'nao_atrapalhe_o_fotografo.png',                      label: 'Não Atrapalhe o Fotógrafo' },
        { file: 'nao_use_branco.png',                                 label: 'Não Use Branco' },
        { file: 'aproveita_bastante.png',                             label: 'Aproveite Bastante' },
        { file: 'nao_saia_sem_se_despedir.png',                       label: 'Não Saia Sem Se Despedir' },
        { file: 'evite_confusoes.png',                                label: 'Evite Confusões' },
        { file: 'nao_faca_comentarios_negativos.png',                 label: 'Não Faça Comentários Negativos' },
        { file: 'nao_leve_itens_de_decoracao.png',                    label: 'Não Leve Ítens de Decoração' },
        { file: 'nao_ataque_a_mesa_de_doces.png',                     label: 'Não Ataque a Mesa de Doces' },
        { file: 'tire_muiltas_fotos_e_nos_marque_no_instagram.png',   label: 'Tire Fotos e Marque no Instagram' },
    ];

    constructor(
        private sanitizer: DomSanitizer,
        public configService: ConviteConfigService,
        private ngZone: NgZone,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes['cfg'] && this.cfg) {
            this.calculateTimeLeft();
        }
    }

    ngDoCheck() {
        if (!this.cfg) return;
        const mapUrl = this.cfg.local_map_embed_url ?? '';
        if (mapUrl !== this._lastMapUrl) {
            this._lastMapUrl = mapUrl;
            this.safeMapUrl = mapUrl
                ? this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl)
                : null;
        }
        const spotifyId = this.cfg.spotify_track_id ?? '';
        if (spotifyId !== this._lastSpotifyId) {
            this._lastSpotifyId = spotifyId;
            this.safeSpotifyUrl = spotifyId
                ? this.sanitizer.bypassSecurityTrustResourceUrl(
                    `https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator`)
                : null;
        }
    }

    ngOnDestroy() {
        if (this.timerId) clearInterval(this.timerId);
    }

    private startTimer() {
        if (this.timerId) clearInterval(this.timerId);
        this.ngZone.runOutsideAngular(() => {
            this.timerId = setInterval(() => {
                this.calculateTimeLeft();
                this.ngZone.run(() => this.cdr.markForCheck());
            }, 1000);
        });
    }

    calculateTimeLeft() {
        const date = new Date(this.cfg?.data_casamento ?? '');
        const distance = date.getTime() - Date.now();
        if (isNaN(distance) || distance < 0) {
            this.timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        } else {
            this.timeLeft = {
                days:    Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours:   Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            };
        }
        if (!this.timerId) this.startTimer();
    }

    get background(): string {
        const preset = BACKGROUND_PRESETS.find(b => b.key === (this.cfg?.fundo_tipo ?? 'warm'));
        return preset?.css ?? BACKGROUND_PRESETS[0].css;
    }

    get isDark(): boolean {
        const preset = BACKGROUND_PRESETS.find(b => b.key === (this.cfg?.fundo_tipo ?? 'warm'));
        return preset?.dark ?? false;
    }

    get rootStyles(): Record<string, string> {
        const preset = BACKGROUND_PRESETS.find(b => b.key === (this.cfg?.fundo_tipo ?? 'warm')) ?? BACKGROUND_PRESETS[0];
        return {
            '--cor-p': this.cfg?.cor_primaria ?? '#4a6e3a',
            '--cor-a': this.cfg?.cor_acento ?? '#a08040',
            '--text-base': preset.dark ? 'rgba(255,255,255,0.9)' : 'inherit',
            '--bg-fade': preset.fadeColor,
            'background': preset.css,
        };
    }

    get eventNomes(): string {
        const noivo = this.cfg?.noivo?.trim() ?? '';
        const noiva = this.cfg?.noiva?.trim() ?? '';
        if (noivo && noiva) return `${noivo} & ${noiva}`;
        return noivo || noiva || '';
    }

    get weddingDateStr(): string {
        if (!this.cfg?.data_casamento) return '';
        const datePart = this.cfg.data_casamento.split('T')[0];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
        const months = ['janeiro','fevereiro','março','abril','maio','junho',
                        'julho','agosto','setembro','outubro','novembro','dezembro'];
        const [year, month, day] = datePart.split('-').map(Number);
        return `${day} de ${months[month - 1]} de ${year}`;
    }

    get weddingTime(): string {
        return this.cfg?.data_casamento?.split('T')[1]?.slice(0, 5) ?? '';
    }

    // Seções ordenadas (a partir de secoes_config ou fallback)
    get secoesOrdenadas(): SecaoItem[] {
        const raw = this.cfg?.secoes_config;
        if (raw) {
            try { return (JSON.parse(raw) as SecaoItem[]).filter(s => s.ativo); } catch { /* fallback */ }
        }
        // fallback: ordem e visibilidade padrão
        return DEFAULT_SECOES_ORDER
            .map(id => ({ id, ativo: this.defaultAtivo(id) }))
            .filter(s => s.ativo);
    }

    private defaultAtivo(id: string): boolean {
        switch (id) {
            case 'mapa':        return this.cfg?.show_mapa        !== false;
            case 'traje':       return !!(this.eventTypeCfg?.showTraje && this.cfg?.show_traje !== false);
            case 'pix':         return !!(this.eventTypeCfg?.showPix   && this.cfg?.show_pix   !== false);
            case 'confirmacao': return this.cfg?.show_confirmacao !== false;
            case 'spotify':     return !!(this.cfg?.spotify_track_id   && this.cfg?.show_spotify !== false);
            case 'manual':      return this.cfg?.show_manual      !== false;
            default:            return false;
        }
    }

    isSecaoAtiva(id: string): boolean {
        return this.secoesOrdenadas.some(s => s.id === id);
    }

    getSecao(id: string): SecaoItem | undefined {
        return this.secoesOrdenadas.find(s => s.id === id);
    }

    // helpers de conteúdo das novas seções
    get galeriaFotos(): string[] {
        const raw = this.cfg?.fotos_galeria ?? '';
        // suporta tanto JSON array quanto lista de URLs uma por linha
        if (raw.trim().startsWith('[')) {
            try { return JSON.parse(raw); } catch { /* fallback */ }
        }
        return raw.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 12);
    }

    get dicasPresentes(): string[] {
        return (this.cfg?.dicas_presentes_texto ?? '')
            .split('\n').map((l: string) => l.trim()).filter(Boolean);
    }

    get observacaoTexto(): string { return this.cfg?.observacao_texto ?? ''; }

    // Visibilidade de seções legadas (mantidas para compatibilidade)
    get showMapa(): boolean         { return this.isSecaoAtiva('mapa'); }
    get showTraje(): boolean        { return this.isSecaoAtiva('traje') && !!(this.eventTypeCfg?.showTraje); }
    get showPix(): boolean          { return this.isSecaoAtiva('pix') && !!(this.eventTypeCfg?.showPix); }
    get showConfirmacao(): boolean  { return this.isSecaoAtiva('confirmacao'); }
    get showSpotify(): boolean      { return this.isSecaoAtiva('spotify') && !!(this.cfg?.spotify_track_id); }
    get showManual(): boolean       { return this.isSecaoAtiva('manual'); }
}
