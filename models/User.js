const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  photo: { type: String, default: '' },
  password: { type: String },
  googleId: { type: String },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
