import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Zap,
  Droplets,
  Wrench,
  Settings2,
  Flame,
  Wifi,
  Wind,
  Car,
  Leaf,
  Tv,
  Refrigerator,
} from "lucide-react";
import { Button } from "../component/ui/button";
import { Input } from "../component/ui/input";
import { ConfirmDialog } from "../component/dialog";
import api from "../lib/axios";
import { useToast } from "../context/ToastContext";

interface Utility {
  id: number;
  uType: string;
  ratePerUnit: number;
}

const ICON_OPTIONS = [
  {
    key: "zap",
    label: "ไฟฟ้า",
    icon: Zap,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    accent: "text-amber-600",
    border: "border-amber-200",
    headerBg: "bg-gradient-to-r from-amber-50 to-orange-50",
  },
  {
    key: "droplets",
    label: "น้ำ",
    icon: Droplets,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    accent: "text-blue-600",
    border: "border-blue-200",
    headerBg: "bg-gradient-to-r from-blue-50 to-cyan-50",
  },
  {
    key: "flame",
    label: "แก๊ส",
    icon: Flame,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    accent: "text-orange-600",
    border: "border-orange-200",
    headerBg: "bg-gradient-to-r from-orange-50 to-red-50",
  },
  {
    key: "wifi",
    label: "อินเทอร์เน็ต",
    icon: Wifi,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-500",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    accent: "text-purple-600",
    border: "border-purple-200",
    headerBg: "bg-gradient-to-r from-purple-50 to-indigo-50",
  },
  {
    key: "wind",
    label: "แอร์",
    icon: Wind,
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-500",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    accent: "text-cyan-600",
    border: "border-cyan-200",
    headerBg: "bg-gradient-to-r from-cyan-50 to-sky-50",
  },
  {
    key: "car",
    label: "จอดรถ",
    icon: Car,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    accent: "text-slate-600",
    border: "border-slate-200",
    headerBg: "bg-gradient-to-r from-slate-50 to-gray-50",
  },
  {
    key: "leaf",
    label: "สิ่งแวดล้อม",
    icon: Leaf,
    iconBg: "bg-green-100",
    iconColor: "text-green-500",
    badge: "bg-green-50 text-green-700 border-green-200",
    accent: "text-green-600",
    border: "border-green-200",
    headerBg: "bg-gradient-to-r from-green-50 to-emerald-50",
  },
  {
    key: "wrench",
    label: "อื่น ๆ",
    icon: Wrench,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
    badge: "bg-gray-50 text-gray-700 border-gray-200",
    accent: "text-gray-700",
    border: "border-gray-200",
    headerBg: "bg-gradient-to-r from-gray-50 to-slate-50",
  },
  {
    key: "tv",
    label: "ทีวี",
    icon: Tv,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-500",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    accent: "text-indigo-600",
    border: "border-indigo-200",
    headerBg: "bg-gradient-to-r from-indigo-50 to-blue-50",
  },
  {
    key: "refrigerator",
    label: "ตู้เย็น",
    icon: Refrigerator,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-500",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    accent: "text-sky-600",
    border: "border-sky-200",
    headerBg: "bg-gradient-to-r from-sky-50 to-cyan-50",
  },
] as const;

const ICON_STORAGE_KEY = "utility-icon-overrides";

const loadIconOverrides = (): Record<number, string> => {
  try {
    return JSON.parse(localStorage.getItem(ICON_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const getAutoIconKey = (uType: string) => {
  const t = uType.toLowerCase();
  if (t.includes("electric") || t.includes("ไฟ")) return "zap";
  if (t.includes("water") || t.includes("น้ำ")) return "droplets";
  return "wrench";
};

const getTheme = (uType: string, overrideKey?: string) => {
  const key = overrideKey ?? getAutoIconKey(uType);
  return (
    ICON_OPTIONS.find((o) => o.key === key) ??
    ICON_OPTIONS[ICON_OPTIONS.length - 1]
  );
};

const IconPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {ICON_OPTIONS.map((opt) => {
      const Icon = opt.icon;
      const selected = value === opt.key;
      return (
        <button
          key={opt.key}
          type="button"
          title={opt.label}
          onClick={() => onChange(opt.key)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            selected
              ? `${opt.iconBg} ${opt.iconColor} ring-2 ring-offset-1 ring-current scale-110`
              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
          }`}
        >
          <Icon size={16} />
        </button>
      );
    })}
  </div>
);

export const UtilityRates: React.FC = () => {
  const { addToast } = useToast();
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRate, setEditRate] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newIconKey, setNewIconKey] = useState("wrench");
  const [editIconKey, setEditIconKey] = useState("wrench");
  const [iconOverrides, setIconOverrides] =
    useState<Record<number, string>>(loadIconOverrides);
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    id: number | null;
  }>({ isOpen: false, id: null });

  useEffect(() => {
    fetchUtilities();
  }, []);

  const fetchUtilities = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/utilities");
      setUtilities(data);
    } catch {
      addToast("เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRate = async (id: number) => {
    try {
      await api.put(`/utilities/${id}`, {
        ratePerUnit: parseFloat(editRate) || 0,
      });
      const updated = { ...loadIconOverrides(), [id]: editIconKey };
      localStorage.setItem(ICON_STORAGE_KEY, JSON.stringify(updated));
      setIconOverrides(updated);
      addToast("บันทึกสำเร็จ", "success");
      setEditingId(null);
      fetchUtilities();
    } catch {
      addToast("เกิดข้อผิดพลาด", "error");
    }
  };

  const handleAdd = async () => {
    if (!newType.trim() || !newRate.trim()) {
      addToast("กรุณากรอกชื่อและอัตรา", "warning");
      return;
    }
    try {
      await api.post("/utilities", {
        uType: newType.trim(),
        ratePerUnit: parseFloat(newRate) || 0,
      });
      addToast("เพิ่มค่าบริการสำเร็จ", "success");
      const { data } = await api.get("/utilities");
      setUtilities(data);
      const newItem = (data as Utility[]).find(
        (u) => u.uType === newType.trim(),
      );
      if (newItem) {
        const updated = { ...loadIconOverrides(), [newItem.id]: newIconKey };
        localStorage.setItem(ICON_STORAGE_KEY, JSON.stringify(updated));
        setIconOverrides(updated);
      }
      setNewType("");
      setNewRate("");
      setNewIconKey("wrench");
      setShowAddForm(false);
    } catch (err: any) {
      addToast(err.response?.data?.error || "เกิดข้อผิดพลาด", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmData.id) return;
    try {
      await api.delete(`/utilities/${confirmData.id}`);
      addToast("ลบสำเร็จ", "success");
      fetchUtilities();
    } catch {
      addToast("ไม่สามารถลบได้", "error");
    } finally {
      setConfirmData({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-white to-emerald-50 border border-sky-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Settings2 size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                อัตราค่าสาธารณูปโภค
              </h1>
              <p className="text-sm text-gray-500">
                จัดการอัตราค่าบริการสาธารณูปโภคในหอพัก
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setShowAddForm(true);
              setNewType("");
              setNewRate("");
              setNewIconKey("wrench");
            }}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> เพิ่มค่าบริการ
          </Button>
        </div>

        {/* Summary bar */}
        <div className="mt-4 bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{utilities.length}</span>{" "}
          รายการค่าบริการทั้งหมด
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm">กำลังโหลดข้อมูล...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {utilities.map((u) => {
            const theme = getTheme(u.uType, iconOverrides[u.id]);
            const Icon = theme.icon;
            const isEditing = editingId === u.id;
            return (
              <div
                key={u.id}
                className={`bg-white rounded-2xl border ${theme.border} shadow-sm overflow-hidden transition-shadow hover:shadow-md`}
              >
                {/* Card header */}
                <div
                  className={`${theme.headerBg} px-5 py-4 flex items-center justify-between border-b ${theme.border}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 ${theme.iconBg} rounded-xl flex items-center justify-center`}
                    >
                      <Icon size={20} className={theme.iconColor} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {u.uType}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${theme.badge} font-medium`}
                      >
                        อัตราต่อหน่วย
                      </span>
                    </div>
                  </div>
                  {!isEditing && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingId(u.id);
                          setEditRate(u.ratePerUnit.toString());
                          setEditIconKey(
                            iconOverrides[u.id] ?? getAutoIconKey(u.uType),
                          );
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() =>
                          setConfirmData({ isOpen: true, id: u.id })
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="px-5 py-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          ไอคอน
                        </label>
                        <IconPicker
                          value={editIconKey}
                          onChange={setEditIconKey}
                        />
                      </div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                        อัตราใหม่ (บาท/หน่วย)
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={editRate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditRate(e.target.value)
                          }
                          className="flex-1 bg-gray-50"
                          autoFocus
                        />
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          บาท
                        </span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          onClick={() => handleSaveRate(u.id)}
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-1.5"
                        >
                          <Save size={14} /> บันทึก
                        </Button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1.5">
                      <span className={`text-3xl font-bold ${theme.accent}`}>
                        {Number(u.ratePerUnit).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-400 mb-1">
                        บาท / หน่วย
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add new card inline */}
          {showAddForm && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-indigo-300 shadow-sm overflow-hidden">
              <div className="bg-indigo-50 px-5 py-4 flex items-center justify-between border-b border-indigo-200">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Plus size={18} className="text-indigo-600" />
                  </div>
                  <p className="font-semibold text-indigo-700 text-sm">
                    เพิ่มค่าบริการใหม่
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    ไอคอน
                  </label>
                  <IconPicker value={newIconKey} onChange={setNewIconKey} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    ชื่อค่าบริการ
                  </label>
                  <Input
                    placeholder="เช่น ไฟฟ้า, น้ำประปา"
                    value={newType}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewType(e.target.value)
                    }
                    className="bg-gray-50"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    อัตรา (บาท/หน่วย)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newRate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewRate(e.target.value)
                    }
                    className="bg-gray-50"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleAdd}
                    className="flex-1 flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> เพิ่ม
                  </Button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}

          {utilities.length === 0 && !showAddForm && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Settings2 size={28} className="text-gray-300" />
              </div>
              <p className="text-sm">ยังไม่มีอัตราค่าบริการ</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-sm text-indigo-600 hover:underline"
              >
                + เพิ่มตอนนี้
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmData.isOpen}
        title="ยืนยันการลบ"
        description="คุณต้องการลบค่าบริการนี้หรือไม่?"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        isDangerous
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmData({ isOpen: false, id: null })}
      />
    </div>
  );
};
