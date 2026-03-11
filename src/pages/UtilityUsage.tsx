import React, { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Input } from '../component/ui/input';
import { Select } from '../component/ui/select';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

const LOCAL_STORAGE_KEY = 'custom_utility_rates';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

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

interface RoomInfo {
  id: number;
  roomNumber: string;
}

interface CustomerInfo {
  id: number;
  fullName: string;
}

interface RowData {
  electric: string;
  water: string;
  customChecked: Record<string, boolean>;
  customUnits: Record<string, string>;
}

export const UtilityUsage: React.FC = () => {
  const { addToast } = useToast();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear() + 543);

  const [electricityRate, setElectricityRate] = useState(0);
  const [waterRate, setWaterRate] = useState(0);
  const [customUtilities, setCustomUtilities] = useState<CustomUtility[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [rowData, setRowData] = useState<Record<number, RowData>>({});

  const flatUtilities = customUtilities.filter((u) => u.unit.includes('เดือน'));
  const unitUtilities = customUtilities.filter((u) => !u.unit.includes('เดือน'));

  const getRoom = (roomId: number) => rooms.find((r) => r.id === roomId);
  const getCustomer = (customerId: number) => customers.find((c) => c.id === customerId);

  const loadCustomUtilities = useCallback(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) setCustomUtilities(JSON.parse(stored));
    } catch {
      setCustomUtilities([]);
    }
  }, []);

  useEffect(() => {
    loadCustomUtilities();
  }, [loadCustomUtilities]);

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

        if (ratesRes.data && ratesRes.data.length > 0) {
          setElectricityRate(parseFloat(ratesRes.data[0].electricityRate) || 0);
          setWaterRate(parseFloat(ratesRes.data[0].waterRate) || 0);
        }

        setRooms(roomsRes.data || []);
        setCustomers(customersRes.data || []);

        const active: ContractRow[] = (contractsRes.data || []).filter(
          (c: ContractRow) => c.contractStatus === 'ACTIVE' || c.contractStatus === 'NOTICE'
        );
        setContracts(active);

        const savedUsage = (() => {
          try {
            const s = localStorage.getItem(`utility_usage_${selectedMonth}_${selectedYear}`);
            return s ? JSON.parse(s) : {};
          } catch { return {}; }
        })();
        const initial: Record<number, RowData> = {};
        active.forEach((c) => {
          initial[c.id] = savedUsage[c.id] ?? { electric: '', water: '', customChecked: {}, customUnits: {} };
        });
        setRowData(initial);
      } catch (error) {
        console.error(error);
        addToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [addToast]);

  // Reload saved row data when month/year changes (but contracts already loaded)
  useEffect(() => {
    if (contracts.length === 0) return;
    try {
      const s = localStorage.getItem(`utility_usage_${selectedMonth}_${selectedYear}`);
      const saved = s ? JSON.parse(s) : {};
      const merged: Record<number, RowData> = {};
      contracts.forEach((c) => {
        merged[c.id] = saved[c.id] ?? { electric: '', water: '', customChecked: {}, customUnits: {} };
      });
      setRowData(merged);
    } catch { /* keep current */ }
  }, [selectedMonth, selectedYear, contracts]);

  const updateRow = (contractId: number, field: 'electric' | 'water', value: string) => {
    setRowData((prev) => ({
      ...prev,
      [contractId]: { ...prev[contractId], [field]: value },
    }));
  };

  const updateCustomUnit = (contractId: number, utilId: string, value: string) => {
    setRowData((prev) => ({
      ...prev,
      [contractId]: {
        ...prev[contractId],
        customUnits: { ...prev[contractId]?.customUnits, [utilId]: value },
      },
    }));
  };

  const toggleCheck = (contractId: number, utilId: string) => {
    setRowData((prev) => {
      const row = prev[contractId];
      return {
        ...prev,
        [contractId]: {
          ...row,
          customChecked: {
            ...row.customChecked,
            [utilId]: !row.customChecked?.[utilId],
          },
        },
      };
    });
  };

  const calcTotal = (contractId: number, rent: number): string => {
    const row = rowData[contractId];
    if (!row) return '-';
    const elec = parseFloat(row.electric) || 0;
    const water = parseFloat(row.water) || 0;
    const hasFlat = flatUtilities.some((u) => row.customChecked?.[u.id]);
    const hasUnit = unitUtilities.some((u) => parseFloat(row.customUnits?.[u.id] || '0') > 0);
    if (elec === 0 && water === 0 && !hasFlat && !hasUnit) return '-';
    let total = rent;
    total += elec * electricityRate;
    total += water * waterRate;
    flatUtilities.forEach((u) => {
      if (row.customChecked?.[u.id]) total += u.rate;
    });
    unitUtilities.forEach((u) => {
      total += (parseFloat(row.customUnits?.[u.id] || '0') || 0) * u.rate;
    });
    return total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSave = () => {
    localStorage.setItem(`utility_usage_${selectedMonth}_${selectedYear}`, JSON.stringify(rowData));
    addToast('บันทึกข้อมูลสำเร็จ', 'success');
  };

  const buddhistYears = Array.from({ length: 5 }, (_, i) => now.getFullYear() + 543 - 2 + i);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">จัดการการใช้สาธารณูปโภค</h1>

      {/* Month/Year selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">เดือน</label>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {THAI_MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </Select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">ปี</label>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {buddhistYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>
          <Button onClick={handleSave} className="flex items-center gap-2 whitespace-nowrap">
            <Save size={16} />
            บันทึกข้อมูล
          </Button>
        </div>
      </div>

      {/* Current rates summary */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-700 mb-2">อัตราค่าสาธารณูปโภคปัจจุบัน</p>
        <div className="flex flex-wrap gap-6 text-sm text-blue-800">
          <span>ค่าไฟ: <strong>{electricityRate} บาท/unit</strong></span>
          <span>ค่าน้ำ: <strong>{waterRate} บาท/unit</strong></span>
          {customUtilities.map((u) => (
            <span key={u.id}>
              {u.name}: <strong>{u.rate} บาท/{u.unit}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="p-4 border-b">
          <h2 className="font-medium">
            บันทึกการใช้สาธารณูปโภค เดือน {THAI_MONTHS[selectedMonth]} {selectedYear}
          </h2>
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-gray-400">กำลังโหลดข้อมูล...</div>
        ) : contracts.length === 0 ? (
          <div className="py-12 text-center text-gray-400">ไม่พบข้อมูลสัญญาเช่าที่ใช้งานอยู่</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">เลขห้อง</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">ชื่อผู้เช่า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">ไฟ (unit)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">น้ำ (unit)</th>
                {flatUtilities.map((u) => (
                  <th key={u.id} className="text-left px-4 py-3 font-medium text-gray-700">
                    {u.name}
                  </th>
                ))}
                {unitUtilities.map((u) => (
                  <th key={u.id} className="text-left px-4 py-3 font-medium text-gray-700">
                    {u.name} (unit)
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-medium text-gray-700">ค่าเช่า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">ประมาณการรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contracts.map((contract) => {
                const row = rowData[contract.id] ?? { electric: '', water: '', customChecked: {} };
                const rent = contract.monthlyRentRate;
                return (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {getRoom(contract.roomId)?.roomNumber ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      {getCustomer(contract.customerId)?.fullName ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.electric}
                        onChange={(e) => updateRow(contract.id, 'electric', e.target.value)}
                        className="w-24"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.water}
                        onChange={(e) => updateRow(contract.id, 'water', e.target.value)}
                        className="w-24"
                      />
                    </td>
                    {flatUtilities.map((u) => (
                      <td key={u.id} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!row.customChecked?.[u.id]}
                          onChange={() => toggleCheck(contract.id, u.id)}
                          className="w-4 h-4 accent-blue-600"
                        />
                      </td>
                    ))}
                    {unitUtilities.map((u) => (
                      <td key={u.id} className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={row.customUnits?.[u.id] ?? ''}
                          onChange={(e) => updateCustomUnit(contract.id, u.id, e.target.value)}
                          className="w-24"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      {rent.toLocaleString('th-TH')}
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-700">
                      {calcTotal(contract.id, rent)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UtilityUsage;
