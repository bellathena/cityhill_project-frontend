import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Building2, BedDouble, Wrench, CheckCircle2 } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Input } from '../component/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, ConfirmDialog } from '../component/dialog';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

type RoomStatus = 'AVAILABLE' | 'OCCUPIED_M' | 'OCCUPIED_D' | 'MAINTENANCE';
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

const statusConfig: Record<RoomStatus, { label: string; dot: string; card: string; badge: string }> = {
  AVAILABLE:   { label: 'ว่าง',     dot: 'bg-emerald-400', card: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',   badge: 'bg-emerald-100 text-emerald-700' },
  OCCUPIED_M:  { label: 'รายเดือน', dot: 'bg-blue-400',    card: 'bg-blue-50 border-blue-200 hover:border-blue-400',           badge: 'bg-blue-100 text-blue-700' },
  OCCUPIED_D:  { label: 'รายวัน',   dot: 'bg-pink-400',   card: 'bg-pink-50 border-pink-200 hover:border-pink-400',           badge: 'bg-pink-100 text-pink-700' },
  MAINTENANCE: { label: 'ซ่อม',     dot: 'bg-gray-400',    card: 'bg-gray-100 border-gray-200 hover:border-gray-400',           badge: 'bg-gray-200 text-gray-600' },
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

  const statCounts = {
    total: rooms.length,
    available: rooms.filter(r => r.currentStatus === 'AVAILABLE').length,
    occupied: rooms.filter(r => r.currentStatus === 'OCCUPIED_M' || r.currentStatus === 'OCCUPIED_D').length,
    maintenance: rooms.filter(r => r.currentStatus === 'MAINTENANCE').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-white to-emerald-50 border border-sky-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">จัดการห้องพัก</h1>
              <p className="text-sm text-gray-500">ดูและจัดการสถานะห้องพักทั้งหมด</p>
            </div>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2" disabled={isLoading}>
            <Plus size={16} /> เพิ่มห้องพัก
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'ทั้งหมด',  value: statCounts.total,       icon: BedDouble,    color: 'text-gray-700',    bg: 'bg-gray-50',    border: 'border-gray-200' },
            { label: 'ว่าง',     value: statCounts.available,   icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            { label: 'มีผู้เช่า', value: statCounts.occupied,    icon: Building2,    color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' },
            { label: 'ซ่อม', value: statCounts.maintenance , icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl px-4 py-3 flex items-center gap-3`}>
              <s.icon size={18} className={s.color} />
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="ค้นหาเลขห้อง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 transition-colors bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 transition-colors bg-white text-gray-700"
        >
          <option value="all">สถานะทั้งหมด</option>
          <option value="AVAILABLE">ว่าง</option>
          <option value="OCCUPIED_M">รายเดือน</option>
          <option value="OCCUPIED_D">รายวัน</option>
          <option value="RESERVED">จอง</option>
          <option value="MAINTENANCE">ซ่อม</option>
        </select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(statusConfig) as [RoomStatus, typeof statusConfig[RoomStatus]][]).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
            <span className="text-xs text-gray-500">{cfg.label}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm">กำลังโหลดห้องพัก...</span>
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {Object.entries(roomsByFloor)
              .sort(([a], [b]) => (parseInt(b) || 0) - (parseInt(a) || 0))
              .map(([floor, floorRooms]) => (
                <div key={floor}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-base font-semibold text-gray-700">ชั้น {floor}</h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{floorRooms.length} ห้อง</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {floorRooms.map((room) => {
                      const cfg = statusConfig[room.currentStatus];
                      return (
                        <button
                          key={room.roomNumber}
                          onClick={() => handleEdit(room)}
                          className={`relative p-3 rounded-xl border-2 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 ${cfg.card}`}
                        >
                          <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${cfg.dot}`} />
                          <div className="text-xl font-bold text-gray-800 mb-1">{room.roomNumber}</div>
                          <div className="text-xs text-gray-500 truncate">{room.roomType?.typeName ?? '—'}</div>
                          <span className={`mt-1.5 inline-block text-xs px-1.5 py-0.5 rounded-md font-medium ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            {filteredRooms.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                <Building2 size={28} className="text-gray-200" />
                <p className="text-sm">ไม่พบห้องพัก</p>
              </div>
            )}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isAddMode ? 'เพิ่มห้องพัก' : `แก้ไขห้อง ${selectedRoom?.roomNumber}`}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                {([
                  { label: 'เลขห้อง', field: 'roomNumber', type: 'number', placeholder: 'เช่น 101', disabled: !isAddMode },
                  { label: 'ชั้น',    field: 'floor',       type: 'number', placeholder: 'เช่น 1',   disabled: false },
                ] as const).map(({ label, field, type, placeholder, disabled }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <Input
                      type={type}
                      value={formData[field]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [field]: e.target.value })}
                      placeholder={placeholder}
                      disabled={disabled}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ประเภทห้อง</label>
                  <select value={formData.typeId} onChange={(e) => setFormData({ ...formData, typeId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 transition-colors bg-white">
                    <option value="">เลือกประเภทห้อง</option>
                    {roomTypes.map((type) => (<option key={type.id} value={type.id}>{type.typeName}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ประเภทการเช่า</label>
                  <select value={formData.allowedType} onChange={(e) => setFormData({ ...formData, allowedType: e.target.value as AllowedType })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 transition-colors bg-white">
                    <option value="FLEXIBLE">ทั้งสองแบบ</option>
                    <option value="MONTHLY">รายเดือนเท่านั้น</option>
                    <option value="DAILY">รายวันเท่านั้น</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">สถานะห้อง</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(statusConfig) as [RoomStatus, typeof statusConfig[RoomStatus]][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, currentStatus: key })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                          formData.currentStatus === key
                            ? `border-current ${cfg.badge} font-semibold`
                            : 'border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={handleSave} className="flex-1">บันทึก</Button>
                  {!isAddMode && (
                    <Button onClick={() => { if (selectedRoom) { setConfirmData({ isOpen: true, roomNumber: selectedRoom.roomNumber }); setIsDialogOpen(false); } }} className="flex-1 bg-red-600 hover:bg-red-700">
                      <Trash2 size={15} className="mr-1.5" /> ลบ
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
