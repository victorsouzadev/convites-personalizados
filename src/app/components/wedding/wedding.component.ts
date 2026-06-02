import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { GuestService } from '../../services/guest.service';
import { ConviteConfigService, ConviteConfig, SecaoItem } from '../../services/convite-config.service';
import { EventTypeService, } from '../../services/event-type.service';
import { EventTypeConfig } from '../../models/event-type.model';
import { BACKGROUND_PRESETS } from '../../models/themes.model';

const DEFAULT_SECOES_ORDER = [
    'fotos', 'mapa', 'traje', 'traje_pastel', 'pix',
    'dicas_presentes', 'confirmacao', 'recusar', 'observacao', 'spotify', 'manual',
];

@Component({
    selector: 'app-wedding',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './wedding.component.html',
    styleUrls: ['./wedding.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeddingComponent implements OnInit, OnDestroy {
    cfg: ConviteConfig | null = null;
    eventTypeCfg: EventTypeConfig | null = null;
    slug = '';

    weddingDate: Date = new Date();
    timeLeft: any = {};
    private timerId: any;

    guestName: string | null = null;
    guestId: string | null = null;
    guestSide: string | null = null;

    imageLoaded = false;
    showNameForm = false;
    pendingName = '';
    confirming = false;
    confirmed = false;
    pixCopied = false;

    safeMapUrl: SafeResourceUrl | null = null;
    safeSpotifyUrl: SafeResourceUrl | null = null;

    currentSlide = 0;
    galleryImages: { src: string; alt: string }[] = [];

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
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone,
        private route: ActivatedRoute,
        private guestService: GuestService,
        public configService: ConviteConfigService,
        private eventTypeService: EventTypeService,
    ) {}

    async ngOnInit() {
        this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
        this.cfg = await this.configService.load(this.slug);

        if (!this.cfg) return;

        this.eventTypeCfg = this.eventTypeService.getConfig(this.cfg.tipo || 'casamento');

        this.weddingDate = new Date(this.cfg.data_casamento);
        this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.cfg.local_map_embed_url);
        this.safeSpotifyUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://open.spotify.com/embed/track/${this.cfg.spotify_track_id}?utm_source=generator&autoplay=1`
        );

        this.guestId = this.route.snapshot.queryParamMap.get('id');
        if (this.guestId) {
            const guest = await this.guestService.getGuestById(this.guestId);
            if (guest) {
                this.guestName = guest.name;
                this.guestSide = guest.side;
                if (guest.status === 'confirmed') this.confirmed = true;
                this.cdr.markForCheck();
            }
        }

        this.calculateTimeLeft();
        this.ngZone.runOutsideAngular(() => {
            this.timerId = setInterval(() => {
                this.calculateTimeLeft();
                this.ngZone.run(() => this.cdr.markForCheck());
            }, 1000);
        });
    }

    ngOnDestroy() {
        if (this.timerId) clearInterval(this.timerId);
    }

    calculateTimeLeft() {
        const distance = this.weddingDate.getTime() - Date.now();
        if (distance < 0) {
            this.timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
            return;
        }
        this.timeLeft = {
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000),
        };
    }

    onImageLoad() {
        this.imageLoaded = true;
        this.cdr.markForCheck();
    }

    openMap() {
        window.open(this.cfg?.local_map_link, '_blank');
    }

    confirmPresence() {
        if (this.guestId) this.guestService.trackClick(this.guestId, 'clickedConfirm');
        if (this.guestName) {
            this.submitConfirm(this.guestName);
        } else {
            this.showNameForm = true;
        }
    }

    trackGiftsClick() {
        if (this.guestId) this.guestService.trackClick(this.guestId, 'clickedGifts');
    }

    async submitConfirm(name: string) {
        if (!name.trim() || this.confirming || !this.cfg) return;
        this.confirming = true;

        const nomes = this.eventNomes;
        const dataFormatada = this.getDisplayDate(this.cfg.data_casamento.split('T')[0]);
        const template = this.eventTypeCfg?.whatsappConfirmMsg ?? 'confirmo presença no evento de {nomes} no dia {data}.';
        const confirmText = template.replace('{nomes}', nomes).replace('{data}', dataFormatada);
        const msg = `Olá! Sou ${name.trim()} e ${confirmText}`;
        const number = this.guestSide === 'noiva' ? this.cfg.whatsapp_noiva : this.cfg.whatsapp_noivo;
        const waUrl = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
        const waWindow = window.open('', '_blank');

        try {
            if (this.guestId) {
                await this.guestService.confirmById(this.guestId, name.trim());
            } else {
                await this.guestService.confirmByName(this.slug, name.trim());
            }
            this.confirmed = true;
            this.showNameForm = false;
            if (waWindow) waWindow.location.href = waUrl;
        } catch {
            waWindow?.close();
        } finally {
            this.confirming = false;
            this.cdr.markForCheck();
        }
    }

    copyPix() {
        if (!this.cfg) return;
        navigator.clipboard.writeText(this.cfg.pix_codigo).then(() => {
            this.pixCopied = true;
            this.cdr.markForCheck();
            setTimeout(() => { this.pixCopied = false; this.cdr.markForCheck(); }, 3000);
        });
    }

    onSliderScroll(slider: HTMLElement) {
        const slide = slider.firstElementChild as HTMLElement;
        if (!slide) return;
        const slideWidth = slide.offsetWidth + 8;
        this.currentSlide = Math.min(Math.round(slider.scrollLeft / slideWidth), this.galleryImages.length - 1);
        this.cdr.markForCheck();
    }

    scrollToSlide(slider: HTMLElement, index: number) {
        const slide = slider.firstElementChild as HTMLElement;
        if (!slide) return;
        const slideWidth = slide.offsetWidth + 8;
        this.currentSlide = index;
        slider.scrollTo({ left: index * slideWidth, behavior: 'smooth' });
    }

    addToGoogleCalendar() {
        if (!this.cfg) return;
        const start = this.cfg.data_casamento.replace(/[-:T]/g, '').slice(0, 15) + 'Z';
        const titleTemplate = this.eventTypeCfg?.calendarTitle ?? 'Evento: {nomes}';
        const title = titleTemplate.replace('{nomes}', this.eventNomes);
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            dates: `${start}/${start}`,
            location: this.cfg.local_endereco,
        });
        window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank');
    }

    get eventNomes(): string {
        if (!this.cfg) return '';
        const noiva = this.cfg.noiva?.trim();
        const noivo = this.cfg.noivo?.trim();
        if (noivo && noiva) return `${noivo} & ${noiva}`;
        return noivo || noiva || '';
    }

    get rootStyles(): Record<string, string> {
        const preset = BACKGROUND_PRESETS.find(b => b.key === (this.cfg?.fundo_tipo ?? 'warm')) ?? BACKGROUND_PRESETS[0];
        return {
            '--cor-p': this.cfg?.cor_primaria ?? '#4a6e3a',
            '--cor-a': this.cfg?.cor_acento ?? '#a08040',
            '--bg-fade': preset.fadeColor,
            'background': preset.css,
            'min-height': '100vh',
        };
    }

    get secoesOrdenadas(): SecaoItem[] {
        const raw = this.cfg?.secoes_config;
        if (raw) {
            try { return (JSON.parse(raw) as SecaoItem[]).filter(s => s.ativo); } catch { /* fallback */ }
        }
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

    get galeriaFotos(): string[] {
        const raw = this.cfg?.fotos_galeria ?? '';
        if (raw.trim().startsWith('[')) {
            try { return JSON.parse(raw); } catch { /* fallback */ }
        }
        return raw.split('\n').map((l: string) => l.trim()).filter(Boolean).slice(0, 12);
    }

    get dicasPresentes(): string[] {
        return (this.cfg?.dicas_presentes_texto ?? '')
            .split('\n').map((l: string) => l.trim()).filter(Boolean);
    }

    get observacaoTexto(): string { return this.cfg?.observacao_texto ?? ''; }

    get showMapa(): boolean        { return this.secoesOrdenadas.some(s => s.id === 'mapa'); }
    get showTraje(): boolean       { return this.secoesOrdenadas.some(s => s.id === 'traje') && !!(this.eventTypeCfg?.showTraje); }
    get showPix(): boolean         { return this.secoesOrdenadas.some(s => s.id === 'pix') && !!(this.eventTypeCfg?.showPix); }
    get showConfirmacao(): boolean { return this.secoesOrdenadas.some(s => s.id === 'confirmacao'); }
    get showSpotify(): boolean     { return this.secoesOrdenadas.some(s => s.id === 'spotify') && !!(this.cfg?.spotify_track_id); }
    get showManual(): boolean      { return this.secoesOrdenadas.some(s => s.id === 'manual'); }

    getDisplayDate(dateStr: string): string {
        if (!dateStr) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const months = ['janeiro','fevereiro','março','abril','maio','junho',
                            'julho','agosto','setembro','outubro','novembro','dezembro'];
            const [year, month, day] = dateStr.split('-').map(Number);
            return `${day} de ${months[month - 1]} de ${year}`;
        }
        return dateStr;
    }

    get weddingDateStr(): string {
        if (!this.cfg) return '';
        return this.getDisplayDate(this.cfg.data_casamento.split('T')[0]);
    }

    get weddingTime(): string {
        if (!this.cfg) return '';
        return this.cfg.data_casamento.split('T')[1]?.slice(0, 5) ?? '';
    }
}
