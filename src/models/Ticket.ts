import mongoose from 'mongoose';

export interface ITicket extends mongoose.Document {
    guildId: string;
    channelId: string;
    userId: string;
    section: string;
    status: 'open' | 'claimed' | 'closed';
    claimedBy?: string;
    closedBy?: string;
    createdAt: Date;
    claimedAt?: Date;
    closedAt?: Date;
    transcriptUrl?: string;
}

const ticketSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    section: { type: String, required: true },
    status: { type: String, enum: ['open', 'claimed', 'closed'], default: 'open' },
    claimedBy: { type: String },
    closedBy: { type: String },
    createdAt: { type: Date, default: Date.now },
    claimedAt: { type: Date },
    closedAt: { type: Date },
    transcriptUrl: { type: String }
});

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', ticketSchema); 
