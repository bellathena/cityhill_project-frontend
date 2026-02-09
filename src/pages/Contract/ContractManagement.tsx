import React, { useState, useEffect } from "react";
import { FileText, Trash2 } from "lucide-react";
import { Button } from "../../component/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../component/dialog";
import { useToast } from "../../context/ToastContext";
import api from "../../lib/axios";
import { useNavigate } from "react-router-dom";

interface Customer {
  id: number;
  fullName: string;
  phone: string;
  citizenId: string;
  address: string;
  carLicense: string;
}

interface Room {
  id: number;
  roomNumber: string;
  floor: number;
  typeId: number;
  currentStatus: string;
  pricePerDay?: number;
  pricePerMonth?: number;
}

interface RoomType {
  id: number;
  typeName: string;
  description: string;
  baseDailyRate: number;
  baseMonthlyRate: number;
}

interface MonthlyContract {
  id: number;
  customerId: number;
  roomId: number;
  startDate: string;
  endDate: string | null;
  depositAmount: number;
  advancePayment: number;
  monthlyRentRate: number;
  contractStatus: string;
}

export const ContractManagement: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  // Data states
  const [monthlyContracts, setMonthlyContracts] = useState<MonthlyContract[]>(
    [],
  );
  const [rooms, setRooms] = useState<Room[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] =
    useState<MonthlyContract | null>(null);

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [contractsRes, roomsRes, customersRes, typesRes] =
        await Promise.all([
          api.get("/monthly-contracts"),
          api.get("/rooms"),
          api.get("/customers"),
          api.get("/room-types"),
        ]);

      setMonthlyContracts(contractsRes.data);
      setRooms(roomsRes.data);
      setCustomers(customersRes.data);
      setRoomTypes(typesRes.data);
    } catch (error) {
      addToast("ไม่สามารถโหลดข้อมูลได้", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const pendingContracts = monthlyContracts.filter(
    (c) => c.contractStatus === "PENDING"
  );
  const activeContracts = monthlyContracts.filter(
    (c) => c.contractStatus === "ACTIVE",
  );
   const closedContracts = monthlyContracts.filter(
    (c) => c.contractStatus === "CLOSED",
  );


  const handleDeleteContract = (contract: MonthlyContract) => {
    setContractToDelete(contract);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contractToDelete) return;

    try {
      console.log("Deleting contract:", contractToDelete.id);
      await api.delete(`/monthly-contracts/${contractToDelete.id}`);
      addToast("ยกเลิกสัญญาสำเร็จ", "success");
      setIsDeleteDialogOpen(false);
      setContractToDelete(null);
      fetchAllData();
    } catch (error: any) {
      console.error("Delete error:", error);
      const errorMessage = error.response?.data?.message || error.message;
      addToast(`ไม่สามารถยกเลิกได้: ${errorMessage}`, "error");
    }
  };

  const getRoom = (roomId: number) => {
    return rooms.find((r) => r.id === roomId);
  };

  const getCustomer = (customerId: number) => {
    return customers.find((c) => c.id === customerId);
  };

  const getRoomType = (typeId: number) => {
    return roomTypes.find((t) => t.id === typeId);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="w-full space-y-8 p-4 md:p-8 animate-in fade-in duration-500 bg-slate-50/50">
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            จัดการสัญญาเช่า
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            ตรวจสอบและอนุมัติสัญญาเช่าหอพัก City Hill
          </p>
        </div>

        {/* สรุปยอดเล็กๆ (Status Mini Cards) */}
        <div className="flex gap-4">
          <div className="bg-white p-3 px-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              รอยืนยัน
            </p>
            <p className="text-2xl font-black text-amber-500">
              {pendingContracts.length}
            </p>
          </div>
          <div className="bg-white p-3 px-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              ใช้งานอยู่
            </p>
            <p className="text-2xl font-black text-emerald-500">
              {activeContracts.length}
            </p>
          </div>
        </div>
      </div>

      {/* --- ตารางที่ 1: สัญญาที่รอดำเนินการ (Pending) --- */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-amber-400 rounded-full" />
            <h2 className="text-lg font-bold text-slate-800">
              คำขอสัญญาใหม่ (รออนุมัติ)
            </h2>
          </div>
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
            {pendingContracts.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ห้อง
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ชื่อลูกค้า
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  วันที่จอง
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ค่าเช่า
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pendingContracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    ไม่มีสัญญาที่รอดำเนินการในขณะนี้
                  </td>
                </tr>
              ) : (
                pendingContracts.map((contract) => {
                  const room = getRoom(contract.roomId);
                  const customer = getCustomer(contract.customerId);
                  const roomType = room ? getRoomType(room.typeId) : null;
                  return (
                    <tr
                      key={contract.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                          {room?.roomNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {customer?.fullName}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {formatDate(contract.startDate)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {roomType?.baseMonthlyRate?.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          THB
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2  transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              navigate(`/contracts/${contract.id}`)
                            }
                            className="hover:bg-indigo-50 text-indigo-600 gap-1.5"
                          >
                            <FileText size={16} /> รายละเอียด
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteContract(contract)}
                            className="hover:bg-red-50 text-red-500 gap-1.5"
                          >
                            <Trash2 size={16} /> ยกเลิก
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Active Contracts */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-2 h-6 bg-emerald-400 rounded-full" />
          <h2 className="text-lg font-bold text-slate-800">
            สัญญาปัจจุบัน (Active)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50 bg-slate-50/20">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ห้อง
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ลูกค้า / เบอร์โทร
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  วันสิ้นสุดสัญญา
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ยอดชำระ/เดือน
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">{activeContracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    ไม่มีสัญญาที่รอดำเนินการในขณะนี้
                  </td>
                </tr>
              ) :
              activeContracts.map((contract) => {
                const room = getRoom(contract.roomId);
                const customer = getCustomer(contract.customerId);
                return (
                  <tr
                    key={contract.id}
                    className="hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-black text-slate-700">
                      {room?.roomNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {customer?.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {customer?.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">
                      {formatDate(contract.endDate)}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      ฿{contract.monthlyRentRate?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                          className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <FileText size={16} /> รายละเอียด
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Closed Contracts */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-2 h-6 bg-red-400 rounded-full" />
          <h2 className="text-lg font-bold text-slate-800">
            สัญญาที่หมดไปแล้ว (Active)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50 bg-slate-50/20">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ห้อง
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ลูกค้า / เบอร์โทร
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  วันสิ้นสุดสัญญา
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  ยอดชำระ/เดือน
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {closedContracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    ไม่มีสัญญาที่หมดไปแล้วในขณะนี้
                  </td>
                </tr>
              ) :
              closedContracts.map((contract) => {
                const room = getRoom(contract.roomId);
                const customer = getCustomer(contract.customerId);
                return (
                  <tr
                    key={contract.id}
                    className="hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-black text-slate-700">
                      {room?.roomNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {customer?.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {customer?.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">
                      {formatDate(contract.endDate)}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      ฿{contract.monthlyRentRate?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                          className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <FileText size={16} /> รายละเอียด
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยกเลิกสัญญาเช่า</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {contractToDelete && (
              <>
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ ยืนยันการยกเลิก
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    คุณต้องการยกเลิกสัญญาเช่า:
                    <br />
                    ห้อง {getRoom(contractToDelete.roomId)?.roomNumber} ของ{" "}
                    {getCustomer(contractToDelete.customerId)?.fullName}?
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleConfirmDelete}
                    variant="danger"
                    className="flex-1"
                  >
                    ยืนยันยกเลิก
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setContractToDelete(null);
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
