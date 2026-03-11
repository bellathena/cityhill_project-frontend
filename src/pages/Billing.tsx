import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Clock, Trash2, CreditCard, Printer } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Select } from '../component/ui/select';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';
import { THAI_MONTHS, printInvoice, printAllInvoices } from '../lib/printInvoice';
import type { Invoice } from '../lib/printInvoice';

const RATES_KEY = 'custom_utility_rates';
const getUsageKey = (month: number, year: number) => `utility_usage_${month}_${year}`;
const getBillsKey = (month: number, year: number) => `billing_invoices_${month}_${year}`;

interface CustomUtility {
  id: string;
  name: string;
  rate: number;
  unit: string;
}

interface ContractRow {
  id: number;
  roomId: number;
  customerId: number;
  monthlyRentRate: number;
  contractStatus: string;
}

interface RoomInfo { id: number; roomNumber: string; }
interface CustomerInfo { id: number; fullName: string; }

interface UsageRowData {
  electric: string;
  water: string;
  customChecked: Record<string, boolean>;
  customUnits: Record<string, string>;
}


export const Billing: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear() + 543);

  const [electricityRate, setElectricityRate] = useState(0);
  const [waterRate, setWaterRate] = useState(0);
  const [customUtilities, setCustomUtilities] = useState<CustomUtility[]>([]);

  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [usageData, setUsageData] = useState<Record<number, UsageRowData>>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const flatUtilities = customUtilities.filter((u) => u.unit.includes('เดือน'));
  const unitUtilities = customUtilities.filter((u) => !u.unit.includes('เดือน'));

  const getRoom = (roomId: number) => rooms.find((r) => r.id === roomId);
  const getCustomer = (customerId: number) => customers.find((c) => c.id === customerId);

  const loadLocalData = useCallback((month: number, year: number) => {
    try {
      const stored = localStorage.getItem(RATES_KEY);
      if (stored) setCustomUtilities(JSON.parse(stored));
    } catch { setCustomUtilities([]); }

    try {
      const usage = localStorage.getItem(getUsageKey(month, year));
      if (usage) setUsageData(JSON.parse(usage));
      else setUsageData({});
    } catch { setUsageData({}); }

    try {
      const bills = localStorage.getItem(getBillsKey(month, year));
      if (bills) setInvoices(JSON.parse(bills));
      else setInvoices([]);
    } catch { setInvoices([]); }
  }, []);

  useEffect(() => {
    loadLocalData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, loadLocalData]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ratesRes, contractsRes, roomsRes, customersRes] = await Promise.all([
          api.get('/utility-rates'),
          api.get('/monthly-contracts'),
          api.get('/rooms'),
          api.get('/customers'),
        ]);
        if (ratesRes.data?.length > 0) {
          setElectricityRate(parseFloat(ratesRes.data[0].electricityRate) || 0);
          setWaterRate(parseFloat(ratesRes.data[0].waterRate) || 0);
        }
        setRooms(roomsRes.data || []);
        setCustomers(customersRes.data || []);
        const active: ContractRow[] = (contractsRes.data || []).filter(
          (c: ContractRow) => c.contractStatus === 'ACTIVE' || c.contractStatus === 'NOTICE'
        );
        setContracts(active);
      } catch {
        addToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [addToast]);

  const getUsage = (contractId: number): UsageRowData | null => {
    const u = usageData[contractId];
    if (!u) return null;
    const hasFlat = flatUtilities.some((fu) => u.customChecked?.[fu.id]);
    const hasUnit = unitUtilities.some((uu) => parseFloat(u.customUnits?.[uu.id] || '0') > 0);
    if (!u.electric && !u.water && !hasFlat && !hasUnit) return null;
    return u;
  };

  const calcAmounts = (contractId: number, rent: number) => {
    const u = getUsage(contractId);
    if (!u) return null;
    const elecUnits = parseFloat(u.electric) || 0;
    const waterUnits = parseFloat(u.water) || 0;
    const elecAmt = elecUnits * electricityRate;
    const waterAmt = waterUnits * waterRate;
    let other = 0;
    const otherItems: { name: string; amount: number }[] = [];
    flatUtilities.forEach((fu) => {
      if (u.customChecked?.[fu.id]) {
        other += fu.rate;
        otherItems.push({ name: fu.name, amount: fu.rate });
      }
    });
    unitUtilities.forEach((uu) => {
      const units = parseFloat(u.customUnits?.[uu.id] || '0') || 0;
      if (units > 0) {
        const amt = units * uu.rate;
        other += amt;
        otherItems.push({ name: `${uu.name} (${units} ${uu.unit})`, amount: amt });
      }
    });
    return {
      electricityUnits: elecUnits,
      electricityAmount: elecAmt,
      waterUnits,
      waterAmount: waterAmt,
      otherAmount: other,
      otherItems,
      total: rent + elecAmt + waterAmt + other,
    };
  };

  const createAllInvoices = () => {
    let count = 0;
    const newInvoices: Invoice[] = [...invoices];
    contracts.forEach((contract) => {
      const alreadyExists = newInvoices.some((inv) => inv.contractId === contract.id);
      if (alreadyExists) return;
      const amounts = calcAmounts(contract.id, contract.monthlyRentRate);
      if (!amounts) return;
      const room = getRoom(contract.roomId);
      const customer = getCustomer(contract.customerId);
      newInvoices.push({
        id: `INV-${Date.now()}-${contract.id}`,
        contractId: contract.id,
        roomNumber: room?.roomNumber ?? '-',
        customerName: customer?.fullName ?? '-',
        month: selectedMonth,
        year: selectedYear,
        rent: contract.monthlyRentRate,
        ...amounts,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });
      count++;
    });
    setInvoices(newInvoices);
    localStorage.setItem(getBillsKey(selectedMonth, selectedYear), JSON.stringify(newInvoices));
    addToast(count > 0 ? `สร้างใบแจ้งหนี้ทั้งหมด ${count} รายการ` : 'ไม่มีรายการที่พร้อมออกบิล', count > 0 ? 'success' : 'error');
  };

  const deleteInvoice = (id: string) => {
    const updated = invoices.filter((inv) => inv.id !== id);
    setInvoices(updated);
    localStorage.setItem(getBillsKey(selectedMonth, selectedYear), JSON.stringify(updated));
    addToast('ลบใบแจ้งหนี้แล้ว', 'success');
  };




  const buddhistYears = Array.from({ length: 5 }, (_, i) => now.getFullYear() + 543 - 2 + i);

  const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const pendingInvoices = invoices.filter((i) => i.status === 'PENDING');
  const paidInvoices = invoices.filter((i) => i.status === 'PAID');
  const totalPending = pendingInvoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = paidInvoices.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">ออกบิล / ใบแจ้งหนี้</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-36"
          >
            {THAI_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </Select>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-28"
          >
            {buddhistYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Button onClick={createAllInvoices} className="flex items-center gap-2">
            <FileText size={16} />
            สร้างใบแจ้งหนี้ทั้งหมด
          </Button>
          <Button
            onClick={() => printAllInvoices(invoices)}
            disabled={invoices.length === 0}
            className="flex items-center gap-2"
          >
            <Printer size={16} />
            พิมพ์ทั้งหมด
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">ใบแจ้งหนี้ทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-800">{invoices.length} ใบ</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock size={22} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">รอชำระ</p>
            <p className="text-2xl font-bold text-amber-600">{pendingInvoices.length} ใบ</p>
            <p className="text-xs text-gray-400">{fmt(totalPending)} บาท</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={22} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">ชำระแล้ว</p>
            <p className="text-2xl font-bold text-green-600">{paidInvoices.length} ใบ</p>
            <p className="text-xs text-gray-400">{fmt(totalPaid)} บาท</p>
          </div>
        </div>
      </div>

      {/* Invoice list */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">
            ใบแจ้งหนี้ เดือน{THAI_MONTHS[selectedMonth]} {selectedYear}
          </h2>
          <span className="text-sm text-gray-400">{invoices.length} รายการ</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-gray-400">กำลังโหลดข้อมูล...</div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileText size={40} className="mx-auto text-gray-300" />
            <p className="text-gray-400">ยังไม่มีใบแจ้งหนี้สำหรับเดือนนี้</p>
            <p className="text-sm text-gray-400">กดปุ่ม "สร้างใบแจ้งหนี้ทั้งหมด" เพื่อสร้างจากข้อมูลการใช้สาธารณูปโภค</p>
          </div>
        ) : (
          <div className="divide-y">
            {invoices.map((inv) => (
              <div key={inv.id} className="px-6 py-4 flex flex-wrap items-center gap-4 hover:bg-gray-50 transition-colors">
                {/* Room + customer */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
                    {inv.roomNumber}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{inv.customerName}</p>
                    <p className="text-xs text-gray-400">{THAI_MONTHS[inv.month]} {inv.year}</p>
                  </div>
                </div>

                {/* Amount breakdown */}
                <div className="flex flex-wrap gap-4 flex-1 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">ค่าเช่า</p>
                    <p className="font-medium">{fmt(inv.rent)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">ค่าไฟ</p>
                    <p className="font-medium">{fmt(inv.electricityAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">ค่าน้ำ</p>
                    <p className="font-medium">{fmt(inv.waterAmount)}</p>
                  </div>
                  {inv.otherItems && inv.otherItems.length > 0 &&
                    inv.otherItems.map((item, i) => (
                      <div key={i} className="text-center">
                        <p className="text-xs text-gray-400">{item.name}</p>
                        <p className="font-medium">{fmt(item.amount)}</p>
                      </div>
                    ))
                  }
                  <div className="text-center">
                    <p className="text-xs text-gray-400">รวม</p>
                    <p className="font-bold text-blue-600 text-base">{fmt(inv.total)}</p>
                  </div>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-3">
                  {inv.status === 'PAID' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <CheckCircle size={12} /> ชำระแล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      <Clock size={12} /> รอชำระ
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    {inv.status === 'PENDING' && (
                      <button
                        onClick={() => navigate(`/billing/payment/${inv.id}`)}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="ชำระเงิน"
                      >
                        <CreditCard size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => printInvoice(inv)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                      title="พิมพ์ใบแจ้งหนี้"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      onClick={() => deleteInvoice(inv.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                      title="ลบ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;
