import mongoose from "mongoose";

export const PrivateKey = new mongoose.Schema({
  privateKey: { type: String, required: true },
  address: { type: String, required: true },
  userId: { type: Number, required: true },
  walletMarkers: { type: String, required: false },
  isAdmin: { type: Boolean, required: false, default: false },
  walletName: { type: String, required: false },
});
export default mongoose.model("Private_Key", PrivateKey);
