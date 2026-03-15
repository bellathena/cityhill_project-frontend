import React from 'react';
import { CreditCard, Printer, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface InvoiceContractInfo {
  id: number;
  roomId: number;
  customerId: number;
  monthlyRentRate: number;
  contractStatus: string;
  customer?: { fullName: string; phone: string };
  room?: { roomNumber: number };
}

interface InvoiceItem {
  id: number;
  monthlyContractId: number;
  invoiceDate: string;
  dueDate: string;
  grandTotal: number;
  paymentStatus: string;
  monthlyContract?: InvoiceContractInfo;
  payments?: { id: number; amountPaid: number; paymentMethod: string; paymentDate: string }[];
}

interface BillingInvoiceTableProps {
  loading: boolean;
  invoices: InvoiceItem[];
  title: string;
  emptyMessage: string;
  accentColorClass?: string;
  formatDate: (d: string) => string;
  fmt: (n: number) => string;
  statusBadge: (status: string) => React.ReactNode;
  onPay: (invoiceId: number) => void;
  onPrint: (invoice: InvoiceItem) => void;
  onDelete: (invoiceId: number) => void;
}

export const BillingInvoiceTable: React.FC<BillingInvoiceTableProps> = ({
  loading,
  invoices,
  title,
  emptyMessage,
  accentColorClass = 'bg-blue-400',
  formatDate,
  fmt,
  statusBadge,
  onPay,
  onPrint,
  onDelete,
}) => {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className={`w-2 h-6 rounded-full ${accentColorClass}`} />
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>

      {loading ? (
        <div className="px-6 py-12 text-center text-slate-400 italic">กำลังโหลด...</div>
      ) : invoices.length === 0 ? (
        <div className="px-6 py-12 text-center text-slate-400 italic">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50 bg-slate-50/20">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ห้อง</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ผู้เช่า</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">วันที่ออกบิล</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">วันครบกำหนด</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">ยอดรวม</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">สถานะ</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map((inv) => {
                const contract = inv.monthlyContract;
                return (
                  <tr key={inv.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-700">{contract?.room?.roomNumber ?? '-'}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{contract?.customer?.fullName ?? '-'}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{contract?.customer?.phone ?? '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">{formatDate(inv.dueDate)}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">฿{fmt(Number(inv.grandTotal))}</td>
                    <td className="px-6 py-4 text-center">{statusBadge(inv.paymentStatus)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-1">
                        {inv.paymentStatus !== 'PAID' && (
                          <button
                            onClick={() => onPay(inv.id)}
                            className="p-2 hover:bg-green-100 rounded-lg text-green-600"
                            title="ชำระเงิน"
                          >
                            <CreditCard size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => onPrint(inv)}
                          className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                          title="พิมพ์"
                        >
                          <Printer size={16} />
                        </button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(inv.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} /> ลบ
                        </Button>
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
