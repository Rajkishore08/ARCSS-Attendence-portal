import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, Branch } from '../types';
import { api } from '../services/api';

interface AppContextType {
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  availableMonths: string[];
  availableDates: string[];
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  selectedBranchDetailsId: string | null;
  setSelectedBranchDetailsId: (id: string | null) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  branches: Branch[];
  syncStatus: any;
  isSyncing: boolean;
  refreshData: () => void;
  refreshKey: number;
  triggerManualSync: (branchId?: string) => Promise<void>;
  navigateToEmployee: (employeeId: string) => void;
  navigateToBranch: (branchId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-03');
  const [availableMonths, setAvailableMonths] = useState<string[]>(['2026-10', '2026-09']);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>('nmc-trichy_abdul_azees');
  const [selectedBranchDetailsId, setSelectedBranchDetailsId] = useState<string | null>('nmc-trichy');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    api.getBranches()
      .then(b => setBranches(b))
      .catch(err => console.error('Failed to load branches:', err));

    api.getSyncStatus()
      .then(s => setSyncStatus(s))
      .catch(err => console.error('Failed to load sync status:', err));

    api.getDatesMeta()
      .then(meta => {
        if (meta.availableMonths && meta.availableMonths.length > 0) {
          setAvailableMonths(meta.availableMonths);
          if (!meta.availableMonths.includes(selectedMonth)) {
            setSelectedMonth(meta.currentMonth || meta.availableMonths[0]);
          }
        }
        if (meta.availableDates) {
          setAvailableDates(meta.availableDates);
        }
        if (meta.latestLoggedDate) {
          setSelectedDate(meta.latestLoggedDate);
        }
      })
      .catch(err => console.error('Failed to load dates metadata:', err));
  }, [refreshKey]);

  const handleSetSelectedMonth = (month: string) => {
    setSelectedMonth(month);
    // Find the best date in this month
    const matchingDates = availableDates.filter(d => d.startsWith(month));
    if (matchingDates.length > 0) {
      if (!selectedDate.startsWith(month)) {
        // Find latest date in this month
        setSelectedDate(matchingDates[0]);
      }
    } else {
      setSelectedDate(`${month}-01`);
    }
  };

  const triggerManualSync = async (branchId?: string) => {
    setIsSyncing(true);
    try {
      if (branchId) {
        await api.triggerSyncBranch(branchId);
      } else {
        await api.triggerSyncAll();
      }
      const updatedStatus = await api.getSyncStatus();
      setSyncStatus(updatedStatus);
      refreshData();
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const navigateToEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    navigate(`/employees/${employeeId}`);
  };

  const navigateToBranch = (branchId: string) => {
    setSelectedBranchDetailsId(branchId);
    navigate(`/branches/${branchId}`);
  };

  return (
    <AppContext.Provider
      value={{
        selectedBranch,
        setSelectedBranch,
        selectedMonth,
        setSelectedMonth: handleSetSelectedMonth,
        selectedDate,
        setSelectedDate,
        availableMonths,
        availableDates,
        userRole,
        setUserRole,
        selectedEmployeeId,
        setSelectedEmployeeId,
        selectedBranchDetailsId,
        setSelectedBranchDetailsId,
        globalSearch,
        setGlobalSearch,
        branches,
        syncStatus,
        isSyncing,
        refreshData,
        refreshKey,
        triggerManualSync,
        navigateToEmployee,
        navigateToBranch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
