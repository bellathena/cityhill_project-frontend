import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Input } from '../component/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, ConfirmDialog } from '../component/dialog';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

type RoomStatus = 'AVAILABLE' | 'OCCUPIED_M' | 'OCCUPIED_D' | 'RESERVED' | 'MAINTENANCE';
type AllowedType = 'MONTHLY' | 'DAILY' | 'FLEXIBLE';

interface RoomType {
  id: number;
  typeName: string;
  description?: string;
  baseMonthlyRate: number;
  baseDailyRate: number;
}

interface Room {
  roomNumber: number;
  floor: number;
  typeId: number;
  allowedType: AllowedType;
  currentStatus: RoomStatus;
  latestMeterElectric: number | null;
  latestMeterWater: number | null;
  roomType?: RoomType;
}

const statusColors: Record<RoomStatus, string> = {
  'AVAILABLE': 'bg-green-500',
  'OCCUPIED_M': 'bg-blue-500',
  'OCCUPIED_D': 'bg-teal-600',
  'RESERVED': 'bg-orange-500',
  'MAINTENANCE': 'bg-gray-500',
};

const statusLabels: Record<RoomStatus, string> = {
  'AVAILABLE': 'ว่าง',
  'OCCUPIED_M': 'รายเดือน',
  'OCCUPIED_D': 'รายวัน',
  'RESERVED': 'จอง',
  'MAINTENANCE': 'ซ่อม',
};

export const RoomManagement: React.FC = () => {
  const { addToast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: '',
    typeId: '',
    allowedType: 'FLEXIBLE' as AllowedType,
    currentStatus: 'AVAILABLE' as RoomStatus,
  });
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    roomNumber: number | null;
  }>({ isOpen: false, roomNumber: null });

  useEffect(() => {
    fetchRooms();
    fetchRoomTypes();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch {
      addToast('เกิดข้อผิดพลาดในการโหลดข้อมูลห้อง', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const { data } = await api.get('/room-types');
      setRoomTypes(data);
    } catch {
      console.error('Error fetching room types');
    }
  };

  const handleAdd = () => {
    setIsAddMode(true);
    setFormData({ roomNumber: '', floor: '', typeId: '', allowedType: 'FLEXIBLE', currentStatus: 'AVAILABLE' });
    setIsDialogOpen(true);
  };

  const handleEdit = (room: Room) => {
    setIsAddMode(false);
    setSelectedRoom(room);
    setFormData({
      roomNumber: room.roomNumber.toString(),
      floor: room.floor.toString(),
      typeId: room.typeId.toString(),
      allowedType: room.allowedType,
      currentStatus: room.currentStatus,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (isAddMode) {
        await api.post('/rooms', {
          roomNumber: parseInt(formData.roomNumber),
          floor: parseInt(formData.floor),
          typeId: parseInt(formData.typeId),
          allowedType: formData.allowedType,
          currentStatus: formData.currentStatus,
        });
        addToast('เพิ่มห้องสำเร็จ', 'success');
      } else if (selectedRoom) {
        await api.put(`/rooms/${selectedRoom.roomNumber}`, {
          floor: parseInt(formData.floor),
          typeId: parseInt(formData.typeId),
          allowedType: formData.allowedType,
          currentStatus: formData.currentStatus,
        });
        addToast('อัปเดตห้องสำเร็จ', 'success');
      }
      setIsDialogOpen(false);
      fetchRooms();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (confirmData.roomNumber !== null) {
      try {
        await api.delete(`/rooms/${confirmData.roomNumber}`);
        addToast('ลบห้องสำเร็จ', 'success');
        fetchRooms();
      } catch (err: any) {
        addToast(err.response?.data?.error || 'เกิดข้อผิดพลาดในการลบห้อง', 'error');
      } finally {
        setConfirmData({ isOpen: false, roomNumber: null });
      }
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.roomNumber.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || room.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const roomsByFloor = filteredRooms.reduce((acc, room) => {
    const floorNum = room.floor.toString();
    if (!acc[floorNum]) acc[floorNum] = [];
    acc[floorNum].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">จัดการห้องพัก</h1>
        <Button onClick={handleAdd} className="flex items-center gap-2" disabled={isLoading}>
          <Plus size={20} /> เพิ่มห้องพัก
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="ค้นหาเลขห้อง..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">สถานะทั้งหมด</option>
          <option value="AVAILABLE">ว่าง</option>
          <option value="OCCUPIED_M">รายเดือน</option>
          <option value="OCCUPIED_D">รายวัน</option>
          <option value="RESERVED">จอง</option>
          <option value="MAINTENANCE">ซ่อม</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">กำลังโหลดห้องพัก...</div>
      ) : (
        <>
          <div className="space-y-12">
            {Object.entries(roomsByFloor)
              .sort(([a], [b]) => (parseInt(b) || 0) - (parseInt(a) || 0))
              .map(([floor, floorRooms]) => (
                <div key={floor}>
                  <h2 className="text-xl font-semibold mb-6 text-gray-800">ชั้น {floor}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {floorRooms.map((room) => (
                      <button
                        key={room.roomNumber}
                        onClick={() => handleEdit(room)}
                        className={`p-4 rounded-xl text-white font-semibold transition-all hover:scale-105 hover:shadow-lg active:scale-95 ${statusColors[room.currentStatus]}`}
                      >
                        <div className="text-2xl font-bold mb-2">{room.roomNumber}</div>
                        <div className="text-xs leading-tight">
                          <div>{room.roomType?.typeName}</div>
                          <div>{statusLabels[room.currentStatus]}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            {filteredRooms.length === 0 && (
              <div className="text-center py-12 text-gray-500">ไม่พบห้องพัก</div>
            )}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isAddMode ? 'เพิ่มห้องพัก' : 'แก้ไขห้องพัก'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">เลขห้อง</label>
                  <Input type="number" value={formData.roomNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, roomNumber: e.target.value })} placeholder="เช่น 101" disabled={!isAddMode} />
                </div>
                <div>
                  <label className="text-sm font-medium">ชั้น</label>
                  <Input type="number" value={formData.floor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, floor: e.target.value })} placeholder="เช่น 1" />
                </div>
                <div>
                  <label className="text-sm font-medium">ประเภทห้อง</label>
                  <select value={formData.typeId} onChange={(e) => setFormData({ ...formData, typeId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">เลือกประเภทห้อง</option>
                    {roomTypes.map((type) => (<option key={type.id} value={type.id}>{type.typeName}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">ประเภทการเช่า</label>
                  <select value={formData.allowedType} onChange={(e) => setFormData({ ...formData, allowedType: e.target.value as AllowedType })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="FLEXIBLE">ทั้งสองแบบ</option>
                    <option value="MONTHLY">รายเดือนเท่านั้น</option>
                    <option value="DAILY">รายวันเท่านั้น</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">สถานะห้อง</label>
                  <select value={formData.currentStatus} onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value as RoomStatus })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="AVAILABLE">ว่าง</option>
                    <option value="OCCUPIED_M">รายเดือน</option>
                    <option value="OCCUPIED_D">รายวัน</option>
                    <option value="RESERVED">จอง</option>
                    <option value="MAINTENANCE">ซ่อม</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSave} className="flex-1">บันทึก</Button>
                  {!isAddMode && (
                    <Button onClick={() => { if (selectedRoom) { setConfirmData({ isOpen: true, roomNumber: selectedRoom.roomNumber }); setIsDialogOpen(false); } }} className="flex-1 bg-red-600 hover:bg-red-700">
                      <Trash2 size={16} className="mr-2" /> ลบ
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <ConfirmDialog
            isOpen={confirmData.isOpen}
            title="ยืนยันการลบห้อง"
            description="คุณต้องการลบห้องนี้หรือไม่?"
            confirmText="ลบ"
            cancelText="ยกเลิก"
            isDangerous
            onConfirm={handleConfirmDelete}
            onCancel={() => setConfirmData({ isOpen: false, roomNumber: null })}
          />
        </>
      )}
    </div>
  );
};
