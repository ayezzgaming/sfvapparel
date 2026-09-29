'use server';

import { getServiceSupabase } from '@/lib/supabase/serverClient';
import {
  OperatingExpense,
  FinancialTransaction,
  PnlSummary,
  ExpenseCategory,
  Order,
  FactoryJob,
} from '@/types/database';

function getDb() {
  const db = getServiceSupabase();
  if (!db) throw new Error('Pangkalan data Supabase tidak dapat disambung.');
  return db;
}

/**
 * ============================================================================
 * P&L SUMMARY & OVERALL FINANCIAL METRICS (REAL-TIME CALCULATION)
 * ============================================================================
 */

export async function getFinancialSummary(startDate?: string, endDate?: string): Promise<{
  success: boolean;
  data: PnlSummary;
  message?: string;
}> {
  try {
    // 1. Fetch Orders within date range
    let ordersQuery = getDb()
      .from('orders')
      .select('id, total_amount, total_quantity, payment_status, created_at');

    if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate);
    if (endDate) ordersQuery = ordersQuery.lte('created_at', endDate);

    const { data: orders, error: ordersErr } = await ordersQuery;
    if (ordersErr) throw ordersErr;

    // 2. Fetch Factory Jobs (COGS)
    let factoryQuery = getDb()
      .from('factory_jobs')
      .select('id, total_quantity, cost_per_unit, total_factory_cost, customer_price_total, gross_profit, created_at');

    if (startDate) factoryQuery = factoryQuery.gte('created_at', startDate);
    if (endDate) factoryQuery = factoryQuery.lte('created_at', endDate);

    const { data: factoryJobs, error: factoryErr } = await factoryQuery;
    if (factoryErr) throw factoryErr;

    // 3. Fetch Operating Expenses (OPEX & Ads Spend)
    let expensesQuery = getDb()
      .from('operating_expenses')
      .select('id, category, amount, expense_date');

    if (startDate) expensesQuery = expensesQuery.gte('expense_date', startDate);
    if (endDate) expensesQuery = expensesQuery.lte('expense_date', endDate);

    const { data: expenses, error: expensesErr } = await expensesQuery;
    if (expensesErr) throw expensesErr;

    // Calculation logic
    const total_orders_count = orders?.length || 0;
    const total_units_sold = (orders || []).reduce((sum, o) => sum + (Number(o.total_quantity) || 0), 0);
    const gross_revenue = (orders || []).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    // Total COGS from Factory Jobs (or estimated from orders if no factory job yet)
    const total_cogs = (factoryJobs || []).reduce((sum, f) => sum + (Number(f.total_factory_cost) || 0), 0);

    const gross_profit = gross_revenue - total_cogs;
    const gross_margin_percent = gross_revenue > 0 ? (gross_profit / gross_revenue) * 100 : 0;

    // Ads Spend vs General OPEX separation
    const adsCategories: ExpenseCategory[] = ['ads_meta', 'ads_google', 'ads_tiktok'];
    const total_ads_spend = (expenses || [])
      .filter((e) => adsCategories.includes(e.category as ExpenseCategory))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const total_opex = (expenses || [])
      .filter((e) => !adsCategories.includes(e.category as ExpenseCategory))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const total_all_expenses = total_ads_spend + total_opex;
    const net_profit = gross_profit - total_all_expenses;
    const net_margin_percent = gross_revenue > 0 ? (net_profit / gross_revenue) * 100 : 0;
    const avg_profit_per_unit = total_units_sold > 0 ? net_profit / total_units_sold : 0;

    return {
      success: true,
      data: {
        gross_revenue: Math.round(gross_revenue * 100) / 100,
        total_cogs: Math.round(total_cogs * 100) / 100,
        gross_profit: Math.round(gross_profit * 100) / 100,
        gross_margin_percent: Math.round(gross_margin_percent * 10) / 10,
        total_ads_spend: Math.round(total_ads_spend * 100) / 100,
        total_opex: Math.round(total_opex * 100) / 100,
        net_profit: Math.round(net_profit * 100) / 100,
        net_margin_percent: Math.round(net_margin_percent * 10) / 10,
        total_orders_count,
        total_units_sold,
        avg_profit_per_unit: Math.round(avg_profit_per_unit * 100) / 100,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat menjana ringkasan P&L.';
    return {
      success: false,
      data: {
        gross_revenue: 0,
        total_cogs: 0,
        gross_profit: 0,
        gross_margin_percent: 0,
        total_ads_spend: 0,
        total_opex: 0,
        net_profit: 0,
        net_margin_percent: 0,
        total_orders_count: 0,
        total_units_sold: 0,
        avg_profit_per_unit: 0,
      },
      message: msg,
    };
  }
}

/**
 * ============================================================================
 * OPERATING EXPENSES (GLOBAL OPEX & ADS SPEND) SERVER ACTIONS
 * ============================================================================
 */

export async function getOperatingExpenses(): Promise<{ success: boolean; data: OperatingExpense[]; message?: string }> {
  try {
    const { data, error } = await getDb()
      .from('operating_expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat senarai perbelanjaan.';
    return { success: false, data: [], message: msg };
  }
}

export async function saveOperatingExpense(expense: Partial<OperatingExpense>): Promise<{ success: boolean; data?: OperatingExpense; message?: string }> {
  try {
    const amount = Number(expense.amount) || 0;
    const expense_date = expense.expense_date || new Date().toISOString().split('T')[0];

    const payload = {
      category: expense.category || 'general_opex',
      title: expense.title,
      amount,
      expense_date,
      payment_method: expense.payment_method || 'bank_transfer',
      vendor_merchant: expense.vendor_merchant || null,
      receipt_attachment_url: expense.receipt_attachment_url || null,
      notes: expense.notes || null,
      updated_at: new Date().toISOString(),
    };

    if (expense.id) {
      const { data, error } = await getDb()
        .from('operating_expenses')
        .update(payload)
        .eq('id', expense.id)
        .select('*')
        .single();
      if (error) throw error;
      return { success: true, data };
    } else {
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const expense_number = `EXP-${year}-${randomSuffix}`;

      const { data, error } = await getDb()
        .from('operating_expenses')
        .insert({
          ...payload,
          expense_number,
        })
        .select('*')
        .single();
      if (error) throw error;

      // Also record as an outflow in financial_transactions
      await getDb().from('financial_transactions').insert({
        transaction_number: `TRX-EXP-${randomSuffix}`,
        transaction_type: 'opex_expense',
        category: expense.category?.startsWith('ads_') ? 'ads_spend' : 'operating_expense',
        expense_id: data.id,
        amount,
        payment_method: expense.payment_method || 'bank_transfer',
        status: 'completed',
        description: `Bayaran: ${expense.title} (${expense.vendor_merchant || 'Vendor'})`,
        receipt_url: expense.receipt_attachment_url || null,
        transaction_date: new Date().toISOString(),
      });

      return { success: true, data };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan perbelanjaan.';
    return { success: false, message: msg };
  }
}

export async function deleteOperatingExpense(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await getDb()
      .from('operating_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memadam perbelanjaan.';
    return { success: false, message: msg };
  }
}

/**
 * ============================================================================
 * FINANCIAL TRANSACTIONS LEDGER ACTIONS
 * ============================================================================
 */

export async function getFinancialTransactions(): Promise<{ success: boolean; data: FinancialTransaction[]; message?: string }> {
  try {
    const { data, error } = await getDb()
      .from('financial_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat lejar transaksi.';
    return { success: false, data: [], message: msg };
  }
}

/**
 * ============================================================================
 * RECEIVABLES (A/R) & PAYABLES (A/P) ACTIONS
 * ============================================================================
 */

export async function getCustomerReceivables(): Promise<{
  success: boolean;
  data: Array<{
    order: Order;
    totalAmount: number;
    depositPaid: number;
    balancePending: number;
    dueDate?: string;
  }>;
  totalReceivable: number;
  message?: string;
}> {
  try {
    const { data: orders, error } = await getDb()
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter orders where full payment is not yet collected (e.g. deposit_paid / balance_pending)
    const receivables = (orders || [])
      .filter((o) => o.payment_status === 'deposit_paid' || o.payment_status === 'deposit_pending' || o.payment_status === 'unpaid')
      .map((o) => {
        const totalAmount = Number(o.total_amount) || 0;
        const depositPaid = o.payment_status === 'deposit_paid' ? totalAmount * 0.5 : 0;
        const balancePending = totalAmount - depositPaid;
        return {
          order: o,
          totalAmount,
          depositPaid,
          balancePending,
          dueDate: o.created_at,
        };
      });

    const totalReceivable = receivables.reduce((sum, r) => sum + r.balancePending, 0);

    return {
      success: true,
      data: receivables,
      totalReceivable: Math.round(totalReceivable * 100) / 100,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat senarai penghutang / baki.';
    return { success: false, data: [], totalReceivable: 0, message: msg };
  }
}

export async function getFactoryPayables(): Promise<{
  success: boolean;
  data: Array<{
    job: FactoryJob;
    totalCost: number;
    paymentStatus: string;
  }>;
  totalPayable: number;
  message?: string;
}> {
  try {
    const { data: jobs, error } = await getDb()
      .from('factory_jobs')
      .select(`
        *,
        factory:partner_factories(*),
        order:orders(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const payables = (jobs || [])
      .filter((j) => j.factory_payment_status !== 'fully_paid')
      .map((j) => ({
        job: j,
        totalCost: Number(j.total_factory_cost) || 0,
        paymentStatus: j.factory_payment_status || 'unpaid',
      }));

    const totalPayable = payables.reduce((sum, p) => sum + p.totalCost, 0);

    return {
      success: true,
      data: payables,
      totalPayable: Math.round(totalPayable * 100) / 100,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat senarai hutang kilang.';
    return { success: false, data: [], totalPayable: 0, message: msg };
  }
}

/**
 * Mark an order's remaining balance as collected and record an inflow transaction
 */
export async function markOrderBalanceCollected(
  orderId: string,
  amountCollected: number,
  paymentMethod: string = 'online_banking',
  receiptUrl?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data: order, error: orderErr } = await getDb()
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) throw new Error('Pesanan tidak dijumpai.');

    // Update order payment status
    const { error: updateErr } = await getDb()
      .from('orders')
      .update({
        payment_status: 'fully_paid',
        payment_method: paymentMethod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) throw updateErr;

    // Record inflow transaction in financial_transactions
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    await getDb().from('financial_transactions').insert({
      transaction_number: `TRX-IN-${randomSuffix}`,
      transaction_type: 'customer_payment',
      category: 'order_balance',
      order_id: orderId,
      amount: amountCollected,
      payment_method: paymentMethod,
      status: 'completed',
      description: `Kutipan Baki Penuh Pesanan #${order.order_number || orderId.slice(0, 8)} (${order.customer_name})`,
      receipt_url: receiptUrl || null,
      transaction_date: new Date().toISOString(),
    });

    return { success: true, message: 'Baki pesanan berjaya direkodkan sebagai dibayar penuh.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengemaskini baki pesanan.';
    return { success: false, message: msg };
  }
}

/**
 * Mark a factory job cost as paid and record an outflow transaction
 */
export async function markFactoryJobPaid(
  jobId: string,
  amountPaid: number,
  paymentMethod: string = 'bank_transfer',
  receiptUrl?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data: job, error: jobErr } = await getDb()
      .from('factory_jobs')
      .select('*, factory:partner_factories(*)')
      .eq('id', jobId)
      .single();

    if (jobErr || !job) throw new Error('Job sheet kilang tidak dijumpai.');

    // Update factory job payment status
    const { error: updateErr } = await getDb()
      .from('factory_jobs')
      .update({
        factory_payment_status: 'fully_paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateErr) throw updateErr;

    // Record outflow transaction in financial_transactions
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const factoryName = job.factory?.factory_name || 'Kilang Rakan Kongsi';
    await getDb().from('financial_transactions').insert({
      transaction_number: `TRX-OUT-FAC-${randomSuffix}`,
      transaction_type: 'factory_payout',
      category: 'cogs_sublimation',
      factory_job_id: jobId,
      amount: amountPaid,
      payment_method: paymentMethod,
      status: 'completed',
      description: `Bayaran Kos Kilang: Job #${job.job_number} (${factoryName})`,
      receipt_url: receiptUrl || null,
      transaction_date: new Date().toISOString(),
    });

    return { success: true, message: 'Bayaran kos kilang berjaya direkodkan.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengemaskini bayaran kilang.';
    return { success: false, message: msg };
  }
}

