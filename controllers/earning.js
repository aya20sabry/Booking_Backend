const mongoose = require("mongoose");
const Booking = require("../models/bookings");
const Apartment = require("../models/apartments");
const Host = require("../models/hosts");
const router = require("express").Router();

router.get("/:ownerId", async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const hosts = await Host.find({ ownerId });
    const apartments = await Apartment.find({ ownerId });

    let hostBookings = [];
    let apartmentBookings = [];

    if (hosts && hosts.length > 0) {
      // Add a test query to check for any bookings
      const testBooking = await Booking.findOne({});

      // Check the actual host_id format in the bookings collection

      const hostIds = hosts.map((h) => h._id);

      hostBookings = await Booking.aggregate([
        {
          $match: {
            host_id: { $in: hostIds },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: { $toDate: "$check_in_date" },
                timezone: "UTC",
              },
            },
            totalEarnings: { $sum: "$payment.amount" },
            totalMembers: { $sum: "$members" },
            bookings: { $push: { id: "$_id", host_id: "$host_id" } },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    }

    if (apartments && apartments.length > 0) {
      const apartmentBookingsCount = await Booking.countDocuments({
        apartment_id: { $in: apartments.map((a) => a._id.toString()) },
      });

      apartmentBookings = await Booking.aggregate([
        {
          $match: {
            apartment_id: {
              $in: apartments.map((a) => a._id.toString()),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: { $toDate: "$check_in_date" },
                timezone: "UTC",
              },
            },
            totalEarnings: { $sum: "$payment.amount" },
            totalMembers: { $sum: "$members" },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    }

    // ... existing code for simple bookings if both are empty ...

    res.status(200).json({
      hostBookings,
      apartmentBookings,
      message:
        hosts.length === 0 && apartments.length === 0
          ? "No hosts or apartments found for this owner."
          : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
