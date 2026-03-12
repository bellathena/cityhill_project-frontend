import React, { useState, useEffect } from 'react';
import { Save, Zap, Droplets } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Input } from '../component/ui/input';
import { Select } from '../component/ui/select';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

interface UtilityType {
  id: number;
  uType: string;
  ratePerUnit: number;
}

interface Contract {
  id: number;
  roomId: number;
  customerId: number;
  monthlyRentRate: number;
  contractStatus: string;
  customer?: { fullName: string };
  room?: { roomNumber: number };
}

interface UsageRecord {
  id: number;
  roomId: number;
  recordDate: string;
  utilityUnit: number;
  uTypeId: number;
}

interface CellData {
  value: string;
  existingId?: number;
}

interface RowData {
  [uTypeId: string]: CellData;
}

// Parse "2026-03-01" or "2026-03-01T..." → { year, month (0-based) }
const parseYearMonth = (dateStr: string) => {
  const parts = dateStr.substring(0, 10).split('-');
  return { year: Number(parts[0]), month: Number(parts[1]) - 1 };
};

const getUtilityIcon = (uType: string) => {
  const lower = uType.toLowerCase();
  if (lower.includes('ไฟ') || lower.includes('electric')) return <Zap size={16} className="text-yellow-500" />;
  if (lower.includes('น้ำ') || lower.includes('water')) return <Droplets size={16} className="text-blue-500" />;
  return <div className="w-4 h-4 rounded-full bg-gray-400" />;
};

const getUtilityColor = (uType: string) => {
  const lower = uType.toLowerCase();
  if (lower.includes('ไฟ') || lower.includes('electric')) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' };
  if (lower.includes('น้ำ') || lower.includes('water')) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' };
  return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' };
};

export const UtilityUsage: React.FC = () => {
  const { addToast } = useToast();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [utilityTypes, setUtilityTypes] = useState<UtilityType[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [usages, setUsages] = useState<UsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rowData, setRowData] = useState<Record<number, RowData>>({});

  useEffect(() => { fetchData(); }, []);

  useEffect(() => { buildRowData(); }, [selectedMonth, selectedYear, contracts, usages, utilityTypes]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [typesRes, contractsRes, usagesRes] = await Promise.all([
        api.get('/utilities'),
        api.get('/monthly-contracts'),
        api.get('/utility-usages'),
      ]);
      setUtilityTypes(typesRes.data || []);
      const active = (contractsRes.data || []).filter(
        (c: Contract) => c.contractStatus === 'ACTIVE' || c.contractStatus === 'NOTICE'
      );
      setContracts(active);
      setUsages(usagesRes.data || []);
    } catch {
      addToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const buildRowData = () => {
    const data: Record<number, RowData> = {};

    contracts.forEach((c) => {
      const row: RowData = {};
      utilityTypes.forEach((ut) => {
        const existing = usages.find((u) => {
          const ym = parseYearMonth(u.recordDate);
          return u.roomId === c.roomId && u.uTypeId === ut.id &&
            ym.year === selectedYear && ym.month === selectedMonth;
        });
        row[ut.id] = {
          value: existing ? String(existing.utilityUnit) : '',
          existingId: existing?.id,
        };
      });
      data[c.id] = row;
    });
    setRowData(data);
  };

  const updateCell = (contractId: number, uTypeId: number, value: string) => {
    setRowData((prev) => ({
      ...prev,
      [contractId]: {
        ...prev[contractId],
        [uTypeId]: { ...prev[contractId]?.[uTypeId], value },
      },
    }));
  };

  const getCellCost = (contractId: number, ut: UtilityType): number => {
    const val = parseFloat(rowData[contractId]?.[ut.id]?.value || '0') || 0;
    return val * Number(ut.ratePerUnit);
  };

  const getRoomTotal = (contractId: number, rent: number): number => {
    let total = rent;
    utilityTypes.forEach((ut) => { total += getCellCost(contractId, ut); });
    return total;
  };

  const handleSave = async () => {
    // Build recordDate without timezone issues
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const recordDate = `${selectedYear}-${mm}-01`;
    const promises: Promise<any>[] = [];

    contracts.forEach((c) => {
      const row = rowData[c.id];
      if (!row) return;
      utilityTypes.forEach((ut) => {
        const cell = row[ut.id];
        if (!cell) return;
        const val = parseFloat(cell.value) || 0;
        if (val > 0) {
          if (cell.existingId) {
            promises.push(api.put(`/utility-usages/${cell.existingId}`, { utilityUnit: val, month: selectedMonth + 1, year: selectedYear }));
          } else {
            promises.push(api.post('/utility-usages', {
              roomId: c.roomId,
              month: selectedMonth + 1,
              year: selectedYear,
              recordDate,
              utilityUnit: val,
              uTypeId: ut.id,
            }));
          }
        }
      });
    });

    if (promises.length === 0) {
      addToast('ไม่มีข้อมูลที่ต้องบันทึก', 'warning');
      return;
    }

    try {
      await Promise.all(promises);
      addToast('บันทึกข้อมูลสำเร็จ', 'success');
      const { data } = await api.get('/utility-usages');
      setUsages(data || []);
    } catch {
      addToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const buddhistYears = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Summary stats
  const filledCount = contracts.filter((c) => {
    const row = rowData[c.id];
    return row && utilityTypes.some((ut) => parseFloat(row[ut.id]?.value || '0') > 0);
  }).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">จัดการการใช้สาธารณูปโภค</h1>

      {/* Month/Year + Save */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">เดือน</label>
            <Select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {THAI_MONTHS.map((m, i) => (<option key={i} value={i}>{m}</option>))}
            </Select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">ปี (ค.ศ.)</label>
            <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {buddhistYears.map((y) => (<option key={y} value={y}>{y + 543} ({y})</option>))}
            </Select>
          </div>
          <Button onClick={handleSave} className="flex items-center gap-2 whitespace-nowrap">
            <Save size={16} /> บันทึกข้อมูล
          </Button>
        </div>
      </div>

      {/* Rate summary + status */}
      <div className="flex flex-wrap gap-4">
        {utilityTypes.map((ut) => {
          const colors = getUtilityColor(ut.uType);
          return (
            <div key={ut.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors.bg} ${colors.border}`}>
              {getUtilityIcon(ut.uType)}
              <div>
                <p className="text-xs font-medium text-gray-500">{ut.uType}</p>
                <p className={`text-lg font-bold ${colors.text}`}>{Number(ut.ratePerUnit)} <span className="text-xs font-normal">บาท/หน่วย</span></p>
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-emerald-50 border-emerald-200">
          <div>
            <p className="text-xs font-medium text-gray-500">บันทึกแล้ว</p>
            <p className="text-lg font-bold text-emerald-700">{filledCount} <span className="text-xs font-normal">/ {contracts.length} ห้อง</span></p>
          </div>
        </div>
      </div>

      {/* Room cards */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-700">
          บันทึกเดือน {THAI_MONTHS[selectedMonth]} {selectedYear + 543}
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-gray-400">กำลังโหลด...</div>
        ) : contracts.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-white rounded-xl shadow">ไม่พบสัญญาที่ใช้งาน</div>
        ) : (
          <div className="grid gap-4">
            {contracts.map((c) => {
              const hasData = utilityTypes.some((ut) => parseFloat(rowData[c.id]?.[ut.id]?.value || '0') > 0);
              const roomTotal = getRoomTotal(c.id, c.monthlyRentRate);

              return (
                <div key={c.id} className={`bg-white rounded-xl shadow border-l-4 ${hasData ? 'border-l-emerald-400' : 'border-l-gray-300'}`}>
                  {/* Room header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50/50 rounded-t-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <span className="text-lg font-black text-indigo-700">{c.room?.roomNumber ?? c.roomId}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{c.customer?.fullName ?? '-'}</p>
                        <p className="text-xs text-gray-400">ค่าเช่า {fmt(c.monthlyRentRate)} บาท/เดือน</p>
                      </div>
                    </div>
                    {hasData && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">ประมาณการรวม</p>
                        <p className="text-lg font-bold text-indigo-700">{fmt(roomTotal)} <span className="text-xs font-normal text-gray-500">บาท</span></p>
                      </div>
                    )}
                  </div>

                  {/* Utility inputs */}
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {utilityTypes.map((ut) => {
                        const colors = getUtilityColor(ut.uType);
                        const val = parseFloat(rowData[c.id]?.[ut.id]?.value || '0') || 0;
                        const cost = val * Number(ut.ratePerUnit);
                        const hasSaved = !!rowData[c.id]?.[ut.id]?.existingId;

                        return (
                          <div key={ut.id} className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}>
                            <div className="flex items-center gap-2 mb-2">
                              {getUtilityIcon(ut.uType)}
                              <span className="text-sm font-semibold text-gray-700">{ut.uType}</span>
                              {hasSaved && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">บันทึกแล้ว</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                placeholder="จำนวนหน่วย"
                                value={rowData[c.id]?.[ut.id]?.value ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCell(c.id, ut.id, e.target.value)}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 whitespace-nowrap">หน่วย</span>
                            </div>
                            {val > 0 && (
                              <p className={`text-xs mt-1.5 font-medium ${colors.text}`}>
                                {val} × {Number(ut.ratePerUnit)} = <strong>{fmt(cost)} บาท</strong>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UtilityUsage;
