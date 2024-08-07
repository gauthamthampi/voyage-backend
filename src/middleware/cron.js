import cron from 'node-cron';
import bookingscollection from '../models/bookings.js';

cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    await bookingscollection.updateMany(
      { checkOutDate: { $lte: now }, status: 'Upcoming' },
      { $set: { status: 'Completed' } }
    );
    console.log('Updated booking statuses to Completed');
  } catch (error) {
    console.error('Error updating booking statuses:', error);
  }
});

console.log('Cron job scheduled to run at midnight every day');
