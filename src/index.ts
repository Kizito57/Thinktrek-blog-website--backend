// import express from 'express';
// import fs from 'fs';
// import path from 'path';

// import carRoutes from './Car/car.router';
// import uploadRouter from './uploads/upload.router';
// // import { dirname } from 'path'
// // import { fileURLToPath } from 'url'
// import customerRoutes from './Customer/customer.router';
// import locationRoutes from './Location/location.router';
// import reservationRoutes from './Reservation/reservation.router';
// import bookingRoutes from './Booking/booking.router';
// import paymentRoutes from './Payment/payment.router';
// import maintenanceRoutes from './Maintenance/maintenance.router';
// import insuranceRoutes from './Insurance/insurance.router';
// import cors from "cors";

// const app = express();

// // Define the uploads directory path
// // Define the uploads directory path
// // Use CommonJS __dirname directly
// app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// // Create uploads directory if it doesn't exist
// const uploadsDir = path.join(__dirname, '..', 'uploads')
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true })
// }


// const PORT = 3000;

// app.use(cors());
// app.use(express.json({limit:'10mb'})); // Middleware to parse JSON bodies
// app.use(express.urlencoded({ limit: '10mb', extended: true }));

// app.use('/uploads', express.static("uploads"));
// // Register customer routes
// customerRoutes(app);

// // Serve uploads folder statically
// app.use('/uploads', express.static(uploadsDir));

// // Other API routes
// app.use('/api/cars', carRoutes);
// app.use('/api/upload', uploadRouter);

// app.use('/api/locations', locationRoutes);
// app.use('/api/reservations', reservationRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/maintenance', maintenanceRoutes);
// app.use('/api/insurance', insuranceRoutes);

// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
// backend/src/index.ts or app.ts
import express from 'express';
import cors from 'cors';
import authorRoutes from './Author/author.router';
import blogRoutes from './Blog/blog.router';
import path from 'path';
import fs from 'fs';
import uploadRouter from './uploads/upload.router';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serves static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));



// Routes
authorRoutes(app);
blogRoutes(app);
app.use('/upload', uploadRouter);

const PORT = process.env.PORT || 8088;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;