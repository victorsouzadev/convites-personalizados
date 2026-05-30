import { Injectable } from '@angular/core';
import { EventType, EventTypeConfig, EVENT_TYPE_CONFIGS } from '../models/event-type.model';

@Injectable({ providedIn: 'root' })
export class EventTypeService {
    getConfig(tipo: EventType): EventTypeConfig {
        return EVENT_TYPE_CONFIGS[tipo];
    }
}
