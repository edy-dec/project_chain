import { useState, useEffect, useCallback } from 'react';
import attendanceService from '../../../services/attendanceService';
import leaveService from '../../../services/leaveService';
import salaryService from '../../../services/salaryService';

const now = new Date();

export const useEmployeeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [monthlyAtt, setMonthlyAtt] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [todayAtt, setTodayAtt] = useState(null);
  const [weekAtt, setWeekAtt] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const [attRes, balRes, salRes, todayRes, histRes] = await Promise.all([
        attendanceService.getMyMonthly(year, month).catch(() => null),
        leaveService.getMyBalance().catch(() => null),
        salaryService.getMySalaries({ limit: 6 }).catch(() => null),
        attendanceService.getToday().catch(() => null),
        attendanceService.getMyHistory({ limit: 7, page: 1 }).catch(() => null),
      ]);

      const attData = attRes?.data?.data;
      setMonthlyAtt(attData?.summary || null);
      setLeaveBalance(balRes?.data?.data?.balance || null);

      const sals = salRes?.data?.data;
      setSalaries(Array.isArray(sals) ? sals : []);

      setTodayAtt(todayRes?.data?.data?.attendance || null);
      setWeekAtt(histRes?.data?.data || []);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { monthlyAtt, leaveBalance, salaries, todayAtt, weekAtt, loading, refresh: fetchData };
};
