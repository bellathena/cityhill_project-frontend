import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Input } from '../component/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../component/dialog';
import api from '../lib/axios';

type RoomStatus = 'AVAILABLE' | 'OCCUPIED_M' | 'OCCUPIED_D' | 'RESERVED' | 'MAINTENANCE';
type AllowedType = 'MONTHLY' | 'DAILY' | 'FLEXIBLE';

interface RoomType {
  id: number;
  typeName: string;
  description?: string;
  baseMonthlyRate: number;
  baseDailyRate: number;
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: number;
  roomNumber: string;
  floor: string | number;
  typeId: number;
  allowedType: AllowedType;
  currentStatus: RoomStatus;
  latestMeterElectric: number | null;
  latestMeterWater: number | null;
  createdAt: string;
  updatedAt: string;
  roomType: RoomType;
  dailyBookings?: any[];
  monthlyContracts?: any[];
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
    pricePerDay: '',
    pricePerMonth: '',
  });

  // Fetch rooms and room types on mount
  useEffect(() => {
    fetchRooms();
    fetchRoomTypes();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูลห้อง');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const { data } = await api.get('/room-types');
      setRoomTypes(data);
    } catch (error) {
      console.error('Error fetching room types:', error);
    }
  };

  const handleAdd = () => {
    setIsAddMode(true);
    setFormData({
      roomNumber: '',
      floor: '',
      typeId: '',
      pricePerDay: '',
      pricePerMonth: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (room: Room) => {
    setIsAddMode(false);
    setSelectedRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      floor: room.floor.toString(),
      typeId: room.typeId.toString(),
      pricePerDay: room.roomType.baseDailyRate.toString(),
      pricePerMonth: room.roomType.baseMonthlyRate.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (isAddMode) {
        const newRoom = {
          roomNumber: formData.roomNumber,
          floor: formData.floor,
          typeId: parseInt(formData.typeId),
          pricePerDay: formData.pricePerDay,
          pricePerMonth: formData.pricePerMonth,
        };

        await api.post('/rooms', newRoom);
        setIsDialogOpen(false);
        fetchRooms();
      } else if (selectedRoom) {
        const updatedRoom = {
          roomNumber: formData.roomNumber,
          floor: formData.floor,
          typeId: parseInt(formData.typeId),
          pricePerDay: formData.pricePerDay,
          pricePerMonth: formData.pricePerMonth,
        };

        await api.put(`/rooms/${selectedRoom.id}`, updatedRoom);
        setIsDialogOpen(false);
        fetchRooms();
      }
    } catch (error) {
      console.error('Error saving room:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลห้อง');
    }
  };

  const handleDelete = async (roomId: number) => {
    if (confirm('คุณต้องการลบห้องนี้หรือไม่?')) {
      try {
        console.log('Deleting room with ID:', roomId);
        await api.delete(`/rooms/${roomId}`);
        fetchRooms();
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('เกิดข้อผิดพลาดในการลบห้อง');
      }
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.roomNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || room.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group rooms by floor
  const roomsByFloor = filteredRooms.reduce((acc, room) => {
    const floorNum = typeof room.floor === 'string' ? room.floor : room.floor.toString();
    if (!acc[floorNum]) acc[floorNum] = [];
    acc[floorNum].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">จัดการห้องพัก</h1>
        <Button onClick={handleAdd} className="flex items-center gap-2" disabled={isLoading}>
          <Plus size={20} />
          เพิ่มห้องพัก
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="ค้นหาเลขห้อง..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
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
          {/* Rooms by Floor */}
          <div className="space-y-12">
            {Object.entries(roomsByFloor)
              .sort(([floorA], [floorB]) => {
                const numA = parseInt(floorA) || 0;
                const numB = parseInt(floorB) || 0;
                return numB - numA;
              })
              .map(([floor, floorRooms]) => (
                <div key={floor}>
                  <h2 className="text-xl font-semibold mb-6 text-gray-800">ชั้น {floor}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {floorRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => handleEdit(room)}
                        className={`p-4 rounded-xl text-white font-semibold transition-all hover:scale-105 hover:shadow-lg active:scale-95 ${statusColors[room.currentStatus]}`}
                      >
                        <div className="text-2xl font-bold mb-2">{room.roomNumber}</div>
                        <div className="text-xs leading-tight">
                          <div>{room.roomType.typeName}</div>
                          <div>{statusLabels[room.currentStatus]}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

            {filteredRooms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                ไม่พบห้องพัก คลิกปุ่ม "เพิ่มห้องพัก" เพื่อเริ่มต้น
              </div>
            )}
          </div>

          {/* Add/Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isAddMode ? 'เพิ่มห้องพัก' : 'แก้ไขห้องพัก'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">เลขห้อง</label>
                  <Input
                    value={formData.roomNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="เช่น 101, 201"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">ชั้น</label>
                  <Input
                    value={formData.floor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="เช่น 1, 2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">ประเภทห้อง</label>
                  <select
                    value={formData.typeId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, typeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">เลือกประเภทห้อง</option>
                    {roomTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.typeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">ราคารายวัน (บาท)</label>
                  <Input
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    placeholder="กรอกราคารายวัน"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">ราคารายเดือน (บาท)</label>
                  <Input
                    type="number"
                    value={formData.pricePerMonth}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, pricePerMonth: e.target.value })}
                    placeholder="กรอกราคารายเดือน"
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSave} className="flex-1">
                    บันทึก
                  </Button>
                  {!isAddMode && (
                    <Button
                      onClick={() => {
                        if (selectedRoom) {
                          handleDelete(selectedRoom.id);
                          setIsDialogOpen(false);
                        }
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 size={16} className="mr-2" />
                      ลบ
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
