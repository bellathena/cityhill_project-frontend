import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Receipt } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../component/dialog';
import { useToast } from '../context/ToastContext';
import api from '../lib/axios';

interface Customer {
  id: number;
  fullName: string;
  phone: string;
}

interface Room {
  id: number;
  roomNumber: string;
  floor: number;
  typeId: number;
  currentStatus: string;
  pricePerDay?: number;
}

interface RoomType {
  id: number;
  typeName: string;
  baseMonthlyRate: number;
  baseDailyRate: number;
}

interface DailyBooking {
  id: number;
  customerId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
}

export const DailyRental: React.FC = () => {
  const { addToast } = useToast();
  
  // Data states
  const [dailyBookings, setDailyBookings] = useState<DailyBooking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [selectedBooking, setSelectedBooking] = useState<DailyBooking | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'checkin' | 'checkout' | null;
    bookingId: number | null;
  }>({
    isOpen: false,
    type: null,
    bookingId: null,
  });

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, roomsRes, customersRes, typesRes] = await Promise.all([
        api.get('/daily-bookings'),
        api.get('/rooms'),
        api.get('/customers'),
        api.get('/room-types'),
      ]);

      setDailyBookings(bookingsRes.data);
      setRooms(roomsRes.data);
      setCustomers(customersRes.data);
      setRoomTypes(typesRes.data);
    } catch (error) {
      addToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCheckIn = (bookingId: number) => {
    setConfirmDialog({
      isOpen: true,
      type: 'checkin',
      bookingId,
    });
  };

  const handleConfirmCheckIn = async () => {
    if (!confirmDialog.bookingId) return;
    
    try {
      console.log('Checking in booking:', confirmDialog.bookingId);
      await api.put(`/daily-bookings/${confirmDialog.bookingId}`, {
        bookingStatus: 'STAYED',
      });
      addToast('เช็คอินสำเร็จ', 'success');
      setConfirmDialog({ isOpen: false, type: null, bookingId: null });
      fetchAllData();
    } catch (error: any) {
      console.error('Check-in error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      addToast(`ไม่สามารถเช็คอินได้: ${errorMessage}`, 'error');
    }
  };

  const handleCheckOut = (bookingId: number) => {
    setConfirmDialog({
      isOpen: true,
      type: 'checkout',
      bookingId,
    });
  };

  const handleConfirmCheckOut = async () => {
    if (!confirmDialog.bookingId) return;
    
    try {
      console.log('Checking out booking:', confirmDialog.bookingId);
      await api.put(`/daily-bookings/${confirmDialog.bookingId}`, {
        bookingStatus: 'CHECKED_OUT',
      });
      addToast('เช็คเอาท์สำเร็จ', 'success');
      setConfirmDialog({ isOpen: false, type: null, bookingId: null });
      fetchAllData();
    } catch (error: any) {
      console.error('Check-out error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      addToast(`ไม่สามารถเช็คเอาท์ได้: ${errorMessage}`, 'error');
    }
  };

  const getRoom = (roomId: number) => {
    return rooms.find((r) => r.id === roomId);
  };

  const getCustomer = (customerId: number) => {
    return customers.find((c) => c.id === customerId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateDays = (checkIn: string, checkOut: string) => {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  // Filter bookings by status
  const pendingBookings = dailyBookings.filter((b) => b.bookingStatus === 'PENDING');
  const checkedInBookings = dailyBookings.filter((b) => b.bookingStatus === 'STAYED');
  const checkedOutBookings = dailyBookings.filter((b) => b.bookingStatus === 'CHECKED_OUT');

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">จัดการการเช่ารายวัน</h1>

      {/* Pending Bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">การจองที่รอเช็คอิน</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">เลขห้อง</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ชื่อลูกค้า</th>
                <th className="px-4 py-3 text-left text-sm font-medium">เช็คอิน</th>
                <th className="px-4 py-3 text-left text-sm font-medium">เช็คเอาท์</th>
                <th className="px-4 py-3 text-left text-sm font-medium">จำนวนวัน</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ยอดรวม</th>
                <th className="px-4 py-3 text-left text-sm font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pendingBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    ไม่มีการจองที่รอเช็คอิน
                  </td>
                </tr>
              ) : (
                pendingBookings.map((booking) => {
                  const room = getRoom(booking.roomId);
                  const customer = getCustomer(booking.customerId);
                  const days = calculateDays(booking.checkInDate, booking.checkOutDate);
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{room?.roomNumber}</td>
                      <td className="px-4 py-3">{customer?.fullName}</td>
                      <td className="px-4 py-3">{formatDate(booking.checkInDate)}</td>
                      <td className="px-4 py-3">{formatDate(booking.checkOutDate)}</td>
                      <td className="px-4 py-3">{days} วัน</td>
                      <td className="px-4 py-3">{booking.totalAmount.toLocaleString()} บาท</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(booking.id)}
                            className="flex items-center gap-1"
                          >
                            <LogIn size={16} />
                            เช็คอิน
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowReceipt(true);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Receipt size={16} />
                            ใบเสร็จ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checked In Bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">กำลังพักอยู่</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">เลขห้อง</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ชื่อลูกค้า</th>
                <th className="px-4 py-3 text-left text-sm font-medium">เช็คอิน</th>
                <th className="px-4 py-3 text-left text-sm font-medium">เช็คเอาท์</th>
                <th className="px-4 py-3 text-left text-sm font-medium">จำนวนวัน</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ยอดรวม</th>
                <th className="px-4 py-3 text-left text-sm font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {checkedInBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    ไม่มีแขกที่กำลังพักอยู่
                  </td>
                </tr>
              ) : (
                checkedInBookings.map((booking) => {
                  const room = getRoom(booking.roomId);
                  const customer = getCustomer(booking.customerId);
                  const days = calculateDays(booking.checkInDate, booking.checkOutDate);
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{room?.roomNumber}</td>
                      <td className="px-4 py-3">{customer?.fullName}</td>
                      <td className="px-4 py-3">{formatDate(booking.checkInDate)}</td>
                      <td className="px-4 py-3">{formatDate(booking.checkOutDate)}</td>
                      <td className="px-4 py-3">{days} วัน</td>
                      <td className="px-4 py-3">{booking.totalAmount.toLocaleString()} บาท</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleCheckOut(booking.id)}
                            className="flex items-center gap-1"
                          >
                            <LogOut size={16} />
                            เช็คเอาท์
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowReceipt(true);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Receipt size={16} />
                            ใบเสร็จ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checked Out History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">ประวัติการเช็คเอาท์</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">เลขห้อง</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ชื่อลูกค้า</th>
                <th className="px-4 py-3 text-left text-sm font-medium">เช็คอิน</th>
                <th className="px-4 py-3 text-left text-sm font-medium">เช็คเอาท์</th>
                <th className="px-4 py-3 text-left text-sm font-medium">จำนวนวัน</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ยอดรวม</th>
                <th className="px-4 py-3 text-left text-sm font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {checkedOutBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    ไม่มีประวัติการเช็คเอาท์
                  </td>
                </tr>
              ) : (
                checkedOutBookings.map((booking) => {
                  const room = getRoom(booking.roomId);
                  const customer = getCustomer(booking.customerId);
                  const days = calculateDays(booking.checkInDate, booking.checkOutDate);
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{room?.roomNumber}</td>
                      <td className="px-4 py-3">{customer?.fullName}</td>
                      <td className="px-4 py-3">{formatDate(booking.checkInDate)}</td>
                      <td className="px-4 py-3">{formatDate(booking.checkOutDate)}</td>
                      <td className="px-4 py-3">{days} วัน</td>
                      <td className="px-4 py-3">{booking.totalAmount.toLocaleString()} บาท</td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowReceipt(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Receipt size={16} />
                          ใบเสร็จ
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ใบเสร็จรับเงิน</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="py-4 space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="font-semibold text-lg">City Hill Apartment</h3>
                <p className="text-sm text-gray-600">ใบเสร็จค่าเช่ารายวัน</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">เลขห้อง:</span>
                  <span className="font-medium">
                    {getRoom(selectedBooking.roomId)?.roomNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ชื่อลูกค้า:</span>
                  <span className="font-medium">{getCustomer(selectedBooking.customerId)?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">วันที่เข้าพัก:</span>
                  <span className="font-medium">
                    {formatDate(selectedBooking.checkInDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">วันที่ออก:</span>
                  <span className="font-medium">
                    {formatDate(selectedBooking.checkOutDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">จำนวนวัน:</span>
                  <span className="font-medium">
                    {calculateDays(
                      selectedBooking.checkInDate,
                      selectedBooking.checkOutDate
                    )}{' '}
                    วัน
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>ยอดรวมทั้งสิ้น:</span>
                  <span className="text-blue-600">
                    {selectedBooking.totalAmount.toLocaleString()} บาท
                  </span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 pt-4">
                <p>ขอบคุณที่ใช้บริการ</p>
                <p>{new Date().toLocaleDateString('th-TH')}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.print()}
              className="flex-1"
            >
              พิมพ์
            </Button>
            <Button
              size="sm"
              onClick={() => setShowReceipt(false)}
              className="flex-1"
            >
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Check-In Dialog */}
      <Dialog 
        open={confirmDialog.isOpen && confirmDialog.type === 'checkin'} 
        onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, type: null, bookingId: null })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ยืนยันการเช็คอิน</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">คุณแน่ใจหรือไม่ว่าต้องการเช็คอินการจองนี้?</p>
          <DialogFooter className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmDialog({ isOpen: false, type: null, bookingId: null })}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirmCheckIn}
              className="flex-1"
            >
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Check-Out Dialog */}
      <Dialog 
        open={confirmDialog.isOpen && confirmDialog.type === 'checkout'} 
        onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, type: null, bookingId: null })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ยืนยันการเช็คเอาท์</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">คุณแน่ใจหรือไม่ว่าต้องการเช็คเอาท์การจองนี้?</p>
          <DialogFooter className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmDialog({ isOpen: false, type: null, bookingId: null })}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmCheckOut}
              className="flex-1"
            >
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
