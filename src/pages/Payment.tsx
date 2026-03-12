import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Input } from '../component/ui/input';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

interface ApiInvoice {
  id: number;
  monthlyContractId: number;
  invoiceDate: string;
  dueDate: string;
  grandTotal: number;
  paymentStatus: string;
  monthlyContract?: {
    id: number;
    roomId: number;
    monthlyRentRate: number;
    customer?: { fullName: string; phone: string };
    room?: { roomNumber: number };
  };
  payments?: { id: number; amountPaid: number; paymentMethod: string; paymentDate: string }[];
}

const Payment: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<ApiInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    paymentMethod: 'CASH',
    amountPaid: '',
    slipImage: '',
  });

  useEffect(() => {
    if (!invoiceId) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/invoices/${invoiceId}`);
        setInvoice(data);
        setForm((f) => ({ ...f, amountPaid: String(data.grandTotal) }));
      } catch {
        addToast('ไม่พบใบแจ้งหนี้', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [invoiceId]);

  const handlePay = async () => {
    if (!invoice) return;
    const amount = parseFloat(form.amountPaid);
    if (!amount || amount <= 0) {
      addToast('กรุณากรอกจำนวนเงิน', 'warning');
      return;
    }
    try {
      setSubmitting(true);
      // Create payment record
      await api.post('/payments', {
        invoiceId: invoice.id,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: form.paymentMethod,
        amountPaid: amount,
        slipImage: form.slipImage || undefined,
      });
      // Mark invoice as PAID
      await api.put(`/invoices/${invoice.id}`, { paymentStatus: 'PAID' });
      addToast('บันทึกการชำระเงินสำเร็จ', 'success');
      navigate('/billing');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <div className="p-6 text-center text-gray-500">กำลังโหลด...</div>;
  if (!invoice) return <div className="p-6 text-center text-red-500">ไม่พบใบแจ้งหนี้</div>;

  const contract = invoice.monthlyContract;
  const totalPaid = (invoice.payments || []).reduce((s, p) => s + p.amountPaid, 0);
  const remaining = invoice.grandTotal - totalPaid;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-semibold">ชำระเงิน</h1>
          <p className="text-sm text-gray-500">ใบแจ้งหนี้ #{invoice.id}</p>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">รายละเอียดใบแจ้งหนี้</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">ห้อง: </span><strong>{contract?.room?.roomNumber}</strong></div>
          <div><span className="text-gray-500">ผู้เช่า: </span><strong>{contract?.customer?.fullName}</strong></div>
          <div><span className="text-gray-500">วันออกบิล: </span>{formatDate(invoice.invoiceDate)}</div>
          <div><span className="text-gray-500">วันครบกำหนด: </span>{formatDate(invoice.dueDate)}</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg flex justify-between items-center">
          <span className="font-medium text-blue-700">ยอดรวม</span>
          <span className="text-2xl font-bold text-blue-800">{fmt(invoice.grandTotal)} บาท</span>
        </div>
        {totalPaid > 0 && (
          <div className="p-3 bg-green-50 rounded-lg flex justify-between items-center text-sm">
            <span className="text-green-700">ชำระแล้ว</span>
            <span className="font-bold text-green-700">{fmt(totalPaid)} บาท</span>
          </div>
        )}
        {remaining > 0 && remaining !== invoice.grandTotal && (
          <div className="p-3 bg-amber-50 rounded-lg flex justify-between items-center text-sm">
            <span className="text-amber-700">คงเหลือ</span>
            <span className="font-bold text-amber-700">{fmt(remaining)} บาท</span>
          </div>
        )}
      </div>

      {/* Existing Payments */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-lg border-b pb-2 mb-4">ประวัติการชำระ</h2>
          <div className="space-y-2">
            {invoice.payments.map((p) => (
              <div key={p.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                <span>{formatDate(p.paymentDate)} - {p.paymentMethod === 'CASH' ? 'เงินสด' : p.paymentMethod === 'TRANSFER' ? 'โอนเงิน' : 'บัตรเครดิต'}</span>
                <span className="font-semibold">{fmt(p.amountPaid)} บาท</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Form */}
      {invoice.paymentStatus !== 'PAID' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-semibold text-lg border-b pb-2">บันทึกการชำระเงิน</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วิธีชำระ</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CASH">เงินสด</option>
              <option value="TRANSFER">โอนเงิน</option>
              <option value="CREDIT_CARD">บัตรเครดิต</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน (บาท)</label>
            <Input
              type="number"
              value={form.amountPaid}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, amountPaid: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>
          {form.paymentMethod === 'TRANSFER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL สลิปโอนเงิน (ถ้ามี)</label>
              <Input
                value={form.slipImage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, slipImage: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}
          <Button onClick={handlePay} disabled={submitting} className="w-full flex items-center justify-center gap-2">
            <CheckCircle size={18} />
            {submitting ? 'กำลังบันทึก...' : 'บันทึกการชำระเงิน'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Payment;
