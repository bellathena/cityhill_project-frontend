import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Grid3x3 } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Input } from '../component/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, ConfirmDialog } from '../component/dialog';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

interface RoomType {
  id: number;
  typeName: string;
  baseDailyRate: number;
  baseMonthlyRate: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  rooms?: any[];
}

export const RoomTypes: React.FC = () => {
  const { addToast } = useToast();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedType, setSelectedType] = useState<RoomType | null>(null);
  const [formData, setFormData] = useState({
    typeName: '',
    baseDailyRate: '',
    baseMonthlyRate: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<{
    typeName?: string;
    baseDailyRate?: string;
    baseMonthlyRate?: string;
  }>({});
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    typeId: number | null;
  }>({ isOpen: false, typeId: null });

  const totalTypes = roomTypes.length;
  const avgDailyRate = totalTypes > 0
    ? roomTypes.reduce((sum, t) => sum + Number(t.baseDailyRate || 0), 0) / totalTypes
    : 0;
  const avgMonthlyRate = totalTypes > 0
    ? roomTypes.reduce((sum, t) => sum + Number(t.baseMonthlyRate || 0), 0) / totalTypes
    : 0;

  // Fetch room types data when component mounts
  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/room-types');
      setRoomTypes(data);
    } catch (error) {
      console.error('Error fetching room types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAddMode(true);
    setFormErrors({});
    setFormData({
      typeName: '',
      baseDailyRate: '',
      baseMonthlyRate: '',
      description: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (type: RoomType) => {
    setIsAddMode(false);
    setSelectedType(type);
    setFormErrors({});
    setFormData({
      typeName: type.typeName,
      baseDailyRate: type.baseDailyRate.toString(),
      baseMonthlyRate: type.baseMonthlyRate.toString(),
      description: type.description || '',
    });
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const errors: {
      typeName?: string;
      baseDailyRate?: string;
      baseMonthlyRate?: string;
    } = {};

    if (!formData.typeName.trim()) {
      errors.typeName = 'กรุณากรอกชื่อประเภทห้อง';
    }

    const dailyRate = parseFloat(formData.baseDailyRate);
    const monthlyRate = parseFloat(formData.baseMonthlyRate);

    if (!formData.baseDailyRate.trim()) {
      errors.baseDailyRate = 'กรุณากรอกค่าเช่ารายวัน';
    } else if (Number.isNaN(dailyRate)) {
      errors.baseDailyRate = 'ค่าเช่ารายวันต้องเป็นตัวเลข';
    } else if (dailyRate < 0) {
      errors.baseDailyRate = 'ค่าเช่ารายวันต้องมากกว่าหรือเท่ากับ 0';
    }

    if (!formData.baseMonthlyRate.trim()) {
      errors.baseMonthlyRate = 'กรุณากรอกค่าเช่ารายเดือน';
    } else if (Number.isNaN(monthlyRate)) {
      errors.baseMonthlyRate = 'ค่าเช่ารายเดือนต้องเป็นตัวเลข';
    } else if (monthlyRate < 0) {
      errors.baseMonthlyRate = 'ค่าเช่ารายเดือนต้องมากกว่าหรือเท่ากับ 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      addToast('ข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง กรุณาตรวจสอบช่องที่มีกรอบสีแดง', 'warning');
      return;
    }

    try {
      if (isAddMode) {
        const newType = {
          typeName: formData.typeName,
          baseDailyRate: parseFloat(formData.baseDailyRate) || 0,
          baseMonthlyRate: parseFloat(formData.baseMonthlyRate) || 0,
          description: formData.description,
        };
        
        await api.post('/room-types', newType);
        addToast('เพิ่มประเภทห้องสำเร็จ', 'success');
        setIsDialogOpen(false);
        fetchRoomTypes();
      } else if (selectedType) {
        const updatedType = {
          typeName: formData.typeName,
          baseDailyRate: parseFloat(formData.baseDailyRate) || 0,
          baseMonthlyRate: parseFloat(formData.baseMonthlyRate) || 0,
          description: formData.description,
        };
        
        await api.put(`/room-types/${selectedType.id}`, updatedType);
        addToast('อัปเดตประเภทห้องสำเร็จ', 'success');
        setIsDialogOpen(false);
        fetchRoomTypes();
      }
    } catch (error: any) {
      console.error('Error saving room type:', error);

      const responseError = error?.response?.data;
      const messageFromServer = responseError?.message || responseError?.error;
      const detailsFromServer = Array.isArray(responseError?.details)
        ? responseError.details.join(', ')
        : undefined;

      const actionText = isAddMode ? 'เพิ่มประเภทห้อง' : 'อัปเดตประเภทห้อง';
      const errorMessage = [
        messageFromServer,
        detailsFromServer,
      ].filter(Boolean).join(' - ');

      addToast(errorMessage || `${actionText}ไม่สำเร็จ กรุณาตรวจสอบข้อมูลที่กรอก`, 'error');
    }
  };

  const handleDelete = async (typeId: number) => {
    setConfirmData({ isOpen: true, typeId });
  };

  const handleConfirmDelete = async () => {
    if (confirmData.typeId) {
      try {
        await api.delete(`/room-types/${confirmData.typeId}`);
        addToast('ลบประเภทห้องสำเร็จ', 'success');
        fetchRoomTypes();
      } catch (error) {
        console.error('Error deleting room type:', error);
        addToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
      } finally {
        setConfirmData({ isOpen: false, typeId: null });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-white to-emerald-50 border border-sky-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Grid3x3 size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">จัดการประเภทห้องพัก</h1>
              <p className="text-sm text-gray-500">กำหนดเรทราคาและรายละเอียดประเภทห้อง</p>
            </div>
          </div>

          <Button onClick={handleAdd} className="flex items-center gap-2" disabled={isLoading}>
            <Plus size={18} />
            เพิ่มประเภทห้อง
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/80 border border-gray-100 p-4">
            <p className="text-xs text-gray-500">จำนวนประเภทห้อง</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalTypes}</p>
          </div>
          <div className="rounded-xl bg-white/80 border border-gray-100 p-4">
            <p className="text-xs text-gray-500">ค่าเช่ารายวันเฉลี่ย</p>
            <p className="text-2xl font-bold text-sky-700 mt-1">{Math.round(avgDailyRate).toLocaleString()} บาท</p>
          </div>
          <div className="rounded-xl bg-white/80 border border-gray-100 p-4">
            <p className="text-xs text-gray-500">ค่าเช่ารายเดือนเฉลี่ย</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{Math.round(avgMonthlyRate).toLocaleString()} บาท</p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-12 text-gray-500">
          กำลังโหลดข้อมูล...
        </div>
      )}

      {/* Room Types Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((type: RoomType) => (
            <div key={type.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{type.typeName}</h3>
                  <p className="text-xs text-gray-400 mt-1">ประเภทห้อง #{type.id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(type)}
                    className="p-2 hover:bg-sky-50 rounded-lg border border-transparent hover:border-sky-100"
                  >
                    <Edit2 size={16} className="text-sky-700" />
                  </button>
                  <button
                    onClick={() => handleDelete(type.id)}
                    className="p-2 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>

              {type.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{type.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-sky-50 rounded-xl border border-sky-100">
                  <span className="text-sm font-medium text-gray-700">ค่าเช่ารายวัน</span>
                  <span className="text-lg font-semibold text-sky-700">
                    {type.baseDailyRate.toLocaleString()} บาท
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-sm font-medium text-gray-700">ค่าเช่ารายเดือน</span>
                  <span className="text-lg font-semibold text-emerald-700">
                    {type.baseMonthlyRate.toLocaleString()} บาท
                  </span>
                </div>
              </div>
            </div>
          ))}

          {roomTypes.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 text-center py-14 text-gray-500 bg-white">
              ยังไม่มีประเภทห้องพัก
              <div className="text-sm mt-1">คลิกปุ่ม "เพิ่มประเภทห้อง" เพื่อเริ่มต้น</div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAddMode ? 'เพิ่มประเภทห้องพัก' : 'แก้ไขประเภทห้องพัก'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">ชื่อประเภทห้อง</label>
              <Input
                value={formData.typeName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, typeName: e.target.value });
                  if (formErrors.typeName) {
                    setFormErrors((prev) => ({ ...prev, typeName: undefined }));
                  }
                }}
                placeholder="เช่น ห้องพัดลม, ห้องแอร์"
                className={formErrors.typeName ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
              {formErrors.typeName && (
                <p className="mt-1 text-xs text-red-600">{formErrors.typeName}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">รายละเอียด</label>
              <Input
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">ค่าเช่ารายวัน (บาท)</label>
                <Input
                  type="number"
                  value={formData.baseDailyRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFormData({ ...formData, baseDailyRate: e.target.value });
                    if (formErrors.baseDailyRate) {
                      setFormErrors((prev) => ({ ...prev, baseDailyRate: undefined }));
                    }
                  }}
                  placeholder="กรอกค่าเช่ารายวัน"
                  className={formErrors.baseDailyRate ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {formErrors.baseDailyRate && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.baseDailyRate}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">ค่าเช่ารายเดือน (บาท)</label>
                <Input
                  type="number"
                  value={formData.baseMonthlyRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFormData({ ...formData, baseMonthlyRate: e.target.value });
                    if (formErrors.baseMonthlyRate) {
                      setFormErrors((prev) => ({ ...prev, baseMonthlyRate: undefined }));
                    }
                  }}
                  placeholder="กรอกค่าเช่ารายเดือน"
                  className={formErrors.baseMonthlyRate ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {formErrors.baseMonthlyRate && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.baseMonthlyRate}</p>
                )}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={!formData.typeName.trim()}>
              บันทึก
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmData.isOpen}
        title="ยืนยันการลบประเภทห้อง"
        description="คุณต้องการลบประเภทห้องพักนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmData({ isOpen: false, typeId: null })}
      />
    </div>
  );
};
