import mongoose from "mongoose";

const User = new mongoose.Schema({
  role: { type: String, unique: false, default: "USER" },
  firstName: { type: String, unique: false, required: true },
  lastName: { type: String, required: false },
  userId: { type: Number, unique: true, required: true },
  username: { type: String, required: false },
  languageCode: { type: String, required: false },
  allowsWriteToPm: { type: Boolean, required: false },
  refRewards: { type: Number, required: false, default: 0 },
  registrationDate: {
    type: Number,
    default: Date.now(),
  },
});

export default mongoose.model("Users", User);
