import mongoose from "mongoose";

const DeletedWallet = new mongoose.Schema({
  privateKey: { type: String, required: true },
  publicKey: { type: String, required: true },
  address: { type: String, required: true },
  userId: { type: Number, required: true },
  walletMarkers: { type: String, required: false },
});
export default mongoose.model("Deleted_Wallet", DeletedWallet);

