import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EventType } from '../models/event-type.model';

export interface EventSummary {
    slug: string;
    tipo: EventType;
    rotulo_personalizado?: string;
    data_casamento: string;
    guest_count: number;
}

export interface CreateEventData {
    slug: string;
    tipo: EventType;
    rotulo_personalizado?: string;
    admin_senha: string;
    data_casamento: string;
    local_nome: string;
    [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class MasterAdminService {
    constructor(private sb: SupabaseService) {}

    async listEvents(): Promise<EventSummary[]> {
        const { data, error } = await this.sb.client
            .from('convites')
            .select('slug, tipo, rotulo_personalizado, data_casamento')
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        const summaries: EventSummary[] = await Promise.all(
            data.map(async (row) => {
                const { count } = await this.sb.client
                    .from('guests')
                    .select('*', { count: 'exact', head: true })
                    .eq('slug', row['slug']);
                return {
                    slug: row['slug'] as string,
                    tipo: ((row['tipo'] as string) || 'casamento') as EventType,
                    rotulo_personalizado: row['rotulo_personalizado'] as string | undefined,
                    data_casamento: row['data_casamento'] as string,
                    guest_count: count ?? 0,
                };
            })
        );

        return summaries;
    }

    async createEvent(data: CreateEventData): Promise<void> {
        const { error } = await this.sb.client.from('convites').insert({
            noivo: '',
            noiva: '',
            local_endereco: '',
            local_map_embed_url: '',
            local_map_link: '',
            ...data,
        });
        if (error) throw new Error(error.message);
    }

    async deleteEvent(slug: string): Promise<void> {
        await this.sb.client.from('guests').delete().eq('slug', slug);
        const { error } = await this.sb.client.from('convites').delete().eq('slug', slug);
        if (error) throw new Error(error.message);
    }
}
