import { Schema, model, Document } from 'mongoose';

export interface IApplication extends Document {
    _id: any;
    userId: string;
    guildId: string;
    channelId: string;
    position: string;
    status: 'pending' | 'accepted' | 'rejected';
    answers: string[];
    appliedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    reviewNote?: string;
    messageId?: string;
}

const ApplicationSchema = new Schema<IApplication>({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    position: { type: String, required: true },
    status: { type: String, required: true, default: 'pending' },
    answers: [{ type: String, required: true }],
    appliedAt: { type: Date, required: true, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: String },
    reviewNote: { type: String },
    messageId: { type: String }
});

export const Application = model<IApplication>('Application', ApplicationSchema); 
