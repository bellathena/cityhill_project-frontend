import React, { useState, useEffect } from "react";
import { Clock, Plus } from "lucide-react";
import { Button } from "../../component/ui/button";
import { CreateContractDialog } from "../../component/CreateContractDialog";
import { ContractTable } from "../../component/ContractTable";
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
  roomNumber: number;
  floor: number;
  typeId: number;
  allowedType: string;
  currentStatus: string;
  roomType?: { typeName: string; baseMonthlyRate: number };
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

type CustomerOption = Pick<Customer, "id" | "fullName" | "phone">;

export const ContractManagement: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  // Data states
  const [monthlyContracts, setMonthlyContracts] = useState<MonthlyContract[]>(
    [],
  );
  const [rooms, setRooms] = useState<Room[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    roomId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    depositAmount: "",
    advancePayment: "",
    monthlyRentRate: "",
  });

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [contractsRes, roomsRes, customersRes] = await Promise.all([
        api.get("/monthly-contracts"),
        api.get("/rooms"),
        api.get("/customers"),
      ]);

      setMonthlyContracts(contractsRes.data);
      setRooms(roomsRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      addToast("ไม่สามารถโหลดข้อมูลได้", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setShowCustomerDropdown(false);
    if (showCustomerDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showCustomerDropdown]);

  const activeContracts = monthlyContracts.filter(
    (c) => c.contractStatus === "ACTIVE",
  );
  const closedContracts = monthlyContracts.filter(
    (c) => c.contractStatus === "CLOSED",
  );

  const getRoom = (roomId: number) => {
    return rooms.find((r) => r.roomNumber === roomId);
  };

  const getCustomer = (customerId: number) => {
    return customers.find((c) => c.id === customerId);
  };

  // Available rooms for monthly contracts (MONTHLY or FLEXIBLE, and AVAILABLE)
  const availableRooms = rooms.filter(
    (r) =>
      (r.allowedType === "MONTHLY" || r.allowedType === "FLEXIBLE") &&
      r.currentStatus === "AVAILABLE",
  );

  const handleRoomChange = (roomNumber: string) => {
    const room = rooms.find((r) => r.roomNumber === Number(roomNumber));
    setForm((f) => ({
      ...f,
      roomId: roomNumber,
      monthlyRentRate: room?.roomType?.baseMonthlyRate
        ? String(room.roomType.baseMonthlyRate)
        : f.monthlyRentRate,
    }));
  };

  const handleCustomerSelect = (customer: CustomerOption) => {
    setForm((f) => ({ ...f, customerId: String(customer.id) }));
    setCustomerSearch(customer.fullName);
    setShowCustomerDropdown(false);
  };

  const filteredCustomers = customers
    .filter((c) =>
      c.fullName.toLowerCase().includes(customerSearch.toLowerCase()),
    )
    .slice(0, 10);

  const handleCreateContract = async () => {
    if (
      !form.customerId ||
      !form.roomId ||
      !form.startDate ||
      !form.monthlyRentRate
    ) {
      addToast("กรุณากรอกข้อมูลที่จำเป็นให้ครบ", "warning");
      return;
    }
    try {
      setCreating(true);
      await api.post("/monthly-contracts", {
        customerId: Number(form.customerId),
        roomId: Number(form.roomId),
        startDate: form.startDate,
        endDate: form.endDate || null,
        depositAmount: parseFloat(form.depositAmount) || 0,
        advancePayment: parseFloat(form.advancePayment) || 0,
        monthlyRentRate: parseFloat(form.monthlyRentRate) || 0,
      });
      addToast("สร้างสัญญาเช่าสำเร็จ", "success");
      setIsCreateOpen(false);
      setCustomerSearch("");
      setShowCustomerDropdown(false);
      setForm({
        customerId: "",
        roomId: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        depositAmount: "",
        advancePayment: "",
        monthlyRentRate: "",
      });
      fetchAllData();
    } catch (err: any) {
      addToast(
        err.response?.data?.error || "เกิดข้อผิดพลาดในการสร้างสัญญา",
        "error",
      );
    } finally {
      setCreating(false);
    }
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
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-white to-emerald-50 border border-sky-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">จัดการสัญญาเช่า</h1>
              <p className="text-sm text-gray-500">ตรวจสอบและอนุมัติสัญญาเช่าหอพัก City Hill</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="bg-white p-3 px-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                ใช้งานอยู่
              </p>
              <p className="text-2xl font-black text-emerald-500">
                {activeContracts.length}
              </p>
            </div>
            <Button
              onClick={() => {
                setForm({
                  customerId: "",
                  roomId: "",
                  startDate: new Date().toISOString().split("T")[0],
                  endDate: "",
                  depositAmount: "",
                  advancePayment: "",
                  monthlyRentRate: "",
                });
                setCustomerSearch("");
                setShowCustomerDropdown(false);
                setIsCreateOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus size={18} /> สร้างสัญญาใหม่
            </Button>
          </div>
        </div>
      </div>

      {/* Active Contracts */}
      <ContractTable
        contracts={activeContracts}
        title="สัญญาปัจจุบัน (Active)"
        emptyMessage="ไม่มีสัญญาที่รอดำเนินการในขณะนี้"
        accentColorClass="bg-emerald-400"
        getRoom={getRoom}
        getCustomer={getCustomer}
        formatDate={formatDate}
        onViewDetail={(contractId) => navigate(`/contracts/${contractId}`)}
      />

      {/* Closed Contracts */}
      <ContractTable
        contracts={closedContracts}
        title="สัญญาที่หมดไปแล้ว (Closed)"
        emptyMessage="ไม่มีสัญญาที่หมดไปแล้วในขณะนี้"
        accentColorClass="bg-red-400"
        getRoom={getRoom}
        getCustomer={getCustomer}
        formatDate={formatDate}
        onViewDetail={(contractId) => navigate(`/contracts/${contractId}`)}
      />

      {/* Create Contract Dialog */}
      <CreateContractDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setShowCustomerDropdown(false);
          }
        }}
        form={form}
        setForm={setForm}
        availableRooms={availableRooms}
        customerSearch={customerSearch}
        setCustomerSearch={setCustomerSearch}
        showCustomerDropdown={showCustomerDropdown}
        setShowCustomerDropdown={setShowCustomerDropdown}
        filteredCustomers={filteredCustomers}
        handleCustomerSelect={handleCustomerSelect}
        creating={creating}
        onRoomChange={handleRoomChange}
        onCreateContract={handleCreateContract}
      />
    </div>
  );
};
