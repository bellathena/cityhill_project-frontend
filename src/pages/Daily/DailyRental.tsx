import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, Search, X } from 'lucide-react';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Select } from '../../component/ui/select';
import { ConfirmDialog } from '../../component/dialog';
import { CreateBookingDialog } from '../../component/CreateBookingDialog';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';

interface Room {
  roomNumber: number;
  floor: number;
  typeId: number;
  allowedType: string;
  currentStatus: string;
  roomType?: { typeName: string; baseDailyRate: number };
}

interface Customer {
  id: number;
  fullName: string;
  phone: string;
  citizenId: string;
}

interface DailyBooking {
  id: number;
  customerId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  numGuests?: number;
  extraBedCount?: number;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  customer?: Customer;
  room?: Room;
}

export const DailyRental: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<DailyBooking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const now = new Date();
  const [searchText, setSearchText] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [form, setForm] = useState({
    customerId: '',
    roomId: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: '',
    numGuests: '1',
    extraBedCount: '0',
    totalAmount: '',
    paymentStatus: 'PAID',
    amountPaid: '',
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => { fetchData(); }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowCustomerDropdown(false);
    if (showCustomerDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showCustomerDropdown]);

  // Auto-calculate totalAmount based on room rate and nights
  useEffect(() => {
    if (form.roomId && form.checkInDate && form.checkOutDate) {
      const room = rooms.find((r) => r.roomNumber === Number(form.roomId));
      const rate = room?.roomType?.baseDailyRate ?? 0;
      const nights = calcNights(form.checkInDate, form.checkOutDate) || 1;
      const extraBeds = Number(form.extraBedCount) || 0;
      const total = (rate + (extraBeds * 200)) * nights;
      setForm((f) => ({ ...f, totalAmount: String(total) }));
    }
  }, [form.checkInDate, form.checkOutDate, form.roomId, form.extraBedCount, rooms]);

  // Auto-calculate amountPaid when paymentStatus is PAID
  useEffect(() => {
    if (form.paymentStatus === 'PAID' && form.totalAmount) {
      setForm((f) => ({ ...f, amountPaid: f.totalAmount }));
    } else if (form.paymentStatus === 'PENDING') {
      setForm((f) => ({ ...f, amountPaid: '0' }));
    }
  }, [form.paymentStatus, form.totalAmount]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bkRes, rmRes, custRes] = await Promise.all([
        api.get('/daily-bookings'),
        api.get('/rooms'),
        api.get('/customers'),
      ]);
      setBookings(bkRes.data || []);
      setRooms(rmRes.data || []);
      setCustomers(custRes.data || []);
    } catch {
      addToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRoom = (roomId: number) => rooms.find((r) => r.roomNumber === roomId);
  const getCustomer = (customerId: number) => customers.find((c) => c.id === customerId);

  // Available rooms for daily rental
  const availableRooms = rooms.filter(
    (r) => (r.allowedType === 'DAILY' || r.allowedType === 'FLEXIBLE') && r.currentStatus === 'AVAILABLE'
  );

  const handleRoomChange = (roomNumber: string) => {
    setForm((f) => ({ ...f, roomId: roomNumber }));
  };

  const handleCustomerSelect = (customer: Customer) => {
    setForm((f) => ({ ...f, customerId: String(customer.id) }));
    setCustomerSearch(customer.fullName);
    setShowCustomerDropdown(false);
  };

  const filteredCustomers = customers
    .filter((c) => c.fullName.toLowerCase().includes(customerSearch.toLowerCase()))
    .slice(0, 10);

  const selectedCustomer = customers.find((c) => c.id === Number(form.customerId));

  const calcNights = (cin: string, cout: string) => {
    if (!cin || !cout) return 0;
    const d1 = new Date(cin);
    const d2 = new Date(cout);
    const diff = Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
    return diff;
  };

  const handleCreate = async () => {
    try {
      if (!form.customerId || !form.roomId || !form.checkInDate || !form.checkOutDate) {
        addToast('กรุณากรอกข้อมูลให้ครบ', 'warning');
        return;
      }
      await api.post('/daily-bookings', {
        customerId: Number(form.customerId),
        roomId: Number(form.roomId),
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        numGuests: Number(form.numGuests) || 1,
        extraBedCount: Number(form.extraBedCount) || 0,
        totalAmount: parseFloat(form.totalAmount) || 0,
        paymentStatus: form.paymentStatus,
        amountPaid: parseFloat(form.amountPaid) || 0,
      });
      addToast('สร้างการจองสำเร็จ', 'success');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await api.delete(`/daily-bookings/${confirmDelete.id}`);
      addToast('ลบรายการสำเร็จ', 'success');
      fetchData();
    } catch {
      addToast('ไม่สามารถลบได้', 'error');
    } finally {
      setConfirmDelete({ open: false, id: null });
    }
  };

  const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const filteredBookings = bookings.filter((bk) => {
    const room = bk.room || getRoom(bk.roomId);
    const customer = bk.customer || getCustomer(bk.customerId);
    const q = searchText.toLowerCase();
    if (q && !String(room?.roomNumber ?? '').includes(q) && !(customer?.fullName ?? '').toLowerCase().includes(q)) return false;
    if (filterMonth || filterYear) {
      const d = new Date(bk.checkInDate);
      if (filterMonth && d.getMonth() !== Number(filterMonth)) return false;
      if (filterYear && d.getFullYear() !== Number(filterYear)) return false;
    }
    if (filterStatus && bk.bookingStatus !== filterStatus) return false;
    return true;
  });

  // Separate bookings by status
  const stayedBookings = filteredBookings.filter((bk) => bk.bookingStatus === 'STAYED');
  const checkedOutBookings = filteredBookings.filter((bk) => bk.bookingStatus === 'CHECKED_OUT');

  const clearFilters = () => { setSearchText(''); setFilterMonth(''); setFilterYear(''); setFilterStatus(''); };
  const hasFilter = searchText || filterMonth || filterYear || filterStatus;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

  const statusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      STAYED: { class: 'bg-blue-100 text-blue-700', label: 'เข้าพักแล้ว' },
      CHECKED_OUT: { class: 'bg-slate-100 text-slate-700', label: 'เช็คเอาท์แล้ว' },
    };
    const s = map[status] || { class: 'bg-gray-100 text-gray-700', label: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.class}`}>{s.label}</span>;
  };

  const paymentBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      PENDING: { class: 'bg-amber-100 text-amber-700', label: 'รอชำระ' },
      PAID: { class: 'bg-green-100 text-green-700', label: 'ชำระแล้ว' },
    };
    const s = map[status] || { class: 'bg-gray-100 text-gray-700', label: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.class}`}>{s.label}</span>;
  };

  const renderBookingTable = (bookingsList: DailyBooking[], title: string, emptyMessage: string) => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-5 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-700">{title} ({bookingsList.length} รายการ)</h3>
      </div>
      {bookingsList.length === 0 ? (
        <div className="py-12 text-center text-gray-400">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">ห้อง</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">ผู้เข้าพัก</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">เช็คอิน</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">เช็คเอาท์</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">ราคารวม</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">สถานะการเข้าพัก</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">การชำระ</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookingsList.map((bk) => {
                const room = bk.room || getRoom(bk.roomId);
                const customer = bk.customer || getCustomer(bk.customerId);
                return (
                  <tr key={bk.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{room?.roomNumber ?? bk.roomId}</td>
                    <td className="px-4 py-3">{customer?.fullName ?? '-'}</td>
                    <td className="px-4 py-3">{formatDate(bk.checkInDate)}</td>
                    <td className="px-4 py-3">{formatDate(bk.checkOutDate)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(bk.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(bk.bookingStatus)}</td>
                    <td className="px-4 py-3 text-center">{paymentBadge(bk.paymentStatus)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => navigate(`/daily-rental/${bk.id}`)} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"><Eye size={16} /></button>
                        <button onClick={() => setConfirmDelete({ open: true, id: bk.id })} className="p-2 hover:bg-red-100 rounded-lg text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">จัดการเช่ารายวัน</h1>
        <Button onClick={() => { 
          setForm({ customerId: '', roomId: '', checkInDate: new Date().toISOString().split('T')[0], checkOutDate: '', numGuests: '1', extraBedCount: '0', totalAmount: '', paymentStatus: 'PAID', amountPaid: '' }); 
          setCustomerSearch(''); 
          setShowCustomerDropdown(false); 
          setIsCreateOpen(true); 
        }} className="flex items-center gap-2">
          <Plus size={16} /> สร้างการพักรายวัน
        </Button>
      </div>

      {/* Search + Filter bar */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาห้อง หรือชื่อผู้เข้าพัก..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="min-w-[140px]">
          <Select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">ทุกเดือน</option>
            {THAI_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </Select>
        </div>
        <div className="min-w-[120px]">
          <Select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">ทุกปี</option>
            {yearOptions.map((y) => <option key={y} value={y}>{y + 543} ({y})</option>)}
          </Select>
        </div>
        <div className="min-w-[140px]">
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">ทุกสถานะ</option>
            <option value="STAYED">เข้าพักแล้ว</option>
            <option value="CHECKED_OUT">เช็คเอาท์แล้ว</option>
          </Select>
        </div>
        {hasFilter && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-300 transition-colors">
            <X size={14} /> ล้าง
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow py-12 text-center text-gray-400">กำลังโหลด...</div>
      ) : (
        <div className="space-y-6">
          {/* ตารางผู้เข้าพัก */}
          {renderBookingTable(
            stayedBookings,
            'ผู้เข้าพักปัจจุบัน',
            hasFilter ? 'ไม่พบรายการผู้เข้าพักที่ตรงกับเงื่อนไข' : 'ไม่มีผู้เข้าพักในขณะนี้'
          )}
          
          {/* ตารางผู้เช็คเอาท์ */}
          {renderBookingTable(
            checkedOutBookings,
            'ประวัติการเช็คเอาท์',
            hasFilter ? 'ไม่พบประวัติการเช็คเอาท์ที่ตรงกับเงื่อนไข' : 'ไม่มีประวัติการเช็คเอาท์'
          )}
        </div>
      )}

      {/* Create Booking Dialog */}
      <CreateBookingDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        form={form}
        setForm={setForm}
        customers={customers}
        availableRooms={availableRooms}
        customerSearch={customerSearch}
        setCustomerSearch={setCustomerSearch}
        showCustomerDropdown={showCustomerDropdown}
        setShowCustomerDropdown={setShowCustomerDropdown}
        filteredCustomers={filteredCustomers}
        handleCustomerSelect={handleCustomerSelect}
        handleRoomChange={handleRoomChange}
        handleCreate={handleCreate}
      />

      <ConfirmDialog
        isOpen={confirmDelete.open}
        title="ยืนยันการลบ"
        description="คุณต้องการลบรายการจองนี้หรือไม่?"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        isDangerous
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </div>
  );
};

export default DailyRental;
