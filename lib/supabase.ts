import { createClient } from '@supabase/supabase-js';

// Estas URLs deben provenir de variables de entorno en producción
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqgftaqljwxyizdutvqh.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZ2Z0YXFsand4eWl6ZHV0dnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDc1NDYsImV4cCI6MjA2MjY4MzU0Nn0.Il_1YjbplVzWS5OVJjE664dWcfxHIWTziBfV9Uwc3vk';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Driver = {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  license_number: string;
  created_at: string;
};

export type Vehicle = {
  id: string;
  plate: string;
  model: string;
  year: number;
  status: 'active' | 'maintenance' | 'inactive';
  driver_id?: string;
  created_at: string;
};

export type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  driver_id: string;
  vehicle_id?: string;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
};

export type Advance = {
  id: string;
  amount: number;
  description: string;
  date: string;
  driver_id: string;
  status: 'pending' | 'settled' | 'cancelled';
  created_at: string;
};

export type Trip = {
  id: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  driver_id: string;
  vehicle_id: string;
  created_at: string;
}; 