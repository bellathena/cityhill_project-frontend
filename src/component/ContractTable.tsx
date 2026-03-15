import React from "react";
import { FileText } from "lucide-react";
import { Button } from "./ui/button";

interface ContractTableRoom {
  roomNumber: number;
}

interface ContractTableCustomer {
  fullName: string;
  phone: string;
}

interface ContractTableItem {
  id: number;
  customerId: number;
  roomId: number;
  endDate: string | null;
  monthlyRentRate: number;
}

interface ContractTableProps {
  contracts: ContractTableItem[];
  title: string;
  emptyMessage: string;
  accentColorClass: string;
  getRoom: (roomId: number) => ContractTableRoom | undefined;
  getCustomer: (customerId: number) => ContractTableCustomer | undefined;
  formatDate: (dateString?: string | null) => string;
  onViewDetail: (contractId: number) => void;
}

export const ContractTable: React.FC<ContractTableProps> = ({
  contracts,
  title,
  emptyMessage,
  accentColorClass,
  getRoom,
  getCustomer,
  formatDate,
  onViewDetail,
}) => {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className={`w-2 h-6 rounded-full ${accentColorClass}`} />
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-slate-50 bg-slate-50/20">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ห้อง</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ลูกค้า / เบอร์โทร</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">วันสิ้นสุดสัญญา</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ยอดชำระ/เดือน</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              contracts.map((contract) => {
                const room = getRoom(contract.roomId);
                const customer = getCustomer(contract.customerId);
                return (
                  <tr key={contract.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-700">{room?.roomNumber}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{customer?.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{customer?.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">{formatDate(contract.endDate)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">฿{contract.monthlyRentRate?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewDetail(contract.id)}
                          className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <FileText size={16} /> รายละเอียด
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
    </section>
  );
};
