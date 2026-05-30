import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GuestService } from '../../services/guest.service';
import { ConviteConfigService } from '../../services/convite-config.service';
import { BACKGROUND_PRESETS } from '../../models/themes.model';

@Component({
    selector: 'app-envelope',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './envelope.component.html',
    styleUrls: ['./envelope.component.css'],
})
export class EnvelopeComponent implements OnInit {
    isOpening = false;
    isLeaving = false;
    imageLoaded = false;
    guestName: string | null = null;
    slug = '';
    private guestId: string | null = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private guestService: GuestService,
        private cdr: ChangeDetectorRef,
        public configService: ConviteConfigService,
    ) {}

    async ngOnInit() {
        this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
        await this.configService.load(this.slug);

        this.guestId = this.route.snapshot.queryParamMap.get('id');
        const queryParams = this.guestId ? { id: this.guestId } : {};

        if (this.guestId) {
            const [guest] = await Promise.all([
                this.guestService.getGuestById(this.guestId),
                this.guestService.trackOpen(this.guestId),
            ]);
            if (guest) {
                this.guestName = guest.name;
                this.cdr.markForCheck();
            }
        }

        const cfg = this.configService.current();
        if (cfg?.entrada_tipo === 'direto') {
            this.router.navigate([`/${this.slug}/convite`], { queryParams });
        }
    }

    onImageLoad() {
        this.imageLoaded = true;
        this.cdr.markForCheck();
    }

    openEnvelope(event?: Event) {
        if (event) event.preventDefault();
        if (this.isOpening) return;
        this.isOpening = true;

        const cfg = this.configService.current();
        if (cfg?.entrada_tipo === 'presente') {
            const queryParams = this.guestId ? { id: this.guestId } : {};
            setTimeout(() => {
                this.isLeaving = true;
                this.cdr.markForCheck();
                setTimeout(() => this.router.navigate([`/${this.slug}/convite`], { queryParams }), 500);
            }, 800);
        }
    }

    get rootStyles(): Record<string, string> {
        const cfg = this.configService.current();
        const preset = BACKGROUND_PRESETS.find(b => b.key === (cfg?.fundo_tipo ?? 'warm')) ?? BACKGROUND_PRESETS[0];
        return {
            '--cor-p': cfg?.cor_primaria ?? '#4a6e3a',
            '--cor-a': cfg?.cor_acento  ?? '#a08040',
            '--bg-fade': preset.fadeColor,
            'background': preset.css,
        };
    }

    onFlapTransitionEnd() {
        if (!this.isOpening || this.isLeaving) return;
        this.isLeaving = true;
        const queryParams = this.guestId ? { id: this.guestId } : {};
        setTimeout(() => this.router.navigate([`/${this.slug}/convite`], { queryParams }), 500);
    }
}
