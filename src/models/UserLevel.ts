import mongoose from 'mongoose';

export interface IUserLevel extends mongoose.Document {
    guildId: string;
    userId: string;
    xp: number;
    level: number;
    totalXP: number;
}

const userLevelSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 }
});

userLevelSchema.index({ guildId: 1, userId: 1 }, { unique: true });

export const UserLevel = mongoose.models.UserLevel || mongoose.model<IUserLevel>('UserLevel', userLevelSchema);
