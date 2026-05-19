const express = require('express');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('room', 'name image floor hourlyRate')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { roomId, date, startTime, endTime, totalCost, specialNote } = req.body;

    const conflict = await Booking.findOne({
      room: roomId,
      date,
      status: 'confirmed',
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflict) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    const booking = await Booking.create({
      room: roomId,
      user: req.user.id,
      date,
      startTime,
      endTime,
      totalCost,
      specialNote,
    });

    await Room.findByIdAndUpdate(roomId, { $inc: { bookingCount: 1 } });
    await User.findByIdAndUpdate(req.user.id, { $push: { bookings: booking._id } });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    booking.status = 'cancelled';
    await booking.save();

    await User.findByIdAndUpdate(req.user.id, { $pull: { bookings: booking._id } });

    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
