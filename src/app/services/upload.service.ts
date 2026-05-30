import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ImageField = 'foto_capa' | 'foto_envelope' | 'foto_share' | 'foto_brasao';

@Injectable({ providedIn: 'root' })
export class UploadService {
    private readonly BUCKET = 'convites';

    constructor(private sb: SupabaseService) {}

    async uploadImage(slug: string, file: File, field: ImageField): Promise<string> {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const path = `${slug}/${field}.${ext}`;

        const { error } = await this.sb.client.storage
            .from(this.BUCKET)
            .upload(path, file, { upsert: true, contentType: file.type });

        if (error) throw new Error(`Erro no upload: ${error.message}`);

        const { data } = this.sb.client.storage
            .from(this.BUCKET)
            .getPublicUrl(path);

        // Timestamp para forçar refresh no browser
        return `${data.publicUrl}?t=${Date.now()}`;
    }
}
