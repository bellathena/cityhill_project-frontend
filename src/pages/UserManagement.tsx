import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Input } from '../component/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, ConfirmDialog } from '../component/dialog';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  phone?: string;
  email?: string;
}

export const UserManagement: React.FC = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'STAFF',
    phone: '',
    email: '',
  });
  const [confirmData, setConfirmData] = useState<{ isOpen: boolean; userId: number | null }>({
    isOpen: false,
    userId: null,
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/users');
      setUsers(data);
    } catch {
      addToast('ไม่สามารถโหลดข้อมูลผู้ใช้ได้', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAddMode(true);
    setSelectedUser(null);
    setFormData({ username: '', password: '', fullName: '', role: 'STAFF', phone: '', email: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setIsAddMode(false);
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName,
      role: user.role,
      phone: user.phone || '',
      email: user.email || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.username.trim() || !formData.fullName.trim()) {
        addToast('กรุณากรอกชื่อผู้ใช้และชื่อ-นามสกุล', 'warning');
        return;
      }
      if (isAddMode) {
        if (!formData.password || formData.password.length < 6) {
          addToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'warning');
          return;
        }
        await api.post('/users', formData);
        addToast('เพิ่มผู้ใช้สำเร็จ', 'success');
      } else if (selectedUser) {
        const payload: Record<string, string> = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${selectedUser.id}`, payload);
        addToast('อัปเดตผู้ใช้สำเร็จ', 'success');
      }
      setIsDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmData.userId) return;
    try {
      await api.delete(`/users/${confirmData.userId}`);
      addToast('ลบผู้ใช้สำเร็จ', 'success');
      fetchUsers();
    } catch {
      addToast('ไม่สามารถลบผู้ใช้ได้', 'error');
    } finally {
      setConfirmData({ isOpen: false, userId: null });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">จัดการผู้ใช้งาน</h1>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus size={20} /> เพิ่มผู้ใช้
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ชื่อผู้ใช้</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ชื่อ-นามสกุล</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">บทบาท</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">เบอร์โทร</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">อีเมล</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{user.username}</td>
                  <td className="px-6 py-4 text-sm">{user.fullName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role === 'ADMIN' ? 'ผู้ดูแล' : 'พนักงาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(user)} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"><Edit2 size={16} /></button>
                      <button onClick={() => setConfirmData({ isOpen: true, userId: user.id })} className="p-2 hover:bg-red-100 rounded-lg text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">ไม่มีผู้ใช้งาน</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAddMode ? 'เพิ่มผู้ใช้' : 'แก้ไขผู้ใช้'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">ชื่อผู้ใช้ *</label>
              <Input value={formData.username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value })} placeholder="username" />
            </div>
            <div>
              <label className="text-sm font-medium">รหัสผ่าน {isAddMode ? '*' : '(เว้นว่างหากไม่เปลี่ยน)'}</label>
              <Input type="password" value={formData.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })} placeholder={isAddMode ? 'อย่างน้อย 6 ตัวอักษร' : 'เว้นว่างหากไม่เปลี่ยน'} />
            </div>
            <div>
              <label className="text-sm font-medium">ชื่อ-นามสกุล *</label>
              <Input value={formData.fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fullName: e.target.value })} placeholder="ชื่อ-นามสกุล" />
            </div>
            <div>
              <label className="text-sm font-medium">บทบาท</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="STAFF">พนักงาน</option>
                <option value="ADMIN">ผู้ดูแล</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">เบอร์โทร</label>
              <Input value={formData.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })} placeholder="0812345678" />
            </div>
            <div>
              <label className="text-sm font-medium">อีเมล</label>
              <Input value={formData.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <Button onClick={handleSave} className="w-full">บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={confirmData.isOpen}
        title="ยืนยันการลบผู้ใช้"
        description="คุณต้องการลบผู้ใช้นี้หรือไม่?"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        isDangerous
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmData({ isOpen: false, userId: null })}
      />
    </div>
  );
};
