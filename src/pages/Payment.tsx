import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Upload, X, CreditCard, Landmark, Wallet, Banknote } from 'lucide-react';
import { Button } from '../component/ui/button';
import { useToast } from '../context/ToastContext';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

interface Invoice {
  id: string;
  contractId: number;
  roomNumber: string;
  customerName: string;
  month: number;
  year: number;
  rent: number;
  electricityUnits: number;
  electricityAmount: number;
  waterUnits: number;
  waterAmount: number;
  otherAmount: number;
  total: number;
  status: 'PENDING' | 'PAID';
  createdAt: string;
}

type PaymentMethod = 'transfer' | 'promptpay' | 'cash' | 'card';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'transfer', label: 'โอนเงิน', icon: <Landmark size={24} />, desc: 'โอนผ่านธนาคาร' },
  { id: 'promptpay', label: 'พร้อมเพย์', icon: <Wallet size={24} />, desc: 'QR Code / เบอร์โทร' },
  { id: 'cash', label: 'เงินสด', icon: <Banknote size={24} />, desc: 'ชำระที่สำนักงาน' },
  { id: 'card', label: 'บัตรเครดิต/เดบิต', icon: <CreditCard size={24} />, desc: 'Visa / Mastercard' },
];

export const Payment: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [billsKey, setBillsKey] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;
    // Search across all stored billing keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('billing_invoices_')) continue;
      try {
        const invoices: Invoice[] = JSON.parse(localStorage.getItem(key) || '[]');
        const found = invoices.find((inv) => inv.id === invoiceId);
        if (found) {
          setInvoice(found);
          setBillsKey(key);
          if (found.status === 'PAID') setPaid(true);
          break;
        }
      } catch { /* skip */ }
    }
  }, [invoiceId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('ไฟล์ขนาดใหญ่เกินไป (สูงสุด 5MB)', 'error');
      return;
    }
    setSlipFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSlipPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirmPayment = () => {
    if (!invoice || !billsKey) return;
    if ((paymentMethod === 'transfer' || paymentMethod === 'promptpay') && !slipFile) {
      addToast('กรุณาแนบสลิปการโอนเงิน', 'error');
      return;
    }
    setIsPaying(true);
    setTimeout(() => {
      try {
        const invoices: Invoice[] = JSON.parse(localStorage.getItem(billsKey) || '[]');
        const updated = invoices.map((inv) =>
          inv.id === invoice.id ? { ...inv, status: 'PAID' as const } : inv
        );
        localStorage.setItem(billsKey, JSON.stringify(updated));
        setPaid(true);
        addToast('บันทึกการชำระเงินสำเร็จ', 'success');
      } catch {
        addToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
      } finally {
        setIsPaying(false);
      }
    }, 800);
  };

  const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-400 text-lg">ไม่พบใบแจ้งหนี้</p>
        <Button variant="outline" onClick={() => navigate('/billing')}>
          <ArrowLeft size={16} className="mr-2" /> กลับหน้าออกบิล
        </Button>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-5">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={44} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">ชำระเงินสำเร็จ</h2>
        <p className="text-gray-500">
          ใบแจ้งหนี้ <span className="font-medium text-gray-700">{invoice.id}</span><br />
          ห้อง {invoice.roomNumber} — {invoice.customerName}<br />
          ยอด <span className="font-bold text-green-600">{fmt(invoice.total)} บาท</span> ได้รับการบันทึกแล้ว
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => navigate('/billing')}>
            <ArrowLeft size={16} className="mr-2" /> กลับหน้าออกบิล
          </Button>
        </div>
      </div>
    );
  }

  const lineItems = [
    { label: 'ค่าเช่า', amount: invoice.rent },
    { label: `ค่าไฟฟ้า (${invoice.electricityUnits} หน่วย)`, amount: invoice.electricityAmount },
    { label: `ค่าน้ำประปา (${invoice.waterUnits} หน่วย)`, amount: invoice.waterAmount },
    ...(invoice.otherAmount > 0 ? [{ label: 'ค่าอื่นๆ', amount: invoice.otherAmount }] : []),
  ];

  const needSlip = paymentMethod === 'transfer' || paymentMethod === 'promptpay';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/billing')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} /> กลับหน้าออกบิล
      </button>

      <h1 className="text-2xl font-semibold">ชำระเงิน</h1>

      {/* Invoice summary */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">ใบแจ้งหนี้</p>
            <p className="font-mono text-sm font-medium text-gray-700">{invoice.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">เดือน</p>
            <p className="font-medium text-gray-700">{THAI_MONTHS[invoice.month]} {invoice.year}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-5 p-3 bg-blue-50 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700 text-sm">
            {invoice.roomNumber}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{invoice.customerName}</p>
            <p className="text-xs text-gray-500">ห้อง {invoice.roomNumber}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {lineItems.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium">{fmt(item.amount)}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 flex justify-between items-center">
          <span className="font-semibold text-gray-700">ยอดรวมทั้งหมด</span>
          <span className="text-2xl font-bold text-blue-600">{fmt(invoice.total)} <span className="text-sm font-normal text-gray-500">บาท</span></span>
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-gray-800 mb-4">เลือกวิธีการชำระเงิน</h2>
        <div className="grid grid-cols-2 gap-3">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setPaymentMethod(m.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                paymentMethod === m.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <span className={paymentMethod === m.id ? 'text-blue-600' : 'text-gray-400'}>
                {m.icon}
              </span>
              <div>
                <p className="font-medium text-sm">{m.label}</p>
                <p className="text-xs text-gray-400">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Slip upload */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">
            แนบหลักฐานการชำระเงิน
            {needSlip && <span className="text-red-500 ml-1">*</span>}
          </h2>
          {!needSlip && <span className="text-xs text-gray-400">ไม่บังคับสำหรับวิธีนี้</span>}
        </div>

        {slipPreview ? (
          <div className="relative inline-block">
            <img
              src={slipPreview}
              alt="สลิปการโอน"
              className="max-h-64 rounded-lg border object-cover"
            />
            <button
              onClick={() => { setSlipPreview(null); setSlipFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <Upload size={28} />
            <p className="text-sm font-medium">คลิกเพื่ออัปโหลดสลิป</p>
            <p className="text-xs">PNG, JPG สูงสุด 5MB</p>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Note */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-gray-800 mb-3">หมายเหตุ <span className="text-gray-400 font-normal text-sm">(ถ้ามี)</span></h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="เช่น โอนเงินเมื่อ 11 มีนาคม 2569 เวลา 10:30 น."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Confirm button */}
      <Button
        onClick={handleConfirmPayment}
        disabled={isPaying}
        className="w-full py-3 text-base flex items-center justify-center gap-2"
      >
        {isPaying ? (
          <span className="animate-pulse">กำลังบันทึก...</span>
        ) : (
          <>
            <CheckCircle size={18} />
            ยืนยันการชำระเงิน {fmt(invoice.total)} บาท
          </>
        )}
      </Button>
    </div>
  );
};

export default Payment;
