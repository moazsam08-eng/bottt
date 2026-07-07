export interface TicketSection {
    name: string;
    emoji: string;
    description: string;
    enabled: boolean;
    categoryId: string;
    logChannelId: string;
    adminRoles: string[];
    imageUrl?: string;
    welcomeMessage?: string;
    cooldown?: number;
    nameAr?: string;
    descriptionAr?: string;
    rules?: string[];
    rulesAr?: string[];
}
