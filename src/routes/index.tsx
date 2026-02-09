import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Users from '../pages/UserManagement'
import MainLayout from '../component/MainLayout'
import { RoomTypes } from '../pages/RoomTypes'
import { RoomManagement } from '../pages/RoomManagement'
import { UtilityRates } from '../pages/UtilityRates'
import { CustomerManagement } from '../pages/CustomerManagement'
import { RoomCalendar } from '../pages/RoomCalendar'
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
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
        path: 'users',
        element: <Users />,
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
        path: 'ultily-management',
        element: <UtilityRates />,
      },
      {
        path: 'customers',
        element: <CustomerManagement />,
      },
      {
        path: 'room-calendar',
        element: <RoomCalendar />,
      },
    ],
  },
])
