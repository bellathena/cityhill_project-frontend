import React, { useState, useEffect } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "../../component/ui/button";
import { Input } from "../../component/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../component/dialog";
import { useToast } from "../../context/ToastContext";
import api from "../../lib/axios";
import { useNavigate } from "react-router-dom";

interface Customer {
  id: number;
  fullName: string;
  phone: string;
  citizenId: string;
  address: string;
  carLicense: string;
}

interface Room {
  roomNumber: number;
  floor: number;
  typeId: number;
  allowedType: string;
  currentStatus: string;
  roomType?: { typeName: string; baseMonthlyRate: number };
}

interface MonthlyContract {
  id: number;
  customerId: number;
  roomId: number;
  startDate: string;
  endDate: string | null;
  depositAmount: number;
  advancePayment: number;
  monthlyRentRate: number;
  contractStatus: string;
}

export const ContractManagement: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  // Data states
  const [monthlyContracts, setMonthlyContracts] = useState<MonthlyContract[]>(
    [],
  );
  const [rooms, setRooms] = useState<Room[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    roomId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    depositAmount: '',
    advancePayment: '',
    monthlyRentRate: '',
  });

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [contractsRes, roomsRes, customersRes] =
        await Promise.all([
          api.get("/monthly-contracts"),
          api.get("/rooms"),
          api.get("/customers"),
        ]);

      setMonthlyContracts(contractsRes.data);
      setRooms(roomsRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      addToast("ไม่สามารถโหลดข้อมูลได้", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const activeContracts = monthlyContracts.filter(
    (c) => c.contractStatus === "ACTIVE",
  );
   const closedContracts = monthlyContracts.filter(
    (c) => c.contractStatus === "CLOSED",
  );


  const getRoom = (roomId: number) => {
    return rooms.find((r) => r.roomNumber === roomId);
  };

  const getCustomer = (customerId: number) => {
    return customers.find((c) => c.id === customerId);
  };

  // Available rooms for monthly contracts (MONTHLY or FLEXIBLE, and AVAILABLE)
  const availableRooms = rooms.filter(
    (r) => (r.allowedType === 'MONTHLY' || r.allowedType === 'FLEXIBLE') && r.currentStatus === 'AVAILABLE'
  );

  const handleRoomChange = (roomNumber: string) => {
    const room = rooms.find((r) => r.roomNumber === Number(roomNumber));
    setForm((f) => ({
      ...f,
      roomId: roomNumber,
      monthlyRentRate: room?.roomType?.baseMonthlyRate ? String(room.roomType.baseMonthlyRate) : f.monthlyRentRate,
    }));
  };

  const handleCreateContract = async () => {
    if (!form.customerId || !form.roomId || !form.startDate || !form.monthlyRentRate) {
      addToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบ', 'warning');
      return;
    }
    try {
      setCreating(true);
      await api.post('/monthly-contracts', {
        customerId: Number(form.customerId),
        roomId: Number(form.roomId),
        startDate: form.startDate,
        endDate: form.endDate || null,
        depositAmount: parseFloat(form.depositAmount) || 0,
        advancePayment: parseFloat(form.advancePayment) || 0,
        monthlyRentRate: parseFloat(form.monthlyRentRate) || 0,
      });
      addToast('สร้างสัญญาเช่าสำเร็จ', 'success');
      setIsCreateOpen(false);
      setForm({ customerId: '', roomId: '', startDate: new Date().toISOString().split('T')[0], endDate: '', depositAmount: '', advancePayment: '', monthlyRentRate: '' });
      fetchAllData();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'เกิดข้อผิดพลาดในการสร้างสัญญา', 'error');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="w-full space-y-8 p-4 md:p-8 animate-in fade-in duration-500 bg-slate-50/50">
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            จัดการสัญญาเช่า
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            ตรวจสอบและอนุมัติสัญญาเช่าหอพัก City Hill
          </p>
        </div>

        {/* สรุปยอดเล็กๆ (Status Mini Cards) */}
        <div className="flex gap-4 items-center">
          <div className="bg-white p-3 px-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              ใช้งานอยู่
            </p>
            <p className="text-2xl font-black text-emerald-500">
              {activeContracts.length}
            </p>
          </div>
          <Button
            onClick={() => {
              setForm({ customerId: '', roomId: '', startDate: new Date().toISOString().split('T')[0], endDate: '', depositAmount: '', advancePayment: '', monthlyRentRate: '' });
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={18} /> สร้างสัญญาใหม่
          </Button>
        </div>
      </div>

      {/* Active Contracts */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-2 h-6 bg-emerald-400 rounded-full" />
          <h2 className="text-lg font-bold text-slate-800">
            สัญญาปัจจุบัน (Active)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50 bg-slate-50/20">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ห้อง
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ลูกค้า / เบอร์โทร
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  วันสิ้นสุดสัญญา
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ยอดชำระ/เดือน
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">{activeContracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    ไม่มีสัญญาที่รอดำเนินการในขณะนี้
                  </td>
                </tr>
              ) :
              activeContracts.map((contract) => {
                const room = getRoom(contract.roomId);
                const customer = getCustomer(contract.customerId);
                return (
                  <tr
                    key={contract.id}
                    className="hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-black text-slate-700">
                      {room?.roomNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {customer?.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {customer?.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">
                      {formatDate(contract.endDate)}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      ฿{contract.monthlyRentRate?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                          className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <FileText size={16} /> รายละเอียด
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Closed Contracts */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-2 h-6 bg-red-400 rounded-full" />
          <h2 className="text-lg font-bold text-slate-800">
            สัญญาที่หมดไปแล้ว (Closed)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50 bg-slate-50/20">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ห้อง
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ลูกค้า / เบอร์โทร
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  วันสิ้นสุดสัญญา
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ยอดชำระ/เดือน
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {closedContracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    ไม่มีสัญญาที่หมดไปแล้วในขณะนี้
                  </td>
                </tr>
              ) :
              closedContracts.map((contract) => {
                const room = getRoom(contract.roomId);
                const customer = getCustomer(contract.customerId);
                return (
                  <tr
                    key={contract.id}
                    className="hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-black text-slate-700">
                      {room?.roomNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {customer?.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {customer?.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">
                      {formatDate(contract.endDate)}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      ฿{contract.monthlyRentRate?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                          className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <FileText size={16} /> รายละเอียด
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create Contract Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างสัญญาเช่าใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">ลูกค้า *</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เลือกลูกค้า</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName} ({c.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">ห้องพัก *</label>
              <select
                value={form.roomId}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เลือกห้องว่าง</option>
                {availableRooms.map((r) => (
                  <option key={r.roomNumber} value={r.roomNumber}>
                    ห้อง {r.roomNumber} - {r.roomType?.typeName ?? `ชั้น ${r.floor}`} ({r.roomType?.baseMonthlyRate?.toLocaleString() ?? '?'} บาท/เดือน)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">วันเริ่มสัญญา *</label>
                <Input type="date" value={form.startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, startDate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">วันสิ้นสุดสัญญา</label>
                <Input type="date" value={form.endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, endDate: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">ค่าเช่ารายเดือน (บาท) *</label>
              <Input type="number" min="0" value={form.monthlyRentRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, monthlyRentRate: e.target.value })} placeholder="0" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">เงินมัดจำ (บาท)</label>
                <Input type="number" min="0" value={form.depositAmount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, depositAmount: e.target.value })} placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">ค่าเช่าล่วงหน้า (บาท)</label>
                <Input type="number" min="0" value={form.advancePayment} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, advancePayment: e.target.value })} placeholder="0" className="mt-1" />
              </div>
            </div>
            <Button onClick={handleCreateContract} disabled={creating} className="w-full">
              {creating ? 'กำลังบันทึก...' : 'สร้างสัญญา'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};
