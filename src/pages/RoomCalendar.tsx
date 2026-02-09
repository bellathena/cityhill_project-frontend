import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "../component/ui/input";
import { Button } from "../component/ui/button";
import { useToast } from "../context/ToastContext";
import api from "../lib/axios";
import { cn } from "../lib/utils";
import { X } from "lucide-react";

interface Customer {
  id: number;
  fullName: string;
  citizenId: string;
  address: string;
  phone: string;
  carLicense: string;
}

interface Room {
  id: number;
  roomNumber: string;
  floor: number;
  typeId: number;
  currentStatus: string;
  pricePerDay?: number;
  pricePerMonth?: number;
}

interface RoomType {
  id: number;
  typeName: string;
  description: string;
  baseDailyRate: number;
  baseMonthlyRate: number;
}

interface MonthlyContract {
  id: number;
  customerId: number;
  roomId: number;
  startDate: string;
  endDate: string;
  depositAmount: number;
  advancePayment: number;
  monthlyRentRate: number;
  contractStatus: string;
}

interface DailyBooking {
  id: number;
  customerId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  extraBedCount: number;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
}

export const RoomCalendar: React.FC = () => {
  const { addToast } = useToast();

  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [monthlyContracts, setMonthlyContracts] = useState<MonthlyContract[]>(
    [],
  );
  const [dailyBookings, setDailyBookings] = useState<DailyBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Dialog states
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [bookingType, setBookingType] = useState<"daily" | "monthly">("daily");
  const [selectedRoomId, setSelectedRoomId] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<number>(1);
  const [selectedBookingData, setSelectedBookingData] = useState<any>(null);
  
  // Customer search/select states
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const filteredCustomers = customers.filter((c) =>
    c.fullName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    c.phone.includes(customerSearchTerm)
  );

  // Form data
  const [bookingForm, setBookingForm] = useState({
    startDate: "",
    endDate: "",
    customerId: 0,
    customerPhone: "",
    citizenId: "",
    address: "",
    carLicense: "",
    depositAmount: "",
    advancePayment: "",
    monthlyRentRate: "",
    numGuests: "",
    extraBedCount: "",
    totalAmount: "",
  });

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [customersRes, roomsRes, typesRes, contractsRes, bookingsRes] =
        await Promise.all([
          api.get("/customers"),
          api.get("/rooms"),
          api.get("/room-types"),
          api.get("/monthly-contracts"),
          api.get("/daily-bookings"),
        ]);

      setCustomers(customersRes.data);
      setRooms(roomsRes.data);
      setRoomTypes(typesRes.data);
      setMonthlyContracts(contractsRes.data);
      setDailyBookings(bookingsRes.data);

      // Log existing booking statuses to see valid enum values
      if (bookingsRes.data.length > 0) {
        console.log(
          "Sample booking statuses:",
          bookingsRes.data.map((b: DailyBooking) => ({
            bookingStatus: b.bookingStatus,
            paymentStatus: b.paymentStatus,
          })),
        );
      }
    } catch (error) {
      addToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Get days in month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Filter rooms
  const filteredRooms = rooms
    .filter((room) => {
      const matchesSearch = room.roomNumber.includes(searchTerm);
      const matchesStatus =
        statusFilter === "all" || room.currentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (a.floor !== b.floor) return b.floor - a.floor;
      return a.roomNumber.localeCompare(b.roomNumber);
    });

  const getRoomType = (roomTypeId: number) => {
    return roomTypes.find((type) => type.id === roomTypeId);
  };

  // Check if a room has booking on specific day
  const getBookingForCell = (roomId: number, day: number) => {
    const date = new Date(selectedYear, selectedMonth - 1, day);

    // Check daily bookings
    const dailyBooking = dailyBookings.find((booking) => {
      if (booking.roomId !== roomId) return false;
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      return date >= checkIn && date <= checkOut;
    });

    if (dailyBooking) {
      return { type: "daily" as const, data: dailyBooking };
    }

    // Check monthly contracts
    const monthlyContract = monthlyContracts.find((contract) => {
      if (contract.roomId !== roomId || contract.contractStatus !== "ACTIVE")
        return false;
      const start = new Date(contract.startDate);
      const end = contract.endDate
        ? new Date(contract.endDate)
        : new Date(2099, 11, 31);
      return date >= start && date <= end;
    });

    if (monthlyContract) {
      return { type: "monthly" as const, data: monthlyContract };
    }

    return null;
  };

  // Handle cell click to open booking dialog or cancel dialog
  const handleCellClick = (roomId: number, day: number) => {
    const booking = getBookingForCell(roomId, day);

    if (booking) {
      // If already booked, show cancel dialog
      setSelectedBookingData(booking);
      setIsCancelDialogOpen(true);
      return;
    }

    setSelectedRoomId(roomId);
    setSelectedDate(day);
    setCustomerSearchTerm("");
    setShowCustomerDropdown(false);
    setIsCreatingNewCustomer(false);
    setSelectedCustomer(null);
    setBookingForm({
      startDate: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      endDate: "",
      customerId: 0,
      customerPhone: "",
      citizenId: "",
      address: "",
      carLicense: "",
      depositAmount: "",
      advancePayment: "",
      monthlyRentRate: "",
      numGuests: "",
      extraBedCount: "",
      totalAmount: "",
    });
    setIsBookingDialogOpen(true);
  };

  // Handle select existing customer
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setBookingForm({
      ...bookingForm,
      customerId: customer.id,
      customerPhone: customer.phone,
      citizenId: customer.citizenId,
      address: customer.address,
      carLicense: customer.carLicense,
    });
    setCustomerSearchTerm("");
    setShowCustomerDropdown(false);
  };

  // Handle create new customer mode
  const handleCreateNewCustomer = () => {
    setIsCreatingNewCustomer(true);
    setSelectedCustomer(null);
    setBookingForm({
      ...bookingForm,
      customerId: 0,
      customerPhone: "",
      citizenId: "",
      address: "",
      carLicense: "",
    });
    setShowCustomerDropdown(false);
  };

  // Handle booking submission
  const handleBooking = async () => {
    const room = rooms.find((r) => r.id === selectedRoomId);
    if (!room) return;

    // Validation
    if (!selectedCustomer && !isCreatingNewCustomer) {
      addToast("กรุณาเลือกหรือสร้างลูกค้า", "error");
      return;
    }

    if (isCreatingNewCustomer && !bookingForm.customerPhone.trim()) {
      addToast("กรุณาระบุเบอร์โทรศัพท์", "error");
      return;
    }

    if (!bookingForm.startDate) {
      addToast("กรุณาระบุวันที่เริ่มต้น", "error");
      return;
    }

    if (bookingType === "daily" && !bookingForm.endDate) {
      addToast("กรุณาระบุวันที่สิ้นสุดสำหรับการจองรายวัน", "error");
      return;
    }

    if (bookingType === "daily") {
      const start = new Date(bookingForm.startDate);
      const end = new Date(bookingForm.endDate);
      if (end < start) {
        addToast("วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น", "error");
        return;
      }
    }

    try {
      let customerId: number | undefined;

      // If selected existing customer, use that
      if (selectedCustomer) {
        customerId = selectedCustomer.id;
        console.log("Using existing customer:", selectedCustomer);
      } else if (isCreatingNewCustomer) {
        // Create new customer
        const newCustomer = {
          fullName: bookingForm.customerPhone || `Customer_${new Date().getTime()}`,
          citizenId: bookingForm.citizenId || "",
          address: bookingForm.address || "",
          phone: bookingForm.customerPhone || "",
          carLicense: bookingForm.carLicense || "",
        };
        console.log("Creating new customer with payload:", newCustomer);
        try {
          const customerRes = await api.post("/customers", newCustomer);
          customerId = customerRes.data.id;
          console.log("Customer created with ID:", customerId);
          // Add to local array to prevent duplicate creation
          if (customerId) {
            customers.push({ ...newCustomer, id: customerId });
          }
        } catch (customerError: any) {
          console.error(
            "Customer creation failed:",
            customerError.response?.data || customerError.message,
          );
          const errorMsg =
            customerError.response?.data?.message ||
            customerError.response?.data?.error ||
            customerError.message;
          addToast(`ไม่สามารถสร้างลูกค้าได้: ${errorMsg}`, "error");
          return;
        }
      }

      if (!customerId) {
        addToast("ไม่สามารถสร้างข้อมูลลูกค้าได้", "error");
        return;
      }

      if (bookingType === "daily") {
        const roomType = getRoomType(room.typeId);
        const start = new Date(bookingForm.startDate);
        const end = new Date(bookingForm.endDate);
        const daysDiff =
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1;
        const totalAmount =
          (roomType?.baseDailyRate || room.pricePerDay || 0) * daysDiff;

        const payload = {
          roomId: selectedRoomId,
          customerId,
          checkInDate: bookingForm.startDate,
          checkOutDate: bookingForm.endDate,
          numGuests: Number(bookingForm.numGuests) || 1,
          extraBedCount: Number(bookingForm.extraBedCount) || 0,
          totalAmount: Number(bookingForm.totalAmount) || totalAmount,
          bookingStatus: "PENDING",
          paymentStatus: "PENDING",
          currentStatus: "OCCUPIED_D"
        };

        console.log("Sending daily booking payload:", payload);
        await api.post("/daily-bookings", payload);
        addToast("จองห้องรายวันสำเร็จ", "success");
      } else {
        const roomType = getRoomType(room.typeId);
        const monthlyRate =
          roomType?.baseMonthlyRate || room.pricePerMonth || 0;

        const payload = {
          roomId: selectedRoomId,
          customerId,
          startDate: bookingForm.startDate,
          endDate: bookingForm.endDate || null,
          depositAmount: Number(bookingForm.depositAmount) || 0,
          advancePayment: Number(bookingForm.advancePayment) || 0,
          monthlyRentRate: Number(bookingForm.monthlyRentRate) || monthlyRate,
          contractStatus: "PENDING",
          currentStatus: "OCCUPIED_M"
        };

        console.log("Sending monthly contract payload:", payload);
        await api.post("/monthly-contracts", payload);
        addToast("สร้างสัญญารายเดือนสำเร็จ", "success");
      }

      setIsBookingDialogOpen(false);
      fetchAllData();
    } catch (error: any) {
      console.error("Booking error:", error);
      console.error("Error details:", error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "เกิดข้อผิดพลาด";
      addToast(`ไม่สามารถจองได้: ${errorMessage}`, "error");
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async () => {
    if (!selectedBookingData) return;

    try {
      const isDaily = selectedBookingData.type === "daily";
      const bookingId = selectedBookingData.data.id;

      console.log(
        `Canceling ${isDaily ? "daily" : "monthly"} booking ID: ${bookingId}`,
      );

      if (isDaily) {
        await api.delete(`/daily-bookings/${bookingId}`);
        addToast("ยกเลิกการจองรายวันสำเร็จ", "success");
      } else {
        await api.delete(`/monthly-contracts/${bookingId}`);
        addToast("ยกเลิกสัญญารายเดือนสำเร็จ", "success");
      }

      setIsCancelDialogOpen(false);
      setSelectedBookingData(null);
      fetchAllData();
    } catch (error: any) {
      console.error("Cancel error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "เกิดข้อผิดพลาด";
      addToast(`ไม่สามารถยกเลิกได้: ${errorMessage}`, "error");
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">ปฏิทินห้องพัก</h1>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              placeholder="ค้นหาเลขห้อง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="AVAILABLE">ว่าง</option>
            <option value="OCCUPIED_M">รายเดือน</option>
            <option value="OCCUPIED_D">รายวัน</option>
            <option value="RESERVED">จอง</option>
            <option value="MAINTENANCE">ซ่อม</option>
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {new Date(2000, month - 1).toLocaleDateString("th-TH", {
                  month: "long",
                })}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>
                {year + 543}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow overflow-auto">
        <div className="min-w-max">
          {/* Header */}
          <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="w-24 p-2 font-medium border-r border-gray-200">
              ห้อง
            </div>
            {days.map((day) => (
              <div
                key={day}
                className="w-12 p-2 text-center text-sm font-medium border-r border-gray-200"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Rows */}
          {filteredRooms.map((room) => {
            const roomType = getRoomType(room.typeId);
            // กำหนดสีพื้นหลังตามประเภทห้อง
            const getRowBgColor = () => {
              if (!roomType) return "";
              const colors = ["bg-white-50"];
              return colors[(roomType.id - 1) % colors.length] || "";
            };
            return (
              <div
                key={room.id}
                className={cn("flex border-b border-gray-200", getRowBgColor())}
              >
                <div className="w-24 p-2 border-r border-gray-200">
                  <div className="font-medium text-sm">{room.roomNumber}</div>
                  <div className="text-xs text-gray-500">
                    {roomType?.typeName}
                  </div>
                </div>
                {days.map((day) => {
                  const booking = getBookingForCell(room.id, day);
                  return (
                    <div
                      key={day}
                      className={cn(
                        "w-12 p-1 border-r border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors",
                        booking?.type === "daily" && "bg-teal-500",
                        booking?.type === "monthly" && "bg-blue-500",
                      )}
                      onClick={() => handleCellClick(room.id, day)}
                      title={
                        booking
                          ? booking.type === "daily"
                            ? "รายวัน"
                            : "รายเดือน"
                          : "คลิกเพื่อจอง"
                      }
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium mb-2">สัญลักษณ์</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white border"></div>
            <span>ว่าง</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-500"></div>
            <span>รายวัน</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500"></div>
            <span>รายเดือน</span>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      {isBookingDialogOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                จองห้อง {rooms.find((r) => r.id === selectedRoomId)?.roomNumber}
              </h2>

              <button
                onClick={() => setIsBookingDialogOpen(false)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">ประเภทการจอง</label>
                <select
                  value={bookingType}
                  onChange={(e) =>
                    setBookingType(e.target.value as "daily" | "monthly")
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                >
                  <option value="daily">รายวัน</option>
                  <option value="monthly">รายเดือน</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">วันที่เริ่มต้น *</label>
                <Input
                  type="date"
                  value={bookingForm.startDate}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      startDate: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {bookingType === "daily" && (
                <div>
                  <label className="text-sm font-medium">วันที่สิ้นสุด *</label>
                  <Input
                    type="date"
                    value={bookingForm.endDate}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        endDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              )}

              {/* Customer Selection */}
              {!isCreatingNewCustomer ? (
                <div>
                  <label className="text-sm font-medium">เลือกลูกค้า *</label>
                  <div className="relative">
                    <Input
                      value={customerSearchTerm}
                      onChange={(e) => {
                        setCustomerSearchTerm(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      placeholder="ค้นหาชื่อหรือเบอร์โทร..."
                      onFocus={() => setShowCustomerDropdown(true)}
                      required
                    />
                    {selectedCustomer && (
                      <div className="text-xs text-green-600 mt-1">
                        ✓ เลือก: {selectedCustomer.fullName}
                      </div>
                    )}

                    {/* Dropdown list */}
                    {showCustomerDropdown && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredCustomers.length > 0 ? (
                          <>
                            {filteredCustomers.map((customer) => (
                              <div
                                key={customer.id}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b text-sm"
                                onClick={() => handleSelectCustomer(customer)}
                              >
                                <div className="font-medium">{customer.fullName}</div>
                                <div className="text-xs text-gray-500">{customer.phone}</div>
                              </div>
                            ))}
                            <div
                              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 cursor-pointer font-medium text-sm text-blue-600"
                              onClick={handleCreateNewCustomer}
                            >
                              + สร้างลูกค้าใหม่
                            </div>
                          </>
                        ) : (
                          <div
                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 cursor-pointer font-medium text-sm text-blue-600"
                            onClick={handleCreateNewCustomer}
                          >
                            + สร้างลูกค้าใหม่
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Create new customer form */
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium">สร้างลูกค้าใหม่</label>
                    <button
                      className="text-xs text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        setIsCreatingNewCustomer(false);
                        setCustomerSearchTerm("");
                        setShowCustomerDropdown(false);
                      }}
                    >
                      ← กลับไปเลือก
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">เบอร์โทรศัพท์ *</label>
                <Input
                  value={bookingForm.customerPhone}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      customerPhone: e.target.value,
                    })
                  }
                  placeholder="กรอกเบอร์โทรศัพท์"
                  required={isCreatingNewCustomer}
                />
              </div>

              <div>
                <label className="text-sm font-medium">เลขบัตรประชาชน</label>
                <Input
                  value={bookingForm.citizenId}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      citizenId: e.target.value,
                    })
                  }
                  placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
                  maxLength={13}
                />
              </div>

              <div>
                <label className="text-sm font-medium">ที่อยู่</label>
                <Input
                  value={bookingForm.address}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, address: e.target.value })
                  }
                  placeholder="กรอกที่อยู่"
                />
              </div>

              <div>
                <label className="text-sm font-medium">ทะเบียนรถ</label>
                <Input
                  value={bookingForm.carLicense}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      carLicense: e.target.value,
                    })
                  }
                  placeholder="กรอกทะเบียนรถ (ถ้ามี)"
                />
              </div>

              {bookingType === "daily" ? (
                <>
                  <div>
                    <label className="text-sm font-medium">
                      จำนวนผู้เข้าพัก
                    </label>
                    <Input
                      type="number"
                      value={bookingForm.numGuests}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          numGuests: e.target.value,
                        })
                      }
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">เตียงเสริม</label>
                    <Input
                      type="number"
                      value={bookingForm.extraBedCount}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          extraBedCount: e.target.value,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  {/* <div>
                    <label className="text-sm font-medium">ยอดรวม</label>
                    <Input
                      type="number"
                      value={bookingForm.totalAmount}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          totalAmount: e.target.value,
                        })
                      }
                      placeholder="0"
                    />
                  </div> */}
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium">
                      วันที่สิ้นสุดสัญญา (ถ้ามี)
                    </label>
                    <Input
                      type="date"
                      value={bookingForm.endDate}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          endDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">มัดจำ</label>
                    <Input
                      type="number"
                      value={bookingForm.depositAmount}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          depositAmount: e.target.value,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      ค่าเช่าล่วงหน้า
                    </label>
                    <Input
                      type="number"
                      value={bookingForm.advancePayment}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          advancePayment: e.target.value,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  {/* <div>
                    <label className="text-sm font-medium">
                      ค่าเช่ารายเดือน
                    </label>
                    <Input
                      type="number"
                      value={bookingForm.monthlyRentRate}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          monthlyRentRate: e.target.value,
                        })
                      }
                      placeholder="0"
                    />
                  </div> */}
                </>
              )}

              <Button onClick={handleBooking} className="w-full">
                ยืนยันการจอง
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsBookingDialogOpen(false)}
                className="w-full"
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {isCancelDialogOpen && selectedBookingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-red-600">
              ยกเลิกการจอง
            </h2>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-gray-600">ประเภท</p>
                <p className="font-medium">
                  {selectedBookingData.type === "daily"
                    ? "จองรายวัน"
                    : "สัญญารายเดือน"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">ห้อง</p>
                <p className="font-medium">
                  {
                    rooms.find((r) => r.id === selectedBookingData.data.roomId)
                      ?.roomNumber
                  }
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">ลูกค้า</p>
                <p className="font-medium">
                  {
                    customers.find(
                      (c) => c.id === selectedBookingData.data.customerId,
                    )?.fullName
                  }
                </p>
              </div>

              {selectedBookingData.type === "daily" ? (
                <>
                  <div>
                    <p className="text-sm text-gray-600">วันที่เข้า</p>
                    <p className="font-medium">
                      {selectedBookingData.data.checkInDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">วันที่ออก</p>
                    <p className="font-medium">
                      {selectedBookingData.data.checkOutDate}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-600">วันที่เริ่ม</p>
                    <p className="font-medium">
                      {selectedBookingData.data.startDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">วันที่สิ้นสุด</p>
                    <p className="font-medium">
                      {selectedBookingData.data.endDate || "ไม่กำหนด"}
                    </p>
                  </div>
                </>
              )}
            </div>

            <p className="text-sm text-red-500 mb-6">
              ⚠️ การยกเลิกนี้จะได้ถูกลบและไม่สามารถกู้คืนได้
            </p>

            <Button
              onClick={handleCancelBooking}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              ยืนยันการยกเลิก
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsCancelDialogOpen(false)}
              className="w-full mt-2"
            >
              ปิด
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
