import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Printer, Trash2, CreditCard, Printer as PrintAll } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Select } from '../component/ui/select';
import { ConfirmDialog } from '../component/dialog';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';
import { printInvoice, printAllInvoices, type Invoice as PrintInvoice, THAI_MONTHS } from '../lib/printInvoice';

interface UtilityType { id: number; uType: string; ratePerUnit: number; }
interface UsageRecord { id: number; roomId: number; recordDate: string; utilityUnit: number; uTypeId: number; }
interface Contract {
  id: number; roomId: number; customerId: number; monthlyRentRate: number; contractStatus: string;
  customer?: { fullName: string; phone: string };
  room?: { roomNumber: number };
}
interface ApiInvoice {
  id: number; monthlyContractId: number; invoiceDate: string; dueDate: string; grandTotal: number; paymentStatus: string;
  monthlyContract?: Contract;
  payments?: { id: number; amountPaid: number; paymentMethod: string; paymentDate: string }[];
}

const Billing: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [utilities, setUtilities] = useState<UtilityType[]>([]);
  const [usages, setUsages] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [invRes, contRes, utilRes, usageRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/monthly-contracts'),
        api.get('/utilities'),
        api.get('/utility-usages'),
      ]);
      setInvoices(invRes.data || []);
      setContracts(contRes.data || []);
      setUtilities(utilRes.data || []);
      setUsages(usageRes.data || []);
    } catch {
      addToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices for selected month
  const monthInvoices = invoices.filter((inv) => {
    const d = new Date(inv.invoiceDate);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const pendingCount = monthInvoices.filter((i) => i.paymentStatus === 'PENDING').length;
  const paidCount = monthInvoices.filter((i) => i.paymentStatus === 'PAID').length;
  const totalAmount = monthInvoices.reduce((s, i) => s + Number(i.grandTotal), 0);

  // Parse year/month directly from date string to avoid UTC timezone shift
  const parseYM = (dateStr: string) => {
    const parts = dateStr.split('-');
    return { y: Number(parts[0]), m: Number(parts[1]) - 1 }; // m is 0-indexed
  };

  // Calculate grand total for a contract from rent + utility usages
  const calcGrandTotal = (contract: Contract): number => {
    let total = contract.monthlyRentRate;
    const roomUsages = usages.filter((u) => {
      const { y, m } = parseYM(u.recordDate);
      return u.roomId === contract.roomId && y === selectedYear && m === selectedMonth;
    });
    roomUsages.forEach((u) => {
      const ut = utilities.find((t) => t.id === u.uTypeId);
      if (ut) total += u.utilityUnit * Number(ut.ratePerUnit);
    });
    return total;
  };

  // Build breakdown for printing
  const buildPrintInvoice = (inv: ApiInvoice): PrintInvoice => {
    const contract = inv.monthlyContract;
    const roomNumber = contract?.room?.roomNumber ?? 0;
    const customerName = contract?.customer?.fullName ?? '-';
    const rent = contract?.monthlyRentRate ?? 0;
    const invDate = new Date(inv.invoiceDate);

    // Get utility breakdown (parse string directly to avoid UTC timezone shift)
    const invYear = invDate.getFullYear();
    const invMonth = invDate.getMonth();
    const roomUsages = usages.filter((u) => {
      const parts = u.recordDate.split('-');
      const uYear = Number(parts[0]), uMonth = Number(parts[1]) - 1;
      return u.roomId === (contract?.roomId ?? -1) && uYear === invYear && uMonth === invMonth;
    });

    // Find electricity and water specifically, rest as otherItems
    let electricityUnits = 0, electricityAmount = 0;
    let waterUnits = 0, waterAmount = 0;
    const otherItems: { name: string; amount: number }[] = [];

    roomUsages.forEach((u) => {
      const ut = utilities.find((t) => t.id === u.uTypeId);
      if (!ut) return;
      const amount = u.utilityUnit * ut.ratePerUnit;
      const lowerType = ut.uType.toLowerCase();
      if (lowerType.includes('ไฟ') || lowerType.includes('electric')) {
        electricityUnits += u.utilityUnit;
        electricityAmount += amount;
      } else if (lowerType.includes('น้ำ') || lowerType.includes('water')) {
        waterUnits += u.utilityUnit;
        waterAmount += amount;
      } else {
        otherItems.push({ name: `${ut.uType} (${u.utilityUnit} หน่วย)`, amount });
      }
    });

    return {
      id: String(inv.id),
      contractId: inv.monthlyContractId,
      roomNumber: String(roomNumber),
      customerName,
      month: invDate.getMonth(),
      year: invDate.getFullYear() + 543,
      rent,
      electricityUnits,
      electricityAmount,
      waterUnits,
      waterAmount,
      otherAmount: otherItems.reduce((s, i) => s + i.amount, 0),
      otherItems: otherItems.length > 0 ? otherItems : undefined,
      total: Number(inv.grandTotal),
      status: inv.paymentStatus as 'PENDING' | 'PAID',
      createdAt: inv.invoiceDate,
    };
  };

  const handleCreateAll = async () => {
    try {
      const activeContracts = contracts.filter((c) => c.contractStatus === 'ACTIVE' || c.contractStatus === 'NOTICE');
      const existingContractIds = new Set(monthInvoices.map((i) => i.monthlyContractId));

      const toCreate = activeContracts.filter((c) => !existingContractIds.has(c.id));
      if (toCreate.length === 0) {
        addToast('ทุกสัญญามีใบแจ้งหนี้สำหรับเดือนนี้แล้ว', 'warning');
        return;
      }

      const mm = String(selectedMonth + 1).padStart(2, '0');
      const invoiceDate = `${selectedYear}-${mm}-01`;
      const dueMm = String(selectedMonth + 2 > 12 ? 1 : selectedMonth + 2).padStart(2, '0');
      const dueYear = selectedMonth + 2 > 12 ? selectedYear + 1 : selectedYear;
      const dueDate = `${dueYear}-${dueMm}-05`;

      await Promise.all(
        toCreate.map((c) =>
          api.post('/invoices', {
            monthlyContractId: c.id,
            invoiceDate,
            dueDate,
            grandTotal: calcGrandTotal(c),
          })
        )
      );

      addToast(`สร้างใบแจ้งหนี้ ${toCreate.length} รายการสำเร็จ`, 'success');
      fetchAll();
    } catch {
      addToast('เกิดข้อผิดพลาดในการสร้างใบแจ้งหนี้', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await api.delete(`/invoices/${confirmDelete.id}`);
      addToast('ลบใบแจ้งหนี้สำเร็จ', 'success');
      fetchAll();
    } catch {
      addToast('ไม่สามารถลบได้', 'error');
    } finally {
      setConfirmDelete({ open: false, id: null });
    }
  };

  const handlePrintOne = (inv: ApiInvoice) => printInvoice(buildPrintInvoice(inv));
  const handlePrintAll = () => printAllInvoices(monthInvoices.map(buildPrintInvoice));

  const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const buddhistYears = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700',
      PAID: 'bg-green-100 text-green-700',
      OVERDUE: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = { PENDING: 'รอชำระ', PAID: 'ชำระแล้ว', OVERDUE: 'เกินกำหนด' };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${map[s] || 'bg-gray-100 text-gray-700'}`}>{labels[s] || s}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">จัดการใบแจ้งหนี้</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCreateAll} className="flex items-center gap-2">
            <Plus size={16} /> สร้างใบแจ้งหนี้ 
          </Button>
          {monthInvoices.length > 0 && (
            <Button variant="secondary" onClick={handlePrintAll} className="flex items-center gap-2">
              <PrintAll size={16} /> พิมพ์ทั้งหมด
            </Button>
          )}
        </div>
      </div>

      {/* Month/Year Selector */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-end gap-4">
        <div className="min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">เดือน</label>
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
            {THAI_MONTHS.map((m, i) => (<option key={i} value={i}>{m}</option>))}
          </Select>
        </div>
        <div className="min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">ปี (ค.ศ.)</label>
          <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {buddhistYears.map((y) => (<option key={y} value={y}>{y + 543} ({y})</option>))}
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><p className="text-xs text-gray-500">ทั้งหมด</p><p className="text-2xl font-bold">{monthInvoices.length}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-xs text-gray-500">รอชำระ</p><p className="text-2xl font-bold text-amber-600">{pendingCount}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-xs text-gray-500">ชำระแล้ว</p><p className="text-2xl font-bold text-green-600">{paidCount}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-xs text-gray-500">ยอดรวม</p><p className="text-2xl font-bold text-blue-700">{fmt(totalAmount)}</p></div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-gray-400">กำลังโหลด...</div>
        ) : monthInvoices.length === 0 ? (
          <div className="py-12 text-center text-gray-400">ไม่มีใบแจ้งหนี้สำหรับเดือนนี้</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">ห้อง</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">ผู้เช่า</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">วันที่ออกบิล</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">วันครบกำหนด</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">ยอดรวม</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">สถานะ</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {monthInvoices.map((inv) => {
                const c = inv.monthlyContract;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{c?.room?.roomNumber ?? '-'}</td>
                    <td className="px-4 py-3">{c?.customer?.fullName ?? '-'}</td>
                    <td className="px-4 py-3">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-4 py-3">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(Number(inv.grandTotal))}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(inv.paymentStatus)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {inv.paymentStatus !== 'PAID' && (
                          <button onClick={() => navigate(`/billing/payment/${inv.id}`)} className="p-2 hover:bg-green-100 rounded-lg text-green-600" title="ชำระเงิน"><CreditCard size={16} /></button>
                        )}
                        <button onClick={() => handlePrintOne(inv)} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600" title="พิมพ์"><Printer size={16} /></button>
                        <button onClick={() => setConfirmDelete({ open: true, id: inv.id })} className="p-2 hover:bg-red-100 rounded-lg text-red-600" title="ลบ"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDelete.open}
        title="ยืนยันการลบ"
        description="คุณต้องการลบใบแจ้งหนี้นี้หรือไม่?"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </div>
  );
};

export default Billing;
