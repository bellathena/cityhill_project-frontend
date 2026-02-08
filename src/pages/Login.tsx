import React, { useState } from 'react'
import { Building2 } from "lucide-react";
const login = () => {
 const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // const user = authStore.login(email, password);
    // if (user) {
    //   navigate("/");
    // } else {
    //   setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    // }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-full mb-4">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">City Hill Apartment</h1>
          <p className="text-gray-500 mt-2">ระบบจัดการหอพัก</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              อีเมล
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@cityhill.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">Demo Accounts:</p>
          <div className="mt-3 space-y-2 text-xs text-gray-600">
            <p className="bg-gray-50 p-2 rounded">
              <strong>Admin:</strong> admin@cityhill.com / admin123
            </p>
            <p className="bg-gray-50 p-2 rounded">
              <strong>Staff:</strong> staff@cityhill.com / staff123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default login
