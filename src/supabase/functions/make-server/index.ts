import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Hono } from 'https://deno.land/x/hono@v3.1.0/mod.ts';
import { cors } from 'https://deno.land/x/hono@v3.1.0/middleware.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import all local service files from your project's directory structure
import { PaymentService } from './services/payment-service.ts';
import { DappService } from './services/dapp-service.ts';
import { AuthService } from './services/auth-service.ts';
import { Repository } from './repository.ts';
import { DenoKvStore } from './kv_store.ts';

// Initialize the Hono app
const app = new Hono();

// Enable CORS middleware
app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type'],
  }),
);

// Payment Routes
app.post('/payment/create-order', async (c) => {
  try {
    const { creditId, amount } = await c.req.json();
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: c.req.header('authorization')! } } },
    );

    const authService = new AuthService(supabaseClient);
    const authResult = await authService.authenticateUser(c.req);
    if (!authResult.success) {
      return c.json({ error: authResult.error }, authResult.status || 401);
    }
    const user = authResult.user;

    // Use the static method createPaymentIntent
    const order = await PaymentService.createPaymentIntent(creditId, amount, user.id);

    const repo = new Repository(supabaseClient);
    await repo.savePaymentOrder(order.id, creditId, user.id, amount);

    return c.json({ success: true, order });
  } catch (e: any) {
    console.error('Create Order Error:', e.message);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

app.post('/payment/webhook', async (c) => {
  try {
    const rawBody = await c.req.text();
    const signature = c.req.header('x-razorpay-signature');
    if (!signature) throw new Error('No signature provided');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: c.req.header('authorization')! } } },
    );

    // Use the static method verifyWebhook
    if (!PaymentService.verifyWebhook(rawBody, signature)) {
        return c.json({ error: 'Webhook signature verification failed' }, 400);
    }
    
    const payload = JSON.parse(rawBody).payload;
    if (payload.payment.entity.status === 'captured') {
        const paymentId = payload.payment.entity.id;
        const orderId = payload.payment.entity.order_id;

        const repo = new Repository(supabaseClient);
        const { creditId, buyerId, amount } = await repo.getPaymentOrderDetails(orderId);

        if (creditId && buyerId) {
            const dappService = new DappService(new DenoKvStore());
            const txHash = await dappService.mintCredits(buyerId, amount);

            await repo.updateUserBalance(buyerId, amount);
            await repo.updatePaymentOrderStatus(orderId, 'completed', paymentId, txHash);
        }
    }
    return c.json({ success: true });
  } catch (e: any) {
    console.error('Webhook Error:', e.message);
    return c.json({ error: 'Webhook processing failed' }, 400);
  }
});

// Existing Routes (Refactored to Hono)
app.get('/projects/manager-with-credits', async (c) => {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const authService = new AuthService(supabaseClient);
    const authResult = await authService.authenticateUser(c.req);
    if (!authResult.success) {
      return c.json({ error: authResult.error }, authResult.status || 401);
    }
    const user = authResult.user;

    const repo = new Repository(supabaseClient);
    const { projects, error } = await repo.getProjectsWithCredits(user.id);
    if (error) return c.json({ error: error.message }, 500);

    return c.json({ projects });
});

app.get('/projects', async (c) => {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const repo = new Repository(supabaseClient);
    const { projects, error } = await repo.getAllProjects();
    if (error) return c.json({ error: error.message }, 500);

    return c.json({ projects });
});

app.post('/projects', async (c) => {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const authService = new AuthService(supabaseClient);
    const authResult = await authService.authenticateUser(c.req);
    if (!authResult.success) {
      return c.json({ error: authResult.error }, authResult.status || 401);
    }
    const user = authResult.user;

    const body = await c.req.json();
    const repo = new Repository(supabaseClient);
    const { project, error } = await repo.createProject(user.id, body);
    if (error) return c.json({ error: error.message }, 500);

    return c.json({ project });
});

app.put('/projects/:projectId/verify', async (c) => {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const authService = new AuthService(supabaseClient);
    const authResult = await authService.authenticateUser(c.req);
    if (!authResult.success) {
      return c.json({ error: authResult.error }, authResult.status || 401);
    }
    const user = authResult.user;

    const { projectId } = c.req.param();
    const body = await c.req.json();
    const repo = new Repository(supabaseClient);
    const { project, error } = await repo.verifyProject(projectId, user.id, body);
    if (error) return c.json({ error: error.message }, 500);

    return c.json({ project });
});

serve(app.fetch);