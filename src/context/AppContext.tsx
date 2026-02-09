import React, { createContext, useContext, useState } from 'react';

export interface RoomType {
  id: string;
  name: string;
  dailyRate: number;
  monthlyRate: number;
  description?: string;
}

interface AppContextType {
  roomTypes: RoomType[];
  setRoomTypes: (types: RoomType[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([
    {
      id: 'RT-1',
      name: 'ห้องพัดลม',
      dailyRate: 300,
      monthlyRate: 8000,
      description: 'ห้องพัก พร้อมพัดลม',
    },
    {
      id: 'RT-2',
      name: 'ห้องแอร์',
      dailyRate: 500,
      monthlyRate: 12000,
      description: 'ห้องพัก พร้อมแอร์เย็น',
    },
  ]);

  return (
    <AppContext.Provider value={{ roomTypes, setRoomTypes }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
