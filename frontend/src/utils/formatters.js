import { MONTHS_RO } from '../constants';
import { format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try { return format(parseISO(dateStr), 'dd MMM yyyy', { locale: ro }); }
  catch { return dateStr; }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try { return format(parseISO(dateStr), 'dd MMM yyyy HH:mm'); }
  catch { return dateStr; }
};

export const formatTime = (dateStr) => {
  if (!dateStr) return '-';
  try { return format(parseISO(dateStr), 'HH:mm'); }
  catch { return dateStr; }
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', minimumFractionDigits: 2 }).format(amount);
};

export const formatHours = (hours) => {
  if (!hours) return '0h 0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

export const monthLabel = (month, year) => `${MONTHS_RO[month - 1]} ${year}`;

export const getInitials = (firstName, lastName) =>
  `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();

export const classNames = (...classes) => classes.filter(Boolean).join(' ');
