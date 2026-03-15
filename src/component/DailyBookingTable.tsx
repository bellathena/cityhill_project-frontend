import React from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface BookingTableRoom {
  roomNumber: number;
}

interface BookingTableCustomer {
  fullName: string;
}

interface BookingTableItem {
  id: number;
  roomId: number;
  customerId: number;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  room?: BookingTableRoom;
  customer?: BookingTableCustomer;
}

interface DailyBookingTableProps {
  bookingsList: BookingTableItem[];
  title: string;
  emptyMessage: string;
  accentColorClass?: string;
  getRoom: (roomId: number) => BookingTableRoom | undefined;
  getCustomer: (customerId: number) => BookingTableCustomer | undefined;
  formatDate: (dateString: string) => string;
  fmt: (amount: number) => string;
  statusBadge: (status: string) => React.ReactNode;
  paymentBadge: (status: string) => React.ReactNode;
  onView: (bookingId: number) => void;
  onDelete: (bookingId: number) => void;
}

export const DailyBookingTable: React.FC<DailyBookingTableProps> = ({
  bookingsList,
  title,
  emptyMessage,
  accentColorClass = 'bg-emerald-400',
  getRoom,
  getCustomer,
  formatDate,
  fmt,
  statusBadge,
  paymentBadge,
  onView,
  onDelete,
}) => {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className={`w-2 h-6 rounded-full ${accentColorClass}`} />
        <h3 className="text-lg font-bold text-slate-800">
          {title} ({bookingsList.length} รายการ)
        </h3>
      </div>
      {bookingsList.length === 0 ? (
        <div className="px-6 py-12 text-center text-slate-400 italic">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50 bg-slate-50/20">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ห้อง</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ผู้เข้าพัก</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">เช็คอิน</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">เช็คเอาท์</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">ราคารวม</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">สถานะการเข้าพัก</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">การชำระ</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookingsList.map((bk) => {
                const room = bk.room || getRoom(bk.roomId);
                const customer = bk.customer || getCustomer(bk.customerId);
                return (
                  <tr key={bk.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-700">{room?.roomNumber ?? bk.roomId}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{customer?.fullName ?? '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">{formatDate(bk.checkInDate)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">{formatDate(bk.checkOutDate)}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">฿{fmt(bk.totalAmount)}</td>
                    <td className="px-6 py-4 text-center">{statusBadge(bk.bookingStatus)}</td>
                    <td className="px-6 py-4 text-center">{paymentBadge(bk.paymentStatus)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onView(bk.id)}
                          className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <Eye size={16} /> รายละเอียด
                        </Button>
                        <button
                          onClick={() => onDelete(bk.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
