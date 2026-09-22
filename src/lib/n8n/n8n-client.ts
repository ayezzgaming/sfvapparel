/**
 * n8n Automation Engine Client
 * Handles communication between Next.js, n8n (Port 5678), and WAHA
 */

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://187.127.223.53:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://187.127.223.53:5678/webhook';

export interface N8nHealthStatus {
  online: boolean;
  url: string;
  latencyMs: number;
  message?: string;
  timestamp: string;
}

export interface N8nWorkflowTriggerResult {
  success: boolean;
  workflowId?: string;
  data?: unknown;
  error?: string;
}

/**
 * Check health and responsiveness of the n8n container
 */
export async function checkN8nHealth(): Promise<N8nHealthStatus> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${N8N_BASE_URL}/healthz`, {
      signal: controller.signal,
      cache: 'no-store',
    }).catch(async () => {
      // Fallback: probe root
      return await fetch(N8N_BASE_URL, {
        signal: controller.signal,
        cache: 'no-store',
      });
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (res.ok || res.status === 200 || res.status === 401) {
      return {
        online: true,
        url: N8N_BASE_URL,
        latencyMs,
        message: 'Enjin automasi n8n aktif dan sedia memproses aliran kerja.',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      online: false,
      url: N8N_BASE_URL,
      latencyMs,
      message: `n8n membalas dengan status HTTP ${res.status}`,
      timestamp: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Gagal menyambung ke n8n';
    return {
      online: false,
      url: N8N_BASE_URL,
      latencyMs,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Trigger an n8n webhook workflow with payload
 */
export async function triggerN8nWorkflow(
  webhookPath: string,
  payload: Record<string, unknown>
): Promise<N8nWorkflowTriggerResult> {
  try {
    const cleanPath = webhookPath.replace(/^\/+/, '');
    const targetUrl = `${N8N_WEBHOOK_URL}/${cleanPath}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (N8N_API_KEY) {
      headers['X-N8N-API-KEY'] = N8N_API_KEY;
    }

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...payload,
        triggeredAt: new Date().toISOString(),
        source: 'sfv_apparel_web',
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        success: false,
        error: `n8n webhook ralat (${res.status}): ${errText || res.statusText}`,
      };
    }

    const data = await res.json().catch(() => ({ message: 'Workflow triggered successfully' }));
    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat mencetuskan aliran kerja n8n';
    return {
      success: false,
      error,
    };
  }
}

/**
 * Trigger 24-Hour Deposit & Quotation Follow-up Workflow
 */
export async function triggerOrderFollowupCheck(): Promise<N8nWorkflowTriggerResult> {
  return triggerN8nWorkflow('order-followup', {
    action: 'CHECK_PENDING_DEPOSITS',
    thresholdHours: 24,
  });
}

/**
 * Trigger Staff Production Alert
 */
export async function triggerStaffProductionAlert(orderData: {
  orderNumber: string;
  customerName: string;
  status: string;
  itemCount: number;
  totalAmount: number;
}): Promise<N8nWorkflowTriggerResult> {
  return triggerN8nWorkflow('staff-production-alert', {
    action: 'PRODUCTION_STATUS_UPDATE',
    order: orderData,
  });
}

/**
 * Trigger 50% Balance Due Reminder Workflow
 */
export async function triggerBalanceDueReminder(orderData: {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  balance_amount: number;
  payment_status: string;
}): Promise<N8nWorkflowTriggerResult> {
  return triggerN8nWorkflow('balance-due-reminder', {
    action: 'BALANCE_DUE_ALERT',
    order: orderData,
  });
}

/**
 * Trigger Post-Delivery Customer Review & Coupon Workflow
 */
export async function triggerPostDeliveryReviewCheck(): Promise<N8nWorkflowTriggerResult> {
  return triggerN8nWorkflow('trigger-post-delivery-review', {
    action: 'CHECK_POST_DELIVERY_REVIEWS',
  });
}

