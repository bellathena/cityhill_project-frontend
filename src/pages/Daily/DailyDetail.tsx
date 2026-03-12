import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../../component/ui/button';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';

interface Booking {
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
  customer?: { fullName: string; phone: string; citizenId: string; address?: string };
  room?: { roomNumber: number; floor: number; allowedType: string; roomType?: { typeName: string; baseDailyRate: number } };
}

const DailyDetail: React.FC = () => {
  const { rentalId } = useParams<{ rentalId: string }>();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchBooking = useCallback(async () => {
    if (!rentalId) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/daily-bookings/${rentalId}`);
      setBooking(data);
    } catch {
      addToast('ไม่พบข้อมูลการจอง', 'error');
    } finally {
      setLoading(false);
    }
  }, [rentalId, addToast]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const updateStatus = async (field: string, value: string, label: string) => {
    if (!booking || processing) return;
    try {
      setProcessing(true);
      await api.put(`/daily-bookings/${booking.id}`, { [field]: value });
      addToast(`อัปเดต${label}สำเร็จ`, 'success');
      fetchBooking();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

  if (loading) return <div className="p-6 text-center text-gray-500">กำลังโหลด...</div>;
  if (!booking) return <div className="p-6 text-center text-red-500">ไม่พบข้อมูลการจอง</div>;

  const { customer, room } = booking;
  const nights = Math.max(0, Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86400000));

  const statusMap: Record<string, { label: string; style: string }> = {
    PENDING: { label: 'รอเข้าพัก', style: 'bg-amber-100 text-amber-700 border-amber-200' },
    STAYED: { label: 'เข้าพักแล้ว', style: 'bg-blue-100 text-blue-700 border-blue-200' },
    CHECKED_OUT: { label: 'เช็คเอาท์แล้ว', style: 'bg-green-100 text-green-700 border-green-200' },
    CANCELLED: { label: 'ยกเลิก', style: 'bg-red-100 text-red-700 border-red-200' },
  };
  const paymentMap: Record<string, { label: string; style: string }> = {
    PENDING: { label: 'รอชำระ', style: 'bg-amber-100 text-amber-700' },
    PAID: { label: 'ชำระแล้ว', style: 'bg-green-100 text-green-700' },
  };

  const bStatus = statusMap[booking.bookingStatus] || { label: booking.bookingStatus, style: 'bg-gray-100' };
  const pStatus = paymentMap[booking.paymentStatus] || { label: booking.paymentStatus, style: 'bg-gray-100' };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">จอง #{booking.id}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${bStatus.style}`}>{bStatus.label}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${pStatus.style}`}>{pStatus.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-lg mb-4 border-b pb-2">ข้อมูลห้องพัก</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">ห้อง</span><span className="font-bold text-xl">{room?.roomNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ชั้น</span><span>{room?.floor}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ประเภท</span><span>{room?.roomType?.typeName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ราคา/คืน</span><span>{room?.roomType?.baseDailyRate?.toLocaleString()} บาท</span></div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-lg mb-4 border-b pb-2">ข้อมูลผู้เข้าพัก</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">ชื่อ-นามสกุล</span><span className="font-medium">{customer?.fullName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">เบอร์โทร</span><span>{customer?.phone}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">เลขบัตร</span><span>{customer?.citizenId}</span></div>
            {customer?.address && <div className="flex justify-between"><span className="text-gray-500">ที่อยู่</span><span className="text-right max-w-[200px]">{customer.address}</span></div>}
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-lg mb-4 border-b pb-2">รายละเอียดการจอง</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500 block">เช็คอิน</span><span className="font-medium">{formatDate(booking.checkInDate)}</span></div>
          <div><span className="text-gray-500 block">เช็คเอาท์</span><span className="font-medium">{formatDate(booking.checkOutDate)}</span></div>
          <div><span className="text-gray-500 block">จำนวนคืน</span><span className="font-medium">{nights} คืน</span></div>
          <div><span className="text-gray-500 block">จำนวนผู้เข้าพัก</span><span className="font-medium">{booking.numGuests || 1} คน</span></div>
        </div>
        {(booking.extraBedCount ?? 0) > 0 && (
          <p className="mt-3 text-sm text-gray-600">เตียงเสริม: {booking.extraBedCount} เตียง</p>
        )}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
          <span className="font-medium text-blue-700">ยอดรวมทั้งหมด</span>
          <span className="text-2xl font-bold text-blue-800">{fmt(booking.totalAmount)} บาท</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-wrap gap-3">
        {booking.bookingStatus === 'PENDING' && (
          <>
            <Button onClick={() => updateStatus('bookingStatus', 'STAYED', 'สถานะเข้าพัก')} disabled={processing} className="flex items-center gap-2">
              <CheckCircle size={16} /> เช็คอิน
            </Button>
            <Button variant="danger" onClick={() => updateStatus('bookingStatus', 'CANCELLED', 'ยกเลิก')} disabled={processing}>
              ยกเลิกการจอง
            </Button>
          </>
        )}
        {booking.bookingStatus === 'STAYED' && (
          <Button onClick={() => updateStatus('bookingStatus', 'CHECKED_OUT', 'เช็คเอาท์')} disabled={processing} className="flex items-center gap-2">
            <CheckCircle size={16} /> เช็คเอาท์
          </Button>
        )}
        {booking.paymentStatus === 'PENDING' && (
          <Button variant="secondary" onClick={() => updateStatus('paymentStatus', 'PAID', 'การชำระเงิน')} disabled={processing}>
            บันทึกการชำระเงิน
          </Button>
        )}
      </div>
    </div>
  );
};

export default DailyDetail;
