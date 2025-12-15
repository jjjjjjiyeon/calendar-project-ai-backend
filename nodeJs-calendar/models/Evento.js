// models/Evento.js
const { Schema, model } = require('mongoose');

const EventoSchema = Schema({
  title: { type: String, required: true },
  notes: { type: String },
  start: { type: Date, required: true },
  end:   { type: Date, required: true },
  user:  { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },

  // 캘린더 연결 (필수)
  // models/Evento.js (권장)
  calendarId: { type: Schema.Types.ObjectId, ref: 'Calendar', required: true },

  color: { type: String, default: "#A5B4FC" }, 
}, { timestamps: true });

EventoSchema.method('toJSON', function() {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('Evento', EventoSchema );
