import React, { useState, useEffect } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '../../component/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../component/dialog';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/axios';
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()
  // Data states
  const [monthlyContracts, setMonthlyContracts] = useState<MonthlyContract[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<MonthlyContract | null>(null);

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [contractsRes, roomsRes, customersRes, typesRes] = await Promise.all([
        api.get('/monthly-contracts'),
        api.get('/rooms'),
        api.get('/customers'),
        api.get('/room-types'),
      ]);

      setMonthlyContracts(contractsRes.data);
      setRooms(roomsRes.data);
      setCustomers(customersRes.data);
      setRoomTypes(typesRes.data);
    } catch (error) {
      addToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const pendingContracts = monthlyContracts.filter((c) => c.contractStatus !== 'ACTIVE');
  const activeContracts = monthlyContracts.filter((c) => c.contractStatus === 'ACTIVE');

  const handleApproveContract = async (contractId: number) => {
    try {
      console.log('Approving contract:', contractId);
      await api.put(`/monthly-contracts/${contractId}`, {
        contractStatus: 'ACTIVE',
      });
      addToast('อนุมัติสัญญาสำเร็จ', 'success');
      fetchAllData();
    } catch (error: any) {
      console.error('Approve error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      addToast(`ไม่สามารถอนุมัติได้: ${errorMessage}`, 'error');
    }
  };

  const handleDeleteContract = (contract: MonthlyContract) => {
    setContractToDelete(contract);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contractToDelete) return;

    try {
      console.log('Deleting contract:', contractToDelete.id);
      await api.delete(`/monthly-contracts/${contractToDelete.id}`);
      addToast('ยกเลิกสัญญาสำเร็จ', 'success');
      setIsDeleteDialogOpen(false);
      setContractToDelete(null);
      fetchAllData();
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      addToast(`ไม่สามารถยกเลิกได้: ${errorMessage}`, 'error');
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
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">จัดการสัญญาเช่า</h1>

      {/* Pending Contracts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">รอทำสัญญา</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">เลขห้อง</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ลูกค้า</th>
                <th className="px-4 py-3 text-left text-sm font-medium">วันที่จอง</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ค่าเช่า/เดือน</th>
                <th className="px-4 py-3 text-left text-sm font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pendingContracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    ไม่มีสัญญาที่รอดำเนินการ
                  </td>
                </tr>
              ) : (
                pendingContracts.map((contract) => {
                  const room = getRoom(contract.roomId);
                  const customer = getCustomer(contract.customerId);
                  const roomType = room ? getRoomType(room.typeId) : null;
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{room?.roomNumber}</td>
                      <td className="px-4 py-3">{customer?.fullName}</td>
                      <td className="px-4 py-3">{formatDate(contract.startDate)}</td>
                      <td className="px-4 py-3">
                        {(roomType?.baseMonthlyRate || 0).toLocaleString()} บาท
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveContract(contract.id)}
                            className="flex items-center gap-1"
                          >
                            <FileText size={16} />
                            ยืนยัน
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteContract(contract)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            ยกเลิก
                          </Button>
                             <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate(`/contracts/${contract.id}`)}
                                className="flex items-center gap-1"
                              >
                                <FileText size={16} />
                                ดูรายละเอียด
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
      </div>

      {/* Active Contracts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">สัญญาที่มีผล</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">เลขห้อง</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ลูกค้า</th>
                <th className="px-4 py-3 text-left text-sm font-medium">เบอร์โทร</th>
                <th className="px-4 py-3 text-left text-sm font-medium">วันเริ่มสัญญา</th>
                <th className="px-4 py-3 text-left text-sm font-medium">วันสิ้นสุด</th>
                <th className="px-4 py-3 text-left text-sm font-medium">เงินมัดจำ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ค่าเช่า/เดือน</th>
                <th className="px-4 py-3 text-left text-sm font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    ไม่มีสัญญาที่มีผล
                  </td>
                </tr>
              ) : (
                activeContracts.map((contract) => {
                  const room = getRoom(contract.roomId);
                  const customer = getCustomer(contract.customerId);
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{room?.roomNumber}</td>
                      <td className="px-4 py-3">{customer?.fullName}</td>
                      <td className="px-4 py-3">{customer?.phone}</td>
                      <td className="px-4 py-3">{formatDate(contract.startDate)}</td>
                      <td className="px-4 py-3">{formatDate(contract.endDate)}</td>
                      <td className="px-4 py-3">{contract.depositAmount.toLocaleString()} บาท</td>
                      <td className="px-4 py-3">{contract.monthlyRentRate.toLocaleString()} บาท</td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteContract(contract)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 size={16} />
                          ยกเลิก
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  <p className="text-sm text-red-800 font-medium">⚠️ ยืนยันการยกเลิก</p>
                  <p className="text-sm text-red-700 mt-2">
                    คุณต้องการยกเลิกสัญญาเช่า:<br />
                    ห้อง {getRoom(contractToDelete.roomId)?.roomNumber} ของ{' '}
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
