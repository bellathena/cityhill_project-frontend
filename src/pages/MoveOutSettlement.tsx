import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Input } from '../component/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../component/dialog';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

interface Settlement {
  id: number;
  contractId: number;
  moveOutDate: string;
  totalDeposit: number;
  damageDeduction: number;
  cleaningFee: number;
  outstandingBalance: number;
  netRefund: number;
  refundStatus: string;
  contract?: {
    id: number;
    roomId: number;
    monthlyRentRate: number;
    customer?: { fullName: string; phone: string };
    room?: { roomNumber: number };
  };
}

interface ActiveContract {
  id: number;
  roomId: number;
  customerId: number;
  depositAmount: number;
  monthlyRentRate: number;
  contractStatus: string;
  customer?: { fullName: string };
  room?: { roomNumber: number };
}

export const MoveOutSettlement: React.FC = () => {
  const { addToast } = useToast();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [contracts, setContracts] = useState<ActiveContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [contractSearch, setContractSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingDeposit, setLoadingDeposit] = useState(false);
  const [form, setForm] = useState({
    contractId: '',
    moveOutDate: new Date().toISOString().split('T')[0],
    totalDeposit: '',
    damageDeduction: '0',
    cleaningFee: '0',
    outstandingBalance: '0',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settRes, contRes] = await Promise.all([
        api.get('/move-out-settlements'),
        api.get('/monthly-contracts'),
      ]);
      setSettlements(settRes.data);
      const existingContractIds = new Set(settRes.data.map((s: Settlement) => s.contractId));
      const available = (contRes.data || []).filter(
        (c: ActiveContract) =>
          (c.contractStatus === 'ACTIVE' || c.contractStatus === 'NOTICE') &&
          !existingContractIds.has(c.id)
      );
      setContracts(available);
    } catch {
      addToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter((c) => {
    const q = contractSearch.toLowerCase();
    return String(c.room?.roomNumber).includes(q) || (c.customer?.fullName || '').toLowerCase().includes(q);
  });

  const handleContractChange = async (contractId: string, label: string) => {
    setShowDropdown(false);
    setContractSearch(label);
    setForm((f) => ({ ...f, contractId, totalDeposit: '' }));
    if (!contractId) return;

    // ใช้ข้อมูลจาก list ที่โหลดมาแล้วก่อน
    const cached = contracts.find((c) => c.id === Number(contractId));
    if (cached?.depositAmount !== undefined && Number(cached.depositAmount) > 0) {
      setForm((f) => ({ ...f, contractId, totalDeposit: String(Number(cached.depositAmount)) }));
      return;
    }

    // fallback: call API เดี่ยว
    try {
      setLoadingDeposit(true);
      const res = await api.get(`/monthly-contracts/${contractId}`);
      const deposit = Number(res.data?.depositAmount) || 0;
      setForm((f) => ({ ...f, contractId, totalDeposit: String(deposit) }));
    } catch {
      addToast('ไม่สามารถดึงข้อมูลมัดจำได้', 'error');
    } finally {
      setLoadingDeposit(false);
    }
  };

  const calcNetRefund = () => {
    const deposit = parseFloat(form.totalDeposit) || 0;
    const damage = parseFloat(form.damageDeduction) || 0;
    const cleaning = parseFloat(form.cleaningFee) || 0;
    const outstanding = parseFloat(form.outstandingBalance) || 0;
    return deposit - damage - cleaning - outstanding;
  };

  const handleCreate = async () => {
    try {
      if (!form.contractId) {
        addToast('กรุณาเลือกสัญญา', 'warning');
        return;
      }
      await api.post('/move-out-settlements', {
        contractId: Number(form.contractId),
        moveOutDate: form.moveOutDate,
        totalDeposit: parseFloat(form.totalDeposit) || 0,
        damageDeduction: parseFloat(form.damageDeduction) || 0,
        cleaningFee: parseFloat(form.cleaningFee) || 0,
        outstandingBalance: parseFloat(form.outstandingBalance) || 0,
        netRefund: calcNetRefund(),
      });
      addToast('สร้างรายการย้ายออกสำเร็จ', 'success');
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleRefund = async (id: number) => {
    try {
      await api.put(`/move-out-settlements/${id}`, { refundStatus: 'REFUNDED' });
      addToast('อัปเดตสถานะคืนเงินสำเร็จ', 'success');
      fetchData();
    } catch {
      addToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

  if (loading) return <div className="p-6 text-center text-gray-500">กำลังโหลด...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">จัดการการย้ายออก</h1>
        <Button
          onClick={() => {
            setForm({ contractId: '', moveOutDate: new Date().toISOString().split('T')[0], totalDeposit: '', damageDeduction: '0', cleaningFee: '0', outstandingBalance: '0' });
            setContractSearch('');
            setShowDropdown(false);
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2"
          disabled={contracts.length === 0}
        >
          <Plus size={20} /> สร้างรายการย้ายออก
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ห้อง</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ลูกค้า</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">วันย้ายออก</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">เงินมัดจำ</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">หักค่าเสียหาย</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">คืนสุทธิ</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">สถานะ</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {settlements.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">ไม่มีรายการ</td></tr>
            ) : settlements.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{s.contract?.room?.roomNumber}</td>
                <td className="px-6 py-4">{s.contract?.customer?.fullName}</td>
                <td className="px-6 py-4 text-sm">{formatDate(s.moveOutDate)}</td>
                <td className="px-6 py-4 text-sm">{fmt(s.totalDeposit)}</td>
                <td className="px-6 py-4 text-sm text-red-600">{fmt((s.damageDeduction || 0) + (s.cleaningFee || 0) + (s.outstandingBalance || 0))}</td>
                <td className="px-6 py-4 font-bold text-green-600">{fmt(s.netRefund)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.refundStatus === 'REFUNDED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {s.refundStatus === 'REFUNDED' ? 'คืนแล้ว' : 'รอคืน'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {s.refundStatus === 'PENDING' && (
                    <Button size="sm" onClick={() => handleRefund(s.id)} className="text-xs">คืนเงินแล้ว</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>สร้างรายการย้ายออก</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">สัญญาเช่า *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาห้อง หรือชื่อลูกค้า..."
                  value={contractSearch}
                  onChange={(e) => { setContractSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {showDropdown && filteredContracts.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredContracts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleContractChange(String(c.id), `ห้อง ${c.room?.roomNumber} - ${c.customer?.fullName}`)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b last:border-0"
                      >
                        <span className="font-medium">ห้อง {c.room?.roomNumber}</span>
                        <span className="text-gray-500 ml-2">{c.customer?.fullName}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && contractSearch && filteredContracts.length === 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-400">
                    ไม่พบสัญญาที่ตรงกัน
                  </div>
                )}
              </div>
              {form.contractId && (
                <p className="mt-1 text-xs text-blue-600">เลือกแล้ว: {contractSearch}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">วันย้ายออก *</label>
              <Input type="date" value={form.moveOutDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, moveOutDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">เงินมัดจำ {loadingDeposit && <span className="text-xs text-gray-400 font-normal">(กำลังโหลด...)</span>}</label>
              <Input type="number" value={form.totalDeposit} placeholder={loadingDeposit ? 'กำลังดึงข้อมูล...' : '0'} disabled={loadingDeposit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, totalDeposit: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">หักค่าเสียหาย</label>
                <Input type="number" value={form.damageDeduction} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, damageDeduction: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">ค่าทำความสะอาด</label>
                <Input type="number" value={form.cleaningFee} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, cleaningFee: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">ยอดค้างชำระ</label>
              <Input type="number" value={form.outstandingBalance} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, outstandingBalance: e.target.value })} />
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-green-700">ยอดคืนสุทธิ</span>
                <span className="text-lg font-bold text-green-700">{fmt(calcNetRefund())} บาท</span>
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full">บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
