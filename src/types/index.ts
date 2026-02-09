// Enums matching Prisma schema
export type RoomStatus = "AVAILABLE" | "OCCUPIED_M" | "OCCUPIED_D" | "RESERVED" | "MAINTENANCE";
export type AllowedType = "MONTHLY" | "DAILY" | "FLEXIBLE";
export type BookingStatus = "CONFIRMED" | "STAYED" | "CANCELLED" | "CHECKED_OUT";
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE";
export type ContractStatus = "ACTIVE" | "NOTICE" | "CLOSED";

// Room Type
export interface RoomTypeData {
  id: number;
  typeName: string;
  description?: string;
  baseMonthlyRate: number;
  baseDailyRate: number;
  createdAt: string;
  updatedAt: string;
}

// Room
export interface Room {
  id: number;
  roomNumber: string;
  floor: number;
  typeId: number;
  roomType?: RoomTypeData;
  allowedType: AllowedType;
  currentStatus: RoomStatus;
  latestMeterElectric?: number;
  latestMeterWater?: number;
  createdAt: string;
  updatedAt: string;
}

// Customer
export interface Customer {
  id: number;
  fullName: string;
  citizenId: string;
  address?: string;
  phone: string;
  carLicense?: string;
  customerImage?: string;
  createdAt: string;
  updatedAt: string;
}

// Daily Booking
export interface DailyBooking {
  id: number;
  customerId: number;
  customer?: Customer;
  roomId: number;
  room?: Room;
  checkInDate: string;
  checkOutDate: string;
  numGuests?: number;
  extraBedCount?: number;
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

// Monthly Contract
export interface MonthlyContract {
  id: number;
  customerId: number;
  customer?: Customer;
  roomId: number;
  room?: Room;
  startDate: string;
  endDate?: string;
  depositAmount: number;
  advancePayment: number;
  monthlyRentRate: number;
  contractStatus: ContractStatus;
  contractFile?: string;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface SystemUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: "STAFF" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}
