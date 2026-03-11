import React, { useState, useEffect } from 'react';
import { Edit2, Save, Plus, Trash2, X } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Input } from '../component/ui/input';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

interface UtilityRate {
  id: number;
  electricityRate: string | number;
  waterRate: string | number;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomUtility {
  id: string;
  name: string;
  emoji: string;
  rate: number;
  unit: string;
  bgColor: string;
  textColor: string;
  iconBgColor: string;
}

const LOCAL_STORAGE_KEY = 'custom_utility_rates';

const COLOR_OPTIONS = [
  { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100', label: 'เขียว' },
  { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100', label: 'ม่วง' },
  { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100', label: 'แดง' },
  { bg: 'bg-orange-50', text: 'text-orange-700', iconBg: 'bg-orange-100', label: 'ส้ม' },
  { bg: 'bg-pink-50', text: 'text-pink-700', iconBg: 'bg-pink-100', label: 'ชมพู' },
  { bg: 'bg-teal-50', text: 'text-teal-700', iconBg: 'bg-teal-100', label: 'เขียวน้ำทะเล' },
];

interface UtilityCardProps {
  emoji: string;
  name: string;
  subtitle: string;
  rate: number;
  unit: string;
  bgColor: string;
  textColor: string;
  iconBgColor: string;
  isEditing: boolean;
  inputValue: string;
  onInputChange: (val: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const UtilityCard: React.FC<UtilityCardProps> = ({
  emoji, name, subtitle, rate, unit, bgColor, textColor, iconBgColor,
  isEditing, inputValue, onInputChange, onEdit, onSave, onCancel, onDelete,
}) => (
  <div className={`p-6 ${bgColor} rounded-lg`}>
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center`}>
          <span className="text-2xl">{emoji}</span>
        </div>
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>
      {!isEditing && (
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-white/60 text-gray-600 transition-colors"
            title="แก้ไข"
          >
            <Edit2 size={16} />
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-white/60 text-red-500 transition-colors"
              title="ลบ"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </div>

    {isEditing ? (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            className="max-w-xs bg-white"
          />
          <span className="text-sm font-medium">{unit}</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSave} size="sm" className="flex items-center gap-1">
            <Save size={14} />
            บันทึก
          </Button>
          <Button variant="danger" size="sm" onClick={onCancel}>
            ยกเลิก
          </Button>
        </div>
      </div>
    ) : (
      <div className={`text-3xl font-semibold ${textColor}`}>
        {rate.toFixed(2)} <span className="text-lg">{unit}</span>
      </div>
    )}
  </div>
);

export const UtilityRates: React.FC = () => {
  const { addToast } = useToast();
  const [utilityRate, setUtilityRate] = useState<UtilityRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customUtilities, setCustomUtilities] = useState<CustomUtility[]>([]);

  const [editingBuiltin, setEditingBuiltin] = useState<'electricity' | 'water' | null>(null);
  const [electricityInput, setElectricityInput] = useState('');
  const [waterInput, setWaterInput] = useState('');

  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [editingCustomRate, setEditingCustomRate] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUtility, setNewUtility] = useState({
    name: '',
    emoji: '🔧',
    rate: '',
    unit: 'หน่วย',
    colorIndex: 0,
  });

  useEffect(() => {
    fetchUtilityRates();
    loadCustomUtilities();
  }, []);

  const loadCustomUtilities = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) setCustomUtilities(JSON.parse(stored));
    } catch {
      setCustomUtilities([]);
    }
  };

  const saveCustomUtilities = (utilities: CustomUtility[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(utilities));
    setCustomUtilities(utilities);
  };

  const fetchUtilityRates = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/utility-rates');
      if (data && data.length > 0) {
        setUtilityRate(data[0]);
        setElectricityInput(data[0].electricityRate.toString());
        setWaterInput(data[0].waterRate.toString());
      }
    } catch (error) {
      console.error('Error fetching utility rates:', error);
      addToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBuiltin = async () => {
    if (!utilityRate) return;
    try {
      const updatedRate = {
        electricityRate: parseFloat(electricityInput) || 0,
        waterRate: parseFloat(waterInput) || 0,
      };
      await api.put(`/utility-rates/${utilityRate.id}`, updatedRate);
      setUtilityRate({ ...utilityRate, ...updatedRate });
      setEditingBuiltin(null);
      addToast('บันทึกข้อมูลสำเร็จ', 'success');
    } catch (error) {
      console.error('Error updating utility rates:', error);
      addToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  };

  const handleSaveCustom = (id: string) => {
    const updated = customUtilities.map((u) =>
      u.id === id ? { ...u, rate: parseFloat(editingCustomRate) || 0 } : u
    );
    saveCustomUtilities(updated);
    setEditingCustomId(null);
    addToast('บันทึกข้อมูลสำเร็จ', 'success');
  };

  const handleDeleteCustom = (id: string) => {
    saveCustomUtilities(customUtilities.filter((u) => u.id !== id));
    addToast('ลบรายการสำเร็จ', 'success');
  };

  const handleAddUtility = () => {
    if (!newUtility.name.trim() || !newUtility.rate) {
      addToast('กรุณากรอกชื่อและอัตราค่าบริการ', 'error');
      return;
    }
    const color = COLOR_OPTIONS[newUtility.colorIndex];
    const utility: CustomUtility = {
      id: Date.now().toString(),
      name: newUtility.name.trim(),
      emoji: newUtility.emoji || '🔧',
      rate: parseFloat(newUtility.rate) || 0,
      unit: newUtility.unit || 'หน่วย',
      bgColor: color.bg,
      textColor: color.text,
      iconBgColor: color.iconBg,
    };
    saveCustomUtilities([...customUtilities, utility]);
    setNewUtility({ name: '', emoji: '🔧', rate: '', unit: 'หน่วย', colorIndex: 0 });
    setShowAddForm(false);
    addToast('เพิ่มค่าบริการสำเร็จ', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">จัดการอัตราค่าบริการ</h1>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus size={16} />
          เพิ่มค่าบริการ
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="max-w-2xl space-y-4">
          {/* Electricity */}
          {utilityRate && (
            <UtilityCard
              emoji="⚡"
              name="ค่าไฟฟ้า"
              subtitle="อัตราค่าไฟฟ้าต่อหน่วย"
              rate={parseFloat(utilityRate.electricityRate.toString())}
              unit="บาท/หน่วย"
              bgColor="bg-yellow-50"
              textColor="text-yellow-700"
              iconBgColor="bg-yellow-100"
              isEditing={editingBuiltin === 'electricity'}
              inputValue={electricityInput}
              onInputChange={setElectricityInput}
              onEdit={() => {
                setEditingBuiltin('electricity');
                setElectricityInput(utilityRate.electricityRate.toString());
              }}
              onSave={handleSaveBuiltin}
              onCancel={() => {
                setEditingBuiltin(null);
                setElectricityInput(utilityRate.electricityRate.toString());
              }}
            />
          )}

          {/* Water */}
          {utilityRate && (
            <UtilityCard
              emoji="💧"
              name="ค่าน้ำประปา"
              subtitle="อัตราค่าน้ำประปาต่อหน่วย"
              rate={parseFloat(utilityRate.waterRate.toString())}
              unit="บาท/หน่วย"
              bgColor="bg-blue-50"
              textColor="text-blue-700"
              iconBgColor="bg-blue-100"
              isEditing={editingBuiltin === 'water'}
              inputValue={waterInput}
              onInputChange={setWaterInput}
              onEdit={() => {
                setEditingBuiltin('water');
                setWaterInput(utilityRate.waterRate.toString());
              }}
              onSave={handleSaveBuiltin}
              onCancel={() => {
                setEditingBuiltin(null);
                setWaterInput(utilityRate.waterRate.toString());
              }}
            />
          )}

          {/* Custom utilities */}
          {customUtilities.map((u) => (
            <UtilityCard
              key={u.id}
              emoji={u.emoji}
              name={u.name}
              subtitle={`อัตราค่า${u.name}ต่อ${u.unit}`}
              rate={u.rate}
              unit={`บาท/${u.unit}`}
              bgColor={u.bgColor}
              textColor={u.textColor}
              iconBgColor={u.iconBgColor}
              isEditing={editingCustomId === u.id}
              inputValue={editingCustomId === u.id ? editingCustomRate : u.rate.toString()}
              onInputChange={setEditingCustomRate}
              onEdit={() => {
                setEditingCustomId(u.id);
                setEditingCustomRate(u.rate.toString());
              }}
              onSave={() => handleSaveCustom(u.id)}
              onCancel={() => setEditingCustomId(null)}
              onDelete={() => handleDeleteCustom(u.id)}
            />
          ))}

          {/* Add Utility Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">เพิ่มค่าบริการใหม่</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อค่าบริการ
                    </label>
                    <Input
                      placeholder="เช่น ค่าอินเทอร์เน็ต"
                      value={newUtility.name}
                      onChange={(e) => setNewUtility({ ...newUtility, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ไอคอน (Emoji)
                    </label>
                    <Input
                      placeholder="เช่น 📶"
                      value={newUtility.emoji}
                      onChange={(e) => setNewUtility({ ...newUtility, emoji: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      อัตราค่าบริการ (บาท)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newUtility.rate}
                      onChange={(e) => setNewUtility({ ...newUtility, rate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย</label>
                    <Input
                      placeholder="เช่น หน่วย, เดือน, ครั้ง"
                      value={newUtility.unit}
                      onChange={(e) => setNewUtility({ ...newUtility, unit: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">สีธีม</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setNewUtility({ ...newUtility, colorIndex: idx })}
                        className={`w-8 h-8 rounded-full ${color.iconBg} border-2 transition-all ${
                          newUtility.colorIndex === idx
                            ? 'border-gray-700 scale-110'
                            : 'border-transparent'
                        }`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleAddUtility}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    เพิ่มค่าบริการ
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
