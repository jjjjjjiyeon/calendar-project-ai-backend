// models/Calendar.js
const { Schema, model } = require("mongoose");

const MemberSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
  role: { type: String, enum: ["owner", "editor", "viewer"], default: "viewer" },
});

const CalendarSchema = new Schema({
  name:    { type: String, required: true },
  owner:   { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  members: [{
    user: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    role: { type: String, enum: ['owner','editor','viewer','member'], default: 'viewer' }
  }],
  shareToken: { type: String, index: true, sparse: true, default: null },
}, { timestamps: true });


module.exports = model("Calendar", CalendarSchema);
