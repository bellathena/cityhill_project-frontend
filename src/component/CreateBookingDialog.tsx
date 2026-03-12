import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

interface Room {
  roomNumber: number;
  floor: number;
  typeId: number;
  allowedType: string;
  currentStatus: string;
  roomType?: { typeName: string; baseDailyRate: number };
}

interface Customer {
  id: number;
  fullName: string;
  phone: string;
  citizenId: string;
}

interface FormData {
  customerId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: string;
  extraBedCount: string;
  totalAmount: string;
  paymentStatus: string;
  amountPaid: string;
}

interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  customers: Customer[];
  availableRooms: Room[];
  customerSearch: string;
  setCustomerSearch: React.Dispatch<React.SetStateAction<string>>;
  showCustomerDropdown: boolean;
  setShowCustomerDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  filteredCustomers: Customer[];
  handleCustomerSelect: (customer: Customer) => void;
  handleRoomChange: (roomNumber: string) => void;
  handleCreate: () => Promise<void>;
}

export const CreateBookingDialog: React.FC<CreateBookingDialogProps> = ({
  open,
  onOpenChange,
  form,
  setForm,
  customers,
  availableRooms,
  customerSearch,
  setCustomerSearch,
  showCustomerDropdown,
  setShowCustomerDropdown,
  filteredCustomers,
  handleCustomerSelect,
  handleRoomChange,
  handleCreate,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>สร้างการจองรายวัน</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">ลูกค้า *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="พิมพ์เพื่อค้นหาลูกค้า..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                  if (!e.target.value) {
                    setForm({ ...form, customerId: '' });
                  }
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div 
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0 border-gray-100"
                    >
                      <div className="font-medium">{customer.fullName}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </button>
                  ))}
                </div>
              )}
              {showCustomerDropdown && customerSearch && filteredCustomers.length === 0 && (
                <div 
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 text-gray-500 text-center">ไม่พบลูกค้าที่ค้นหา</div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">ห้องพัก *</label>
            <select value={form.roomId} onChange={(e) => handleRoomChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">เลือกห้องว่าง</option>
              {availableRooms.map((r) => (
                <option key={r.roomNumber} value={r.roomNumber}>
                  ห้อง {r.roomNumber} - {r.roomType?.typeName} ({r.roomType?.baseDailyRate?.toLocaleString()} บาท/คืน)
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">เช็คอิน *</label>
              <Input type="date" value={form.checkInDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, checkInDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">เช็คเอาท์ *</label>
              <Input type="date" value={form.checkOutDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, checkOutDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">จำนวนผู้เข้าพัก</label>
              <Input type="number" min="1" value={form.numGuests} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, numGuests: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">เตียงเสริม</label>
              <Input type="number" min="0" value={form.extraBedCount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, extraBedCount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">ราคารวม (บาท)</label>
            <Input type="number" value={form.totalAmount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, totalAmount: e.target.value })} placeholder="0" />
          </div>
          
          {/* Payment Section */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">การชำระเงิน</h3>
            <div>
              <label className="text-sm font-medium">สถานะการชำระ</label>
              <Select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as 'PAID' | 'PENDING' })}>
                <option value="PAID">ชำระเงินแล้ว</option>
                <option value="PENDING">รอชำระเงิน</option>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreate} className="w-full">บันทึก</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBookingDialog;