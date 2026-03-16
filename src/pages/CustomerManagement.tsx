import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Users } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Input } from '../component/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, ConfirmDialog } from '../component/dialog';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

interface Customer {
  id: number;
  fullName: string;
  citizenId: string;
  address: string;
  phone: string;
  carLicense: string;
  createdAt: string;
  updatedAt: string;
}

export const CustomerManagement: React.FC = () => {
  const { addToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    customerId: number | null;
  }>({ isOpen: false, customerId: null });
  const [formData, setFormData] = useState({
    fullName: '',
    citizenId: '',
    address: '',
    phone: '',
    carLicense: '',
  });
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    citizenId?: string;
    phone?: string;
  }>({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      addToast('เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAddMode(true);
    setFormErrors({});
    setFormData({
      fullName: '',
      citizenId: '',
      address: '',
      phone: '',
      carLicense: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setIsAddMode(false);
    setSelectedCustomer(customer);
    setFormErrors({});
    setFormData({
      fullName: customer.fullName,
      citizenId: customer.citizenId,
      address: customer.address,
      phone: customer.phone,
      carLicense: customer.carLicense,
    });
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const errors: {
      fullName?: string;
      citizenId?: string;
      phone?: string;
    } = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'กรุณากรอกชื่อลูกค้า';
    }

    if (!formData.citizenId.trim()) {
      errors.citizenId = 'กรุณากรอกเลขบัตรประชาชน';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      addToast('ข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง กรุณาตรวจสอบช่องที่มีกรอบสีแดง', 'warning');
      return;
    }

    try {
      if (isAddMode) {
        await api.post('/customers', formData);
        addToast('เพิ่มลูกค้าสำเร็จ', 'success');
        setIsDialogOpen(false);
        fetchCustomers();
      } else if (selectedCustomer) {
        await api.put(`/customers/${selectedCustomer.id}`, formData);
        addToast('อัปเดตลูกค้าสำเร็จ', 'success');
        setIsDialogOpen(false);
        fetchCustomers();
      }
    } catch (error: any) {
      console.error('Error saving customer:', error);

      const responseError = error?.response?.data;
      const messageFromServer = responseError?.message || responseError?.error;

      addToast(messageFromServer || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  };

  const handleDelete = async (customerId: number) => {
    setConfirmData({ isOpen: true, customerId });
  };

  const handleConfirmDelete = async () => {
    if (confirmData.customerId) {
      try {
        await api.delete(`/customers/${confirmData.customerId}`);
        addToast('ลบลูกค้าสำเร็จ', 'success');
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        addToast('เกิดข้อผิดพลาดในการลบลูกค้า', 'error');
      } finally {
        setConfirmData({ isOpen: false, customerId: null });
      }
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.fullName.toLowerCase().includes(searchLower) ||
      customer.citizenId.includes(searchLower) ||
      customer.phone.includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-white to-emerald-50 border border-sky-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">จัดการลูกค้า</h1>
              <p className="text-sm text-gray-500">ดูและจัดการข้อมูลลูกค้าทั้งหมด</p>
            </div>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2" disabled={isLoading}>
            <Plus size={20} />
            เพิ่มลูกค้า
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="ค้นหาจากชื่อ, เลขบัตรประชาชน, หรือเบอร์โทร..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">กำลังโหลดข้อมูลลูกค้า...</div>
      ) : filteredCustomers.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ชื่อลูกค้า</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">เลขบัตรประชาชน</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">เบอร์โทรศัพท์</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ทะเบียนรถ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ที่อยู่</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.citizenId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.carLicense}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 truncate">{customer.address}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                          title="แก้ไข"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          ไม่พบลูกค้า คลิกปุ่ม "เพิ่มลูกค้า" เพื่อเริ่มต้น
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAddMode ? 'เพิ่มลูกค้า' : 'แก้ไขลูกค้า'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">ชื่อลูกค้า *</label>
              <Input
                value={formData.fullName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  if (formErrors.fullName) {
                    setFormErrors((prev) => ({ ...prev, fullName: undefined }));
                  }
                }}
                placeholder="เช่น ธนพล ใจดี"
                className={formErrors.fullName ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
              {formErrors.fullName && (
                <p className="mt-1 text-xs text-red-600">{formErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">เลขบัตรประชาชน *</label>
              <Input
                value={formData.citizenId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, citizenId: e.target.value });
                  if (formErrors.citizenId) {
                    setFormErrors((prev) => ({ ...prev, citizenId: undefined }));
                  }
                }}
                placeholder="เช่น 1234567890123"
                className={formErrors.citizenId ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
              {formErrors.citizenId && (
                <p className="mt-1 text-xs text-red-600">{formErrors.citizenId}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">เบอร์โทรศัพท์ *</label>
              <Input
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (formErrors.phone) {
                    setFormErrors((prev) => ({ ...prev, phone: undefined }));
                  }
                }}
                placeholder="เช่น 0891234567"
                className={formErrors.phone ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
              {formErrors.phone && (
                <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">ทะเบียนรถ</label>
              <Input
                value={formData.carLicense}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, carLicense: e.target.value })
                }
                placeholder="เช่น กข-1234"
              />
            </div>

            <div>
              <label className="text-sm font-medium">ที่อยู่</label>
              <textarea
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="เช่น 123/45 ถนนสุขสันต์ แขวงบางรัก เขตบางรัก กรุงเทพฯ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1">
                บันทึก
              </Button>
              <Button 
                onClick={() => setIsDialogOpen(false)} 
                variant="secondary"
                className="flex-1"
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmData.isOpen}
        title="ยืนยันการลบลูกค้า"
        description="คุณต้องการลบลูกค้านี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmData({ isOpen: false, customerId: null })}
      />
    </div>
  );
};
