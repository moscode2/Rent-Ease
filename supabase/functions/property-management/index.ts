import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const method = req.method;

    switch (action) {
      case 'dashboard-stats':
        return await getDashboardStats(supabase, user.id);
      
      case 'properties':
        if (method === 'GET') {
          return await getProperties(supabase, user.id);
        } else if (method === 'POST') {
          const propertyData = await req.json();
          return await createProperty(supabase, user.id, propertyData);
        }
        break;

      case 'assign-tenant':
        if (method === 'POST') {
          const assignmentData = await req.json();
          return await assignTenant(supabase, user.id, assignmentData);
        }
        break;

      case 'rent-payments':
        if (method === 'GET') {
          return await getRentPayments(supabase, user.id);
        } else if (method === 'POST') {
          const paymentData = await req.json();
          return await recordPayment(supabase, user.id, paymentData);
        }
        break;

      case 'generate-rent-schedule':
        if (method === 'POST') {
          const scheduleData = await req.json();
          return await generateRentSchedule(supabase, user.id, scheduleData);
        }
        break;

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in property-management function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getDashboardStats(supabase: any, userId: string) {
  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (profile?.role === 'landlord') {
    // Landlord dashboard stats
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .eq('landlord_id', userId);

    const { data: activeLeases } = await supabase
      .from('tenant_properties')
      .select('id, monthly_rent')
      .eq('is_active', true)
      .in('property_id', properties?.map(p => p.id) || []);

    const { data: thisMonthPayments } = await supabase
      .from('rent_payments')
      .select('amount, status')
      .gte('due_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .lt('due_date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString())
      .in('tenant_property_id', activeLeases?.map(l => l.id) || []);

    const totalRentExpected = thisMonthPayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const totalRentCollected = thisMonthPayments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    return new Response(JSON.stringify({
      totalProperties: properties?.length || 0,
      activeLeases: activeLeases?.length || 0,
      totalRentExpected,
      totalRentCollected,
      pendingPayments: thisMonthPayments?.filter(p => p.status === 'pending').length || 0,
      overduePayments: thisMonthPayments?.filter(p => p.status === 'overdue').length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } else {
    // Tenant dashboard stats
    const { data: tenantProperties } = await supabase
      .from('tenant_properties')
      .select('id, monthly_rent, lease_end_date')
      .eq('tenant_id', userId)
      .eq('is_active', true);

    const { data: recentPayments } = await supabase
      .from('rent_payments')
      .select('*')
      .in('tenant_property_id', tenantProperties?.map(tp => tp.id) || [])
      .order('due_date', { ascending: false })
      .limit(6);

    return new Response(JSON.stringify({
      activeLeases: tenantProperties?.length || 0,
      nextPaymentDue: recentPayments?.find(p => p.status === 'pending')?.due_date,
      recentPayments: recentPayments?.slice(0, 5) || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getProperties(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (profile?.role === 'landlord') {
    const { data: properties } = await supabase
      .from('properties')
      .select(`
        *,
        tenant_properties(
          id,
          tenant_id,
          lease_start_date,
          lease_end_date,
          is_active,
          profiles(first_name, last_name, phone)
        )
      `)
      .eq('landlord_id', userId);

    return new Response(JSON.stringify(properties), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } else {
    const { data: tenantProperties } = await supabase
      .from('tenant_properties')
      .select(`
        *,
        properties(*)
      `)
      .eq('tenant_id', userId);

    return new Response(JSON.stringify(tenantProperties), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function createProperty(supabase: any, userId: string, propertyData: any) {
  const { data: property, error } = await supabase
    .from('properties')
    .insert({
      ...propertyData,
      landlord_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify(property), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function assignTenant(supabase: any, userId: string, assignmentData: any) {
  const { data: assignment, error } = await supabase
    .from('tenant_properties')
    .insert(assignmentData)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify(assignment), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getRentPayments(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  let query = supabase
    .from('rent_payments')
    .select(`
      *,
      tenant_properties(
        tenant_id,
        property_id,
        properties(name, address),
        profiles(first_name, last_name)
      )
    `);

  if (profile?.role === 'tenant') {
    const { data: tenantProperties } = await supabase
      .from('tenant_properties')
      .select('id')
      .eq('tenant_id', userId);

    query = query.in('tenant_property_id', tenantProperties?.map(tp => tp.id) || []);
  }

  const { data: payments } = await query.order('due_date', { ascending: false });

  return new Response(JSON.stringify(payments), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function recordPayment(supabase: any, userId: string, paymentData: any) {
  const { data: payment, error } = await supabase
    .from('rent_payments')
    .update({
      paid_date: new Date().toISOString(),
      status: 'paid',
      payment_method: paymentData.payment_method,
      transaction_id: paymentData.transaction_id,
      notes: paymentData.notes,
    })
    .eq('id', paymentData.payment_id)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify(payment), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateRentSchedule(supabase: any, userId: string, scheduleData: any) {
  const { tenant_property_id, start_date, months } = scheduleData;
  
  const payments = [];
  const startDate = new Date(start_date);

  for (let i = 0; i < months; i++) {
    const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
    
    payments.push({
      tenant_property_id,
      amount: scheduleData.monthly_rent,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending',
    });
  }

  const { data: createdPayments, error } = await supabase
    .from('rent_payments')
    .insert(payments)
    .select();

  if (error) throw error;

  return new Response(JSON.stringify(createdPayments), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}