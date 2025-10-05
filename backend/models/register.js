import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    myRadioGroup: { type: String, required: true },
    number: { type: String }
});

export const User = mongoose.model('User', userSchema);