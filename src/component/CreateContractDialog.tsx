import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";

interface CustomerOption {
  id: number;
  fullName: string;
  phone: string;
}

interface RoomOption {
  roomNumber: number;
  floor: number;
  roomType?: { typeName: string; baseMonthlyRate: number };
}

interface ContractFormData {
  customerId: string;
  roomId: string;
  startDate: string;
  endDate: string;
  depositAmount: string;
  advancePayment: string;
  monthlyRentRate: string;
}

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ContractFormData;
  setForm: React.Dispatch<React.SetStateAction<ContractFormData>>;
  availableRooms: RoomOption[];
  customerSearch: string;
  setCustomerSearch: React.Dispatch<React.SetStateAction<string>>;
  showCustomerDropdown: boolean;
  setShowCustomerDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  filteredCustomers: CustomerOption[];
  handleCustomerSelect: (customer: CustomerOption) => void;
  creating: boolean;
  onRoomChange: (roomNumber: string) => void;
  onCreateContract: () => void;
}

export const CreateContractDialog: React.FC<CreateContractDialogProps> = ({
  open,
  onOpenChange,
  form,
  setForm,
  availableRooms,
  customerSearch,
  setCustomerSearch,
  showCustomerDropdown,
  setShowCustomerDropdown,
  filteredCustomers,
  handleCustomerSelect,
  creating,
  onRoomChange,
  onCreateContract,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>สร้างสัญญาเช่าใหม่</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-slate-700">ลูกค้า *</label>
            <div className="relative mt-1">
              <input
                type="text"
                placeholder="พิมพ์เพื่อค้นหาลูกค้า..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                  if (!e.target.value) {
                    setForm({ ...form, customerId: "" });
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
            <label className="text-sm font-medium text-slate-700">ห้องพัก *</label>
            <select
              value={form.roomId}
              onChange={(e) => onRoomChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">เลือกห้องว่าง</option>
              {availableRooms.map((r) => (
                <option key={r.roomNumber} value={r.roomNumber}>
                  ห้อง {r.roomNumber} - {r.roomType?.typeName ?? `ชั้น ${r.floor}`} ({r.roomType?.baseMonthlyRate?.toLocaleString() ?? "?"} บาท/เดือน)
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">วันเริ่มสัญญา *</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">วันสิ้นสุดสัญญา</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, endDate: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">ค่าเช่ารายเดือน (บาท) *</label>
            <Input
              type="number"
              min="0"
              value={form.monthlyRentRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, monthlyRentRate: e.target.value })
              }
              placeholder="0"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">เงินมัดจำ (บาท)</label>
              <Input
                type="number"
                min="0"
                value={form.depositAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, depositAmount: e.target.value })
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">ค่าเช่าล่วงหน้า (บาท)</label>
              <Input
                type="number"
                min="0"
                value={form.advancePayment}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, advancePayment: e.target.value })
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
          <Button onClick={onCreateContract} disabled={creating} className="w-full">
            {creating ? "กำลังบันทึก..." : "สร้างสัญญา"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};