import mongoose from 'mongoose';
import { Schema, Document } from 'mongoose';

export interface IGiveaway extends Document {
    messageId: string;
    channelId: string;
    guildId: string;
    hostId: string;
    prize: string;
    winners: number;
    endsAt: Date;
    ended: boolean;
    winnerIds: string[];
    participants: string[];
    createdAt: Date;
}

const giveawaySchema = new Schema({
    messageId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    hostId: { type: String, required: true },
    prize: { type: String, required: true },
    winners: { type: Number, required: true },
    endsAt: { type: Date, required: true },
    ended: { type: Boolean, default: false },
    winnerIds: [{ type: String }],
    participants: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

export const Giveaway = mongoose.models.Giveaway || mongoose.model<IGiveaway>('Giveaway', giveawaySchema); 
