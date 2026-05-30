export type EventType =
    | 'casamento'
    | 'aniversario'
    | 'formatura'
    | 'corporativo'
    | 'outro';

export const EVENT_TYPES: EventType[] = [
    'casamento',
    'aniversario',
    'formatura',
    'corporativo',
    'outro',
];

export interface EventTypeConfig {
    label: string;
    roleName: string;
    showTraje: boolean;
    showPix: boolean;
    showWhatsAppConfirm: boolean;
    // Textos exibidos no convite
    inviteSubtitle: string;        // ex: "da nossa união"
    countdownSubtitle: string;     // ex: "para o grande dia"
    manualTitle: string;           // ex: "Manual dos Convidados"
    manualSubtitle: string;        // ex: "orientações para o grande dia"
    // Templates de mensagem (use {nomes} e {data} como placeholders)
    whatsappInviteMsg: string;     // mensagem de envio do convite
    whatsappConfirmMsg: string;    // mensagem de confirmação de presença
    calendarTitle: string;         // título no Google Agenda (use {nomes})
}

export const EVENT_TYPE_CONFIGS: Record<EventType, EventTypeConfig> = {
    casamento: {
        label: 'Casamento',
        roleName: 'Noivo/Noiva',
        showTraje: true,
        showPix: true,
        showWhatsAppConfirm: true,
        inviteSubtitle: 'da nossa união',
        countdownSubtitle: 'para o grande dia',
        manualTitle: 'Manual dos Convidados',
        manualSubtitle: 'orientações para o grande dia',
        whatsappInviteMsg: '{nomes} têm o prazer de convidá-lo(a) para a celebração do seu casamento.',
        whatsappConfirmMsg: 'confirmo minha presença no casamento de {nomes} no dia {data}.',
        calendarTitle: 'Casamento de {nomes}',
    },
    aniversario: {
        label: 'Aniversário',
        roleName: 'Aniversariante',
        showTraje: false,
        showPix: false,
        showWhatsAppConfirm: true,
        inviteSubtitle: 'venha comemorar comigo',
        countdownSubtitle: 'para a festa',
        manualTitle: 'Informações da Festa',
        manualSubtitle: 'tudo que você precisa saber',
        whatsappInviteMsg: '{nomes} convida você para a festa de aniversário.',
        whatsappConfirmMsg: 'confirmo minha presença no aniversário de {nomes} no dia {data}.',
        calendarTitle: 'Aniversário de {nomes}',
    },
    formatura: {
        label: 'Formatura',
        roleName: 'Formando',
        showTraje: true,
        showPix: false,
        showWhatsAppConfirm: true,
        inviteSubtitle: 'venha celebrar esta conquista',
        countdownSubtitle: 'para a formatura',
        manualTitle: 'Informações da Cerimônia',
        manualSubtitle: 'orientações para o evento',
        whatsappInviteMsg: '{nomes} convida você para a cerimônia de formatura.',
        whatsappConfirmMsg: 'confirmo minha presença na formatura de {nomes} no dia {data}.',
        calendarTitle: 'Formatura de {nomes}',
    },
    corporativo: {
        label: 'Corporativo',
        roleName: 'Responsável',
        showTraje: false,
        showPix: false,
        showWhatsAppConfirm: false,
        inviteSubtitle: 'sua presença é muito importante',
        countdownSubtitle: 'para o evento',
        manualTitle: 'Informações do Evento',
        manualSubtitle: 'orientações para os participantes',
        whatsappInviteMsg: 'você está convidado(a) para o evento corporativo de {nomes}.',
        whatsappConfirmMsg: 'confirmo minha presença no evento de {nomes} no dia {data}.',
        calendarTitle: 'Evento: {nomes}',
    },
    outro: {
        label: 'Evento',
        roleName: 'Responsável',
        showTraje: false,
        showPix: false,
        showWhatsAppConfirm: true,
        inviteSubtitle: 'sua presença será especial',
        countdownSubtitle: 'para o evento',
        manualTitle: 'Informações',
        manualSubtitle: 'orientações para o evento',
        whatsappInviteMsg: '{nomes} convida você para este evento especial.',
        whatsappConfirmMsg: 'confirmo minha presença no evento de {nomes} no dia {data}.',
        calendarTitle: 'Evento: {nomes}',
    },
};
