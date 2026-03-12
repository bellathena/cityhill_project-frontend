// Enums matching backend Prisma schema
export type UserRole = "ADMIN" | "STAFF";
export type AllowedType = "MONTHLY" | "DAILY" | "FLEXIBLE";
export type RoomStatus = "AVAILABLE" | "OCCUPIED_M" | "OCCUPIED_D" | "RESERVED" | "MAINTENANCE";
export type BookingStatus = "PENDING" | "STAYED" | "CANCELLED" | "CHECKED_OUT";
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE";
export type ContractStatus = "PENDING" | "ACTIVE" | "NOTICE" | "CLOSED";
export type PaymentMethod = "CASH" | "TRANSFER" | "CREDIT_CARD";
export type RefundStatus = "PENDING" | "REFUNDED";

export interface SystemUser {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface RoomTypeData {
  id: number;
  typeName: string;
  description?: string;
  baseMonthlyRate: number;
  baseDailyRate: number;
  rooms?: RoomData[];
  createdAt: string;
  updatedAt: string;
}

// Room uses roomNumber (Int) as primary key
export interface RoomData {
  roomNumber: number;
  floor: number;
  typeId: number;
  allowedType: AllowedType;
  currentStatus: RoomStatus;
  latestMeterElectric?: number;
  latestMeterWater?: number;
  roomType?: RoomTypeData;
  createdAt: string;
  updatedAt: string;
}

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

export interface DailyBooking {
  id: number;
  customerId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  numGuests?: number;
  extraBedCount?: number;
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  customer?: Customer;
  room?: RoomData;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyContract {
  id: number;
  customerId: number;
  roomId: number;
  startDate: string;
  endDate?: string;
  depositAmount: number;
  advancePayment: number;
  monthlyRentRate: number;
  contractStatus: ContractStatus;
  contractFile?: string;
  customer?: Customer;
  room?: RoomData;
  invoices?: InvoiceData[];
  moveOutSettlement?: MoveOutSettlementData;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceData {
  id: number;
  monthlyContractId?: number;
  invoiceDate: string;
  dueDate: string;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  monthlyContract?: MonthlyContract;
  payments?: PaymentData[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentData {
  id: number;
  invoiceId: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  slipImage?: string;
  invoice?: InvoiceData;
  createdAt: string;
  updatedAt: string;
}

export interface MoveOutSettlementData {
  id: number;
  contractId: number;
  moveOutDate: string;
  totalDeposit: number;
  damageDeduction?: number;
  cleaningFee?: number;
  outstandingBalance?: number;
  netRefund: number;
  refundStatus: RefundStatus;
  contract?: MonthlyContract;
  createdAt: string;
  updatedAt: string;
}

export interface UtilityType {
  id: number;
  uType: string;
  ratePerUnit: number;
  usages?: UtilityUsageData[];
  createdAt: string;
  updatedAt: string;
}

export interface UtilityUsageData {
  id: number;
  roomId: number;
  recordDate: string;
  utilityUnit: number;
  uTypeId: number;
  room?: RoomData;
  utilityType?: UtilityType;
  createdAt: string;
  updatedAt: string;
}
