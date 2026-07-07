import mongoose from 'mongoose';

const warningSchema = new mongoose.Schema({
    guildId: String,
    userId: String,
    moderatorId: String,
    reason: String,
    timestamp: Date
});

export const Warning = mongoose.models.Warning || mongoose.model('Warning', warningSchema); 
