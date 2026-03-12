import { useEffect, useState } from 'react';
import { Home, Users, FileText, Clock, Receipt } from 'lucide-react';
import api from '../lib/axios';

interface Stats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  activeContracts: number;
  pendingInvoices: number;
  totalCustomers: number;
  dailyBookings: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalRooms: 0, availableRooms: 0, occupiedRooms: 0,
    activeContracts: 0, pendingInvoices: 0, totalCustomers: 0, dailyBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [roomsRes, contractsRes, invoicesRes, customersRes, bookingsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/monthly-contracts'),
          api.get('/invoices'),
          api.get('/customers'),
          api.get('/daily-bookings'),
        ]);
        const rooms = roomsRes.data || [];
        const contracts = contractsRes.data || [];
        const invoices = invoicesRes.data || [];
        const customers = customersRes.data || [];
        const bookings = bookingsRes.data || [];

        setStats({
          totalRooms: rooms.length,
          availableRooms: rooms.filter((r: any) => r.currentStatus === 'AVAILABLE').length,
          occupiedRooms: rooms.filter((r: any) => r.currentStatus === 'OCCUPIED_M' || r.currentStatus === 'OCCUPIED_D').length,
          activeContracts: contracts.filter((c: any) => c.contractStatus === 'ACTIVE').length,
          pendingInvoices: invoices.filter((i: any) => i.paymentStatus === 'PENDING').length,
          totalCustomers: customers.length,
          dailyBookings: bookings.filter((b: any) => b.bookingStatus === 'PENDING' || b.bookingStatus === 'STAYED').length,
        });
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">กำลังโหลด...</div>;

  const cards = [
    { label: 'ห้องทั้งหมด', value: stats.totalRooms, icon: Home, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: 'ห้องว่าง', value: stats.availableRooms, icon: Home, color: 'bg-green-500', bg: 'bg-green-50' },
    { label: 'ห้องมีผู้เช่า', value: stats.occupiedRooms, icon: Home, color: 'bg-orange-500', bg: 'bg-orange-50' },
    { label: 'สัญญาที่ใช้งาน', value: stats.activeContracts, icon: FileText, color: 'bg-indigo-500', bg: 'bg-indigo-50' },
    { label: 'ใบแจ้งหนี้รอชำระ', value: stats.pendingInvoices, icon: Receipt, color: 'bg-amber-500', bg: 'bg-amber-50' },
    { label: 'ลูกค้าทั้งหมด', value: stats.totalCustomers, icon: Users, color: 'bg-purple-500', bg: 'bg-purple-50' },
    { label: 'การเช่ารายวัน', value: stats.dailyBookings, icon: Clock, color: 'bg-teal-500', bg: 'bg-teal-50' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">แผงควบคุม</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.bg} rounded-xl p-5 flex items-center gap-4`}>
              <div className={`w-12 h-12 ${card.color} rounded-full flex items-center justify-center`}>
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
