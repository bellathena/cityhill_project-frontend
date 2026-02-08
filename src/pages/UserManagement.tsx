import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Shield, User, X } from "lucide-react";
import api from "../lib/axios";

// Types
interface SystemUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: "STAFF" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role: "STAFF" | "ADMIN";
}

export default function UserManagement() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteUser = async (user: SystemUser) => {
    if (confirm(`ต้องการลบผู้ใช้ ${user.fullName} ใช่หรือไม่?`)) {
      try {
        await api.delete(`/users/${user.id}`);
        alert("ลบผู้ใช้สำเร็จ!");
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("เกิดข้อผิดพลาดในการลบผู้ใช้");
      }
    }
  };

  const handleSave = () => {
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">จัดการผู้ใช้</h1>
          <p className="text-gray-500 mt-1">
            จัดการบัญชีผู้ใช้งานในระบบ ({users.length} บัญชี)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          เพิ่มผู้ใช้ใหม่
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหรืออีเมล..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  ผู้ใช้
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  บทบาท
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  วันที่สร้าง
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  เบอร์โทร
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.role === "ADMIN"
                            ? "bg-purple-100"
                            : "bg-blue-100"
                        }`}
                      >
                        {user.role === "ADMIN" ? (
                          <Shield className="w-5 h-5 text-purple-600" />
                        ) : (
                          <User className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.fullName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "พนักงาน"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(user.createdAt).toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {user.phone}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              ไม่พบผู้ใช้ที่ค้นหา
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingUser) && (
        <UserFormModal
          user={editingUser}
          onClose={() => {
            setShowAddModal(false);
            setEditingUser(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function UserFormModal({
  user,
  onClose,
  onSave,
}: {
  user: SystemUser | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<FormData>({
    username: user?.username || "",
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
    role: user?.role || "STAFF",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Update - ส่งเฉพาะ field ที่อนุญาต (ไม่ส่ง password, id, createdAt, updatedAt)
        const updateData = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        };
        await api.put(`/users/${user.id}`, updateData);
        alert("อัปเดตข้อมูลผู้ใช้สำเร็จ!");
      } else {
        // Create - ต้องมี password
        if (!formData.password) {
          alert("กรุณากรอกรหัสผ่าน");
          setLoading(false);
          return;
        }
        const createData = {
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        };
        await api.post("/users", createData);
        alert("เพิ่มผู้ใช้ใหม่สำเร็จ!");
      }
      onSave();
      onClose();
    } catch (error: any) {
      console.error("Full Error:", error);
      console.error("Error Response:", error?.response);
      console.error("Error Data:", error?.response?.data);
      const errorMsg = error?.response?.data?.message || error?.message || "เกิดข้อผิดพลาด!";
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {user ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!user}
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่าน
              </label>
              <input
                type="password"
                value={formData.password || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="กรอกรหัสผ่านสำหรับผู้ใช้ใหม่"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              อีเมล
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              บทบาท
            </label>
            <select
              value={formData.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormData({ ...formData, role: e.target.value as "STAFF" | "ADMIN" })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="STAFF">พนักงาน</option>
              <option value="ADMIN">ผู้ดูแลระบบ</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "กำลังบันทึก..." : user ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มผู้ใช้"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
