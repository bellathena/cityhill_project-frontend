import React, { useState, useEffect } from 'react';
import { Edit2, Save } from 'lucide-react';
import { Button } from '../component/ui/button';
import { Input } from '../component/ui/input';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

interface UtilityRate {
  id: number;
  electricityRate: string | number;
  waterRate: string | number;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

export const UtilityRates: React.FC = () => {
  const { addToast } = useToast();
  const [utilityRate, setUtilityRate] = useState<UtilityRate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    electricityRate: '',
    waterRate: '',
  });

  useEffect(() => {
    fetchUtilityRates();
  }, []);

  const fetchUtilityRates = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/utility-rates');
      if (data && data.length > 0) {
        setUtilityRate(data[0]);
        setFormData({
          electricityRate: data[0].electricityRate.toString(),
          waterRate: data[0].waterRate.toString(),
        });
      }
    } catch (error) {
      console.error('Error fetching utility rates:', error);
      addToast('เกิดข้อผิดพลาดในการโหลดข้อมูลอัตราค่าน้ำประปาและค่าไฟฟ้า', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (utilityRate) {
      setFormData({
        electricityRate: utilityRate.electricityRate.toString(),
        waterRate: utilityRate.waterRate.toString(),
      });
    }
  };

  const handleSave = async () => {
    try {
      if (utilityRate) {
        const updatedRate = {
          electricityRate: parseFloat(formData.electricityRate) || 0,
          waterRate: parseFloat(formData.waterRate) || 0,
        };

        await api.put(`/utility-rates/${utilityRate.id}`, updatedRate);
        setUtilityRate({
          ...utilityRate,
          electricityRate: updatedRate.electricityRate,
          waterRate: updatedRate.waterRate,
        });
        setIsEditing(false);
        addToast('บันทึกข้อมูลสำเร็จ', 'success');
      }
    } catch (error) {
      console.error('Error updating utility rates:', error);
      addToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (utilityRate) {
      setFormData({
        electricityRate: utilityRate.electricityRate.toString(),
        waterRate: utilityRate.waterRate.toString(),
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">จัดการค่าน้ำประปาและค่าไฟฟ้า</h1>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : utilityRate ? (
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">อัตราค่าบริการต่อหน่วย</h2>
              {!isEditing && (
                <Button
                  onClick={handleEdit}
                  className="flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  แก้ไข
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {/* Electric Rate */}
              <div className="p-6 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="font-medium">ค่าไฟฟ้า</h3>
                    <p className="text-sm text-gray-600">อัตราค่าไฟฟ้าต่อหน่วย</p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.electricityRate}
                      onChange={(e) =>
                        setFormData({ ...formData, electricityRate: e.target.value })
                      }
                      className="max-w-xs"
                    />
                    <span className="text-sm font-medium">บาท/หน่วย</span>
                  </div>
                ) : (
                  <div className="text-3xl font-semibold text-yellow-700">
                    {parseFloat(utilityRate.electricityRate.toString()).toFixed(2)} <span className="text-lg">บาท/หน่วย</span>
                  </div>
                )}

                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    • ราคานี้จะถูกใช้ในการคำนวณค่าไฟฟ้ารายเดือนของผู้เช่า
                  </p>
                  <p>• คำนวณจาก: (เลขมิเตอร์ปัจจุบัน - เลขมิเตอร์ก่อนหน้า) × ราคาต่อหน่วย</p>
                </div>
              </div>

              {/* Water Rate */}
              <div className="p-6 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💧</span>
                  </div>
                  <div>
                    <h3 className="font-medium">ค่าน้ำประปา</h3>
                    <p className="text-sm text-gray-600">อัตราค่าน้ำประปาต่อหน่วย</p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.waterRate}
                      onChange={(e) =>
                        setFormData({ ...formData, waterRate: e.target.value })
                      }
                      className="max-w-xs"
                    />
                    <span className="text-sm font-medium">บาท/หน่วย</span>
                  </div>
                ) : (
                  <div className="text-3xl font-semibold text-blue-700">
                    {parseFloat(utilityRate.waterRate.toString()).toFixed(2)} <span className="text-lg">บาท/หน่วย</span>
                  </div>
                )}

                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    • ราคานี้จะถูกใช้ในการคำนวณค่าน้ำประปารายเดือนของผู้เช่า
                  </p>
                  <p>• คำนวณจาก: (เลขมิเตอร์ปัจจุบัน - เลขมิเตอร์ก่อนหน้า) × ราคาต่อหน่วย</p>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 mt-6">
                <Button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2">
                  <Save size={16} />
                  บันทึก
                </Button>
                <Button variant="danger" onClick={handleCancel} className="flex-1">
                  ยกเลิก
                </Button>
              </div>
            )}
          </div>

          {/* Example Calculation */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-medium mb-4">ตัวอย่างการคำนวณ</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">ค่าไฟฟ้า</h3>
                <div className="text-sm space-y-1">
                  <p>• เลขมิเตอร์ครั้งก่อน: 1000 หน่วย</p>
                  <p>• เลขมิเตอร์ครั้งนี้: 1150 หน่วย</p>
                  <p>• จำนวนหน่วยที่ใช้: 150 หน่วย</p>
                  <p className="font-medium text-blue-600 mt-2">
                    • ค่าไฟฟ้า = 150 × {parseFloat(utilityRate.electricityRate.toString()).toFixed(2)} ={' '}
                    {(150 * parseFloat(utilityRate.electricityRate.toString())).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} บาท
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">ค่าน้ำประปา</h3>
                <div className="text-sm space-y-1">
                  <p>• เลขมิเตอร์ครั้งก่อน: 200 หน่วย</p>
                  <p>• เลขมิเตอร์ครั้งนี้: 225 หน่วย</p>
                  <p>• จำนวนหน่วยที่ใช้: 25 หน่วย</p>
                  <p className="font-medium text-blue-600 mt-2">
                    • ค่าน้ำประปา = 25 × {parseFloat(utilityRate.waterRate.toString()).toFixed(2)} ={' '}
                    {(25 * parseFloat(utilityRate.waterRate.toString())).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} บาท
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          ไม่พบข้อมูลอัตราค่าน้ำประปาและค่าไฟฟ้า
        </div>
      )}
    </div>
  );
};
