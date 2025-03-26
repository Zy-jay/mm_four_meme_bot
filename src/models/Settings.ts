// import mongoose from "mongoose";

// const Settings = new mongoose.Schema({
//   priceTriggerPurcent: { type: Number, unique: false, default: 7 },
//   priceTriggerDumpPurcent: { type: Number, unique: false, default: 2 },
//   volumeTriggerPurcent: {
//     type: Number,
//     unique: false,
//     required: true,
//     default: 500,
//   },
//   volumeLimit: { type: Number, unique: false, required: true, default: 500000 },
//   interval: { type: Number, unique: true, required: true, default: 5 },
//   isNotificationsEnabled: { type: Boolean, required: false, default: false },
// });

// export default mongoose.model("Settings", Settings);

// export interface ISettings {
//   priceTriggerPurcent: number;
//   volumeTriggerPurcent: number;
//   volumeLimit: number;
//   interval: number;
//   priceTriggerDumpPurcent: number;
//   isNotificationsEnabled: boolean | undefined | null;
// }
