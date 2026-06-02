import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { GuestService, Guest, GuestStatus } from '../../services/guest.service';
import { ConviteConfigService, ConviteConfig } from '../../services/convite-config.service';
import { AuthService } from '../../services/auth.service';
import { EventTypeService } from '../../services/event-type.service';
import { EventTypeConfig } from '../../models/event-type.model';
import { UploadService, ImageField } from '../../services/upload.service';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit, OnDestroy {
    slug = '';
    cfg: ConviteConfig | null = null;
    eventTypeCfg: EventTypeConfig | null = null;
    guests: Guest[] = [];

    newName = '';
    newWhatsapp = '';
    saving = false;
    clearingStats = false;
    uploadingField: ImageField | null = null;
    uploadError = '';

    private subs: Subscription[] = [];

    readonly BASE_URL = window.location.origin;

    readonly STATUS_LABELS: Record<GuestStatus, string> = {
        pending: 'Pendente',
        sent: 'Enviado',
        confirmed: 'Confirmado',
        declined: 'Recusou',
    };

    readonly statusOptions: { value: GuestStatus; label: string }[] = [
        { value: 'pending',   label: 'Pendente' },
        { value: 'sent',      label: 'Enviado' },
        { value: 'confirmed', label: 'Confirmado' },
        { value: 'declined',  label: 'Recusou' },
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private guestService: GuestService,
        public configService: ConviteConfigService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
        private eventTypeService: EventTypeService,
        private uploadService: UploadService,
    ) {}

    async ngOnInit() {
        this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
        this.cfg = await this.configService.load(this.slug);
        if (this.cfg) {
            this.eventTypeCfg = this.eventTypeService.getConfig(this.cfg.tipo || 'casamento');
        }

        this.subs.push(
            this.guestService.getGuests(this.slug).subscribe((g) => {
                this.guests = g;
                this.cdr.markForCheck();
            }),
        );
    }

    ngOnDestroy() {
        this.subs.forEach((s) => s.unsubscribe());
    }

    async addGuest() {
        const name = this.newName.trim();
        const whatsapp = this.newWhatsapp.trim();
        if (!name || !whatsapp) return;
        this.saving = true;
        try {
            await this.guestService.addGuest(this.slug, name, whatsapp, 'noivo');
            this.newName = '';
            this.newWhatsapp = '';
        } finally {
            this.saving = false;
            this.cdr.markForCheck();
        }
    }

    async updateStatus(guest: Guest, status: GuestStatus) {
        if (!guest.id) return;
        await this.guestService.updateStatus(guest.id, status);
    }

    async deleteGuest(guest: Guest) {
        if (!guest.id) return;
        if (!confirm(`Remover ${guest.name}?`)) return;
        await this.guestService.deleteGuest(guest.id);
    }

    get eventNomes(): string {
        if (!this.cfg) return '';
        const noivo = this.cfg.noivo?.trim();
        const noiva = this.cfg.noiva?.trim();
        if (noivo && noiva) return `${noivo} e ${noiva}`;
        return noivo || noiva || '';
    }

    async sendInvite(guest: Guest) {
        if (!this.cfg) return;
        const inviteLink = `${this.BASE_URL}/${this.slug}/entrada?id=${guest.id}`;
        const dataFormatada = this.cfg.data_casamento.split('T')[0].split('-').reverse().join('/');
        const hora = this.cfg.data_casamento.split('T')[1]?.slice(0, 5) ?? '';
        const inviteTemplate = this.eventTypeCfg?.whatsappInviteMsg ?? '{nomes} convida você para este evento.';
        const inviteText = inviteTemplate.replace('{nomes}', this.eventNomes);
        const msg = [
            `Olá, ${guest.name}!`,
            ``,
            inviteText,
            ``,
            `- ${dataFormatada} • ${hora}`,
            `- ${this.cfg.local_nome}, ${this.cfg.local_endereco}`,
            ``,
            `Acesse seu convite:`,
            inviteLink,
        ].join('\n');

        const shareImageUrl = this.configService.resolveImageUrl(this.cfg.foto_share, this.slug);

        if (navigator.canShare && shareImageUrl) {
            try {
                const res = await fetch(shareImageUrl);
                const blob = await res.blob();
                const file = new File([blob], `convite-${this.slug}.jpg`, { type: 'image/jpeg' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ text: msg, files: [file] });
                    if (guest.status === 'pending' && guest.id) this.guestService.updateStatus(guest.id, 'sent');
                    return;
                }
            } catch { /* cai no fallback */ }
        }

        const number = guest.whatsapp.replace(/\D/g, '');
        const waNumber = number.startsWith('55') ? number : `55${number}`;
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');

        if (shareImageUrl) {
            const a = document.createElement('a');
            a.href = shareImageUrl;
            a.download = `convite-${this.slug}.jpg`;
            a.click();
        }

        if (guest.status === 'pending' && guest.id) this.guestService.updateStatus(guest.id, 'sent');
    }

    async clearAllStats() {
        if (!confirm('Zerar todas as estatísticas? Esta ação não pode ser desfeita.')) return;
        this.clearingStats = true;
        try { await this.guestService.clearAllStats(this.slug); }
        finally { this.clearingStats = false; this.cdr.markForCheck(); }
    }

    logout() {
        this.authService.logout();
        this.router.navigate([`/${this.slug}/login`]);
    }

    imageUrl(field: ImageField): string {
        if (!this.cfg) return '';
        return this.configService.resolveImageUrl((this.cfg as unknown as Record<string, string>)[field], this.slug);
    }

    async uploadImage(event: Event, field: ImageField): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file || !this.cfg) return;

        this.uploadingField = field;
        this.uploadError = '';
        this.cdr.markForCheck();

        try {
            const url = await this.uploadService.uploadImage(this.slug, file, field);
            await this.configService.updateFields(this.slug, { [field]: url });
            this.cfg = this.configService.current()!;
        } catch (err) {
            this.uploadError = err instanceof Error ? err.message : 'Erro no upload.';
        } finally {
            this.uploadingField = null;
            input.value = '';
            this.cdr.markForCheck();
        }
    }

    get counts() {
        return {
            total:     this.guests.length,
            confirmed: this.guests.filter(g => g.status === 'confirmed').length,
            declined:  this.guests.filter(g => g.status === 'declined').length,
            sent:      this.guests.filter(g => g.status === 'sent').length,
            pending:   this.guests.filter(g => g.status === 'pending').length,
            opened:    this.guests.filter(g => g.open_count).length,
        };
    }

    statusColor(status: GuestStatus): string {
        return { confirmed: '#16a34a', declined: '#dc2626', sent: '#d97706', pending: '#64748b' }[status] ?? '#64748b';
    }

    statusBg(status: GuestStatus): string {
        return { confirmed: '#f0fdf4', declined: '#fef2f2', sent: '#fffbeb', pending: '#f8fafc' }[status] ?? '#f8fafc';
    }
}
