import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
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
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    typeId: number | null;
  }>({ isOpen: false, typeId: null });

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
    setFormData({
      typeName: type.typeName,
      baseDailyRate: type.baseDailyRate.toString(),
      baseMonthlyRate: type.baseMonthlyRate.toString(),
      description: type.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
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
    } catch (error) {
      console.error('Error saving room type:', error);
      addToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">จัดการประเภทห้องพัก</h1>
        <Button onClick={handleAdd} className="flex items-center gap-2" disabled={isLoading}>
          <Plus size={20} />
          เพิ่มประเภทห้อง
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-500">
          กำลังโหลดข้อมูล...
        </div>
      )}

      {/* Room Types Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((type: RoomType) => (
            <div key={type.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">{type.typeName}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(type)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit2 size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(type.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>

              {type.description && (
                <p className="text-sm text-gray-600 mb-4">{type.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-sm font-medium">ค่าเช่ารายวัน</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {type.baseDailyRate.toLocaleString()} บาท
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-sm font-medium">ค่าเช่ารายเดือน</span>
                  <span className="text-lg font-semibold text-green-600">
                    {type.baseMonthlyRate.toLocaleString()} บาท
                  </span>
                </div>
              </div>
            </div>
          ))}

          {roomTypes.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              ยังไม่มีประเภทห้องพัก คลิกปุ่ม "เพิ่มประเภทห้อง" เพื่อเริ่มต้น
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
              <label className="text-sm font-medium">ชื่อประเภทห้อง</label>
              <Input
                value={formData.typeName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, typeName: e.target.value })}
                placeholder="เช่น ห้องพัดลม, ห้องแอร์"
              />
            </div>

            <div>
              <label className="text-sm font-medium">รายละเอียด</label>
              <Input
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              />
            </div>

            <div>
              <label className="text-sm font-medium">ค่าเช่ารายวัน (บาท)</label>
              <Input
                type="number"
                value={formData.baseDailyRate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, baseDailyRate: e.target.value })}
                placeholder="กรอกค่าเช่ารายวัน"
              />
            </div>

            <div>
              <label className="text-sm font-medium">ค่าเช่ารายเดือน (บาท)</label>
              <Input
                type="number"
                value={formData.baseMonthlyRate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, baseMonthlyRate: e.target.value })}
                placeholder="กรอกค่าเช่ารายเดือน"
              />
            </div>

            <Button onClick={handleSave} className="w-full">
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
