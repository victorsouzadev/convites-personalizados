import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, Subject } from 'rxjs';

export type GuestStatus = 'pending' | 'sent' | 'confirmed' | 'declined';
export type GuestSide = 'noivo' | 'noiva';

export interface Guest {
    id?: string;
    slug: string;
    name: string;
    whatsapp: string;
    side: GuestSide;
    status: GuestStatus;
    created_at?: string;
    opened_at?: string;
    open_count?: number;
    clicked_confirm_at?: string;
    clicked_gifts_at?: string;
    confirm_clicks?: number;
    gifts_clicks?: number;
}

@Injectable({ providedIn: 'root' })
export class GuestService {
    constructor(private sb: SupabaseService) {}

    private table = 'guests';

    getGuests(slug: string): Observable<Guest[]> {
        const subject = new Subject<Guest[]>();

        const fetch = async () => {
            const { data } = await this.sb.client
                .from(this.table)
                .select('*')
                .eq('slug', slug)
                .order('created_at', { ascending: false });
            subject.next((data ?? []) as Guest[]);
        };

        fetch();

        const channel = this.sb.client
            .channel(`guests-${slug}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: this.table, filter: `slug=eq.${slug}` }, () => fetch())
            .subscribe();

        return new Observable((observer) => {
            const sub = subject.subscribe(observer);
            return () => {
                sub.unsubscribe();
                this.sb.client.removeChannel(channel);
            };
        });
    }

    async getGuestById(id: string): Promise<Guest | null> {
        const { data } = await this.sb.client.from(this.table).select('*').eq('id', id).single();
        return data as Guest | null;
    }

    async addGuest(slug: string, name: string, whatsapp: string, side: GuestSide): Promise<void> {
        await this.sb.client.from(this.table).insert({
            slug,
            name,
            whatsapp: whatsapp.replace(/\D/g, ''),
            side,
            status: 'pending' as GuestStatus,
        });
    }

    async updateStatus(id: string, status: GuestStatus): Promise<void> {
        await this.sb.client.from(this.table).update({ status }).eq('id', id);
    }

    async deleteGuest(id: string): Promise<void> {
        await this.sb.client.from(this.table).delete().eq('id', id);
    }

    async confirmById(id: string, name: string): Promise<void> {
        await this.sb.client.from(this.table).update({ status: 'confirmed' }).eq('id', id);
        const { data: guest } = await this.sb.client.from(this.table).select('slug').eq('id', id).single();
        if (guest) {
            await this.sb.client.from('confirmations').insert({ guest_id: id, slug: guest.slug, name, confirmed_at: new Date().toISOString() });
        }
    }

    async confirmByName(slug: string, name: string): Promise<void> {
        await this.sb.client.from('confirmations').insert({ slug, name, confirmed_at: new Date().toISOString() });
        const { data } = await this.sb.client.from(this.table).select('id').eq('slug', slug).ilike('name', name);
        if (data?.length) {
            await this.sb.client.from(this.table).update({ status: 'confirmed' }).eq('id', data[0].id);
        }
    }

    async trackOpen(id: string): Promise<void> {
        const { data: guest } = await this.sb.client.from(this.table).select('open_count').eq('id', id).single();
        await this.sb.client.from(this.table).update({
            opened_at: new Date().toISOString(),
            open_count: ((guest?.open_count ?? 0) + 1),
        }).eq('id', id);
    }

    async trackClick(id: string, type: 'clickedConfirm' | 'clickedGifts'): Promise<void> {
        if (type === 'clickedConfirm') {
            const { data } = await this.sb.client.from(this.table).select('confirm_clicks').eq('id', id).single();
            await this.sb.client.from(this.table).update({
                clicked_confirm_at: new Date().toISOString(),
                confirm_clicks: ((data?.confirm_clicks ?? 0) + 1),
            }).eq('id', id);
        } else {
            const { data } = await this.sb.client.from(this.table).select('gifts_clicks').eq('id', id).single();
            await this.sb.client.from(this.table).update({
                clicked_gifts_at: new Date().toISOString(),
                gifts_clicks: ((data?.gifts_clicks ?? 0) + 1),
            }).eq('id', id);
        }
    }

    async clearStats(id: string): Promise<void> {
        await this.sb.client.from(this.table).update({
            opened_at: null,
            open_count: 0,
            clicked_confirm_at: null,
            clicked_gifts_at: null,
            confirm_clicks: 0,
            gifts_clicks: 0,
        }).eq('id', id);
    }

    async clearAllStats(slug: string): Promise<void> {
        await this.sb.client.from(this.table).update({
            opened_at: null,
            open_count: 0,
            clicked_confirm_at: null,
            clicked_gifts_at: null,
            confirm_clicks: 0,
            gifts_clicks: 0,
        }).eq('slug', slug);
    }
}
