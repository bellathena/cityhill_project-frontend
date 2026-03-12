import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import Dashboard from '../pages/Dashboard'
import MainLayout from '../component/MainLayout'
import UtilityUsage from '../pages/UtilityUsage'
import Billing from '../pages/Billing'
import Payment from '../pages/Payment'
import { RoomTypes } from '../pages/RoomTypes'
import { RoomManagement } from '../pages/RoomManagement'
import { UtilityRates } from '../pages/UtilityRates'
import { CustomerManagement } from '../pages/CustomerManagement'
import { ContractManagement } from '../pages/Contract/ContractManagement'
import { DailyRental } from '../pages/Daily/DailyRental'
import ContractDetail from '../pages/Contract/ContractDetail'
import DailyDetail from '../pages/Daily/DailyDetail'
import { UserManagement } from '../pages/UserManagement'
import { MoveOutSettlement } from '../pages/MoveOutSettlement'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'room-types',
        element: <RoomTypes />,
      },
      {
        path: 'room-management',
        element: <RoomManagement />,
      },
      {
        path: 'utility-management',
        element: <UtilityRates />,
      },
      {
        path: 'customers',
        element: <CustomerManagement />,
      },
      {
        path: 'contracts',
        element: <ContractManagement />,
      },
      {
        path: 'contracts/:contractId',
        element: <ContractDetail />,
      },
      {
        path:'daily-rental',
        element: <DailyRental />
      },
         {
        path:'daily-rental/:rentalId',
        element: <DailyDetail />
      },
      {
        path: 'utility-usage',
        element: <UtilityUsage />,
      },
      {
        path: 'billing',
        element: <Billing />,
      },
      {
        path: 'billing/payment/:invoiceId',
        element: <Payment />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
      {
        path: 'move-out-settlements',
        element: <MoveOutSettlement />,
      },
    ],
  },
])
