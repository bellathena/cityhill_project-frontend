import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../lib/axios";
import {
  FileText,
  ArrowLeft,
  User,
  Home,
  Wallet,
  Calendar,
  MapPin,
  Phone,
  CreditCard,
} from "lucide-react";
import { Button } from "../../component/ui/button";
import { useReactToPrint } from "react-to-print";
import ContractPdf from "../../component/ContractPdf";

const ContractDetail = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: contract ? `contract-${contract.id}` : "contract",
  });

  useEffect(() => {
    if (!contractId) return;
    api
      .get(`/monthly-contracts/${contractId}`)
      .then((res) => setContract(res.data))
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [contractId]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 animate-pulse text-slate-500">
        กำลังโหลดข้อมูลสัญญา...
      </div>
    );
  if (!contract)
    return (
      <div className="p-10 text-center text-red-500 bg-red-50 rounded-lg border border-red-100 m-6">
        ไม่พบข้อมูลสัญญาเช่าในระบบ
      </div>
    );

  const {
    id,
    startDate,
    endDate,
    depositAmount,
    advancePayment,
    monthlyRentRate,
    contractStatus,
    customer,
    room,
  } = contract;

  const formatDate = (date?: string | null) =>
    date
      ? new Date(date).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "-";

  const statusStyles =
    {
      ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
      PENDING: "bg-amber-50 text-amber-700 border-amber-200",
      CLOSED: "bg-slate-50 text-slate-700 border-slate-200",
    }[contractStatus as "ACTIVE" | "PENDING" | "CLOSED"] ||
    "bg-gray-50 text-gray-700";

  return (
    <div className="w-full space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
      {/* --- Top Action Bar --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">สัญญา #{id}</h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${statusStyles}`}
              >
                {contractStatus}
              </span>
            </div>
            <p className="text-slate-500 text-sm italic">
              สร้างเมื่อ: {formatDate(startDate)}
            </p>
          </div>
        </div>

        <Button
          onClick={() => handlePrint()}
          className="bg-blue-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-2 px-6"
        >
          <FileText size={18} />
          พิมพ์เอกสารสัญญา
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Left Column: Contract & Customer Info --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* ข้อมูลผู้เช่า */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
              <User size={18} className="text-indigo-600" />
              <h2 className="font-semibold text-slate-800">
                ข้อมูลผู้เช่าสัญญานี้
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <InfoItem
                label="ชื่อ-นามสกุล"
                value={customer.fullName}
                icon={<User size={14} />}
              />
              <InfoItem
                label="เบอร์โทรศัพท์"
                value={customer.phone}
                icon={<Phone size={14} />}
              />
              <InfoItem
                label="เลขบัตรประชาชน"
                value={customer.citizenId}
                icon={<CreditCard size={14} />}
              />
              <InfoItem
                label="ทะเบียนรถ"
                value={customer.carLicense || "ไม่ระบุ"}
              />
              <div className="md:col-span-2">
                <InfoItem
                  label="ที่อยู่ตามทะเบียนบ้าน"
                  value={customer.address}
                  icon={<MapPin size={14} />}
                />
              </div>
            </div>
          </section>

          {/* รายละเอียดระยะเวลา */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              <h2 className="font-semibold text-slate-800">ระยะเวลาเช่า</h2>
            </div>
            <div className="p-6 flex flex-wrap gap-12">
              <InfoItem label="วันเริ่มสัญญา" value={formatDate(startDate)} />
              <div className="hidden md:block border-r border-slate-100"></div>
              <InfoItem label="วันสิ้นสุดสัญญา" value={formatDate(endDate)} />
            </div>
          </section>
        </div>

        {/* --- Right Column: Room & Finance --- */}
        <div className="space-y-6">
          {/* ข้อมูลห้องพัก */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm italic">
            <div className="bg-blue-600 px-6 py-3 flex items-center gap-2">
              <Home size={18} className="text-white" />
              <h2 className="font-semibold text-white">ยูนิตห้องพัก</h2>
            </div>
            <div className="p-6 space-y-4 bg-slate-50/50">
              <div className="flex justify-between items-end border-b border-dashed border-slate-200 pb-2">
                <span className="text-slate-500 text-sm">เลขห้อง</span>
                <span className="text-xl font-bold text-indigo-700">
                  {room.roomNumber}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">ชั้น</span>
                <span className="font-medium text-slate-800">{room.floor}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">ประเภท</span>
                <span className="font-medium text-slate-800">
                  {room.allowedType}
                </span>
              </div>
            </div>
          </section>

          {/* ข้อมูลการเงิน */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
              <Wallet size={18} className="text-blue-500" />
              <h2 className="font-semibold text-slate-800">สรุปค่าใช้จ่าย</h2>
            </div>
            <div className="p-6 space-y-4">
              <PriceRow
                label="ค่าเช่ารายเดือน"
                amount={monthlyRentRate}
                isTotal
              />
              <div className="pt-2 space-y-2 border-t border-slate-100">
                <PriceRow label="เงินมัดจำ (Deposit)" amount={depositAmount} />
                <PriceRow label="ค่าเช่าล่วงหน้า" amount={advancePayment} />
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                    ยอดรวมแรกเข้า
                  </span>
                  <span className="text-lg font-black text-blue-800">
                    {(depositAmount + advancePayment).toLocaleString()}.-
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Hidden Print Content */}
      <div className="hidden">
        <ContractPdf ref={printRef} contract={contract} />
      </div>
    </div>
  );
};

// --- Helper Components เพื่อความโปร ---

const InfoItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 text-slate-400">
      {icon}
      <span className="text-[11px] uppercase font-bold tracking-wider">
        {label}
      </span>
    </div>
    <p className="text-slate-700 font-medium">{value || "-"}</p>
  </div>
);

const PriceRow = ({
  label,
  amount,
  isTotal = false,
}: {
  label: string;
  amount: number;
  isTotal?: boolean;
}) => (
  <div className="flex justify-between items-center">
    <span
      className={`${isTotal ? "text-slate-800 font-bold" : "text-slate-500 text-sm"}`}
    >
      {label}
    </span>
    <span
      className={`${isTotal ? "text-lg font-bold text-slate-900" : "text-slate-700 font-semibold text-sm"}`}
    >
      {amount?.toLocaleString()}{" "}
      <span className="text-[10px] font-normal text-slate-400">THB</span>
    </span>
  </div>
);

export default ContractDetail;
