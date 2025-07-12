import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { Resend } from "npm:resend@4.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
      case 'send-rent-reminder':
        if (method === 'POST') {
          const reminderData = await req.json();
          return await sendRentReminder(supabase, reminderData);
        }
        break;

      case 'send-payment-confirmation':
        if (method === 'POST') {
          const confirmationData = await req.json();
          return await sendPaymentConfirmation(supabase, confirmationData);
        }
        break;

      case 'send-lease-expiry-notice':
        if (method === 'POST') {
          const noticeData = await req.json();
          return await sendLeaseExpiryNotice(supabase, noticeData);
        }
        break;

      case 'check-overdue-payments':
        if (method === 'POST') {
          return await checkOverduePayments(supabase);
        }
        break;

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in notifications function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendRentReminder(supabase: any, reminderData: any) {
  const { tenant_property_id, days_until_due } = reminderData;

  // Get tenant and property details
  const { data: tenantProperty, error } = await supabase
    .from('tenant_properties')
    .select(`
      monthly_rent,
      profiles!tenant_id(first_name, last_name, user_id),
      properties(name, address, profiles!landlord_id(first_name, last_name))
    `)
    .eq('id', tenant_property_id)
    .single();

  if (error) throw error;

  // Get tenant's email
  const { data: userData } = await supabase.auth.admin.getUserById(tenantProperty.profiles.user_id);
  
  if (!userData.user?.email) {
    throw new Error('No email found for tenant');
  }

  const emailResponse = await resend.emails.send({
    from: "RentEase <noreply@rentease.app>",
    to: [userData.user.email],
    subject: `Rent Payment Reminder - ${tenantProperty.properties.name}`,
    html: `
      <h1>Rent Payment Reminder</h1>
      <p>Hello ${tenantProperty.profiles.first_name},</p>
      <p>This is a friendly reminder that your rent payment of <strong>$${tenantProperty.monthly_rent}</strong> for <strong>${tenantProperty.properties.name}</strong> is due in ${days_until_due} day(s).</p>
      <p><strong>Property:</strong> ${tenantProperty.properties.address}</p>
      <p><strong>Amount:</strong> $${tenantProperty.monthly_rent}</p>
      <p>Please ensure your payment is submitted on time to avoid any late fees.</p>
      <p>If you have any questions, please contact your landlord ${tenantProperty.properties.profiles.first_name} ${tenantProperty.properties.profiles.last_name}.</p>
      <p>Best regards,<br>The RentEase Team</p>
    `,
  });

  return new Response(JSON.stringify({ success: true, email_id: emailResponse.data?.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sendPaymentConfirmation(supabase: any, confirmationData: any) {
  const { payment_id } = confirmationData;

  // Get payment details
  const { data: payment, error } = await supabase
    .from('rent_payments')
    .select(`
      *,
      tenant_properties(
        profiles!tenant_id(first_name, last_name, user_id),
        properties(name, address, profiles!landlord_id(first_name, last_name, user_id))
      )
    `)
    .eq('id', payment_id)
    .single();

  if (error) throw error;

  // Get tenant's email
  const { data: tenantData } = await supabase.auth.admin.getUserById(
    payment.tenant_properties.profiles.user_id
  );

  // Get landlord's email
  const { data: landlordData } = await supabase.auth.admin.getUserById(
    payment.tenant_properties.properties.profiles.user_id
  );

  if (!tenantData.user?.email || !landlordData.user?.email) {
    throw new Error('Email not found for tenant or landlord');
  }

  // Send confirmation to tenant
  const tenantEmailResponse = await resend.emails.send({
    from: "RentEase <noreply@rentease.app>",
    to: [tenantData.user.email],
    subject: `Payment Confirmation - ${payment.tenant_properties.properties.name}`,
    html: `
      <h1>Payment Confirmation</h1>
      <p>Hello ${payment.tenant_properties.profiles.first_name},</p>
      <p>We have received your rent payment. Thank you!</p>
      <p><strong>Property:</strong> ${payment.tenant_properties.properties.address}</p>
      <p><strong>Amount:</strong> $${payment.amount}</p>
      <p><strong>Payment Date:</strong> ${new Date(payment.paid_date).toLocaleDateString()}</p>
      <p><strong>Transaction ID:</strong> ${payment.transaction_id || 'N/A'}</p>
      <p>Best regards,<br>The RentEase Team</p>
    `,
  });

  // Send notification to landlord
  const landlordEmailResponse = await resend.emails.send({
    from: "RentEase <noreply@rentease.app>",
    to: [landlordData.user.email],
    subject: `Rent Payment Received - ${payment.tenant_properties.properties.name}`,
    html: `
      <h1>Rent Payment Received</h1>
      <p>Hello ${payment.tenant_properties.properties.profiles.first_name},</p>
      <p>You have received a rent payment from ${payment.tenant_properties.profiles.first_name} ${payment.tenant_properties.profiles.last_name}.</p>
      <p><strong>Property:</strong> ${payment.tenant_properties.properties.address}</p>
      <p><strong>Amount:</strong> $${payment.amount}</p>
      <p><strong>Payment Date:</strong> ${new Date(payment.paid_date).toLocaleDateString()}</p>
      <p><strong>Transaction ID:</strong> ${payment.transaction_id || 'N/A'}</p>
      <p>Best regards,<br>The RentEase Team</p>
    `,
  });

  return new Response(JSON.stringify({ 
    success: true, 
    tenant_email_id: tenantEmailResponse.data?.id,
    landlord_email_id: landlordEmailResponse.data?.id 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sendLeaseExpiryNotice(supabase: any, noticeData: any) {
  const { tenant_property_id, days_until_expiry } = noticeData;

  // Get tenant and property details
  const { data: tenantProperty, error } = await supabase
    .from('tenant_properties')
    .select(`
      lease_end_date,
      profiles!tenant_id(first_name, last_name, user_id),
      properties(name, address, profiles!landlord_id(first_name, last_name, user_id))
    `)
    .eq('id', tenant_property_id)
    .single();

  if (error) throw error;

  // Get emails
  const { data: tenantData } = await supabase.auth.admin.getUserById(
    tenantProperty.profiles.user_id
  );
  const { data: landlordData } = await supabase.auth.admin.getUserById(
    tenantProperty.properties.profiles.user_id
  );

  if (!tenantData.user?.email || !landlordData.user?.email) {
    throw new Error('Email not found for tenant or landlord');
  }

  // Send to tenant
  const tenantEmailResponse = await resend.emails.send({
    from: "RentEase <noreply@rentease.app>",
    to: [tenantData.user.email],
    subject: `Lease Expiry Notice - ${tenantProperty.properties.name}`,
    html: `
      <h1>Lease Expiry Notice</h1>
      <p>Hello ${tenantProperty.profiles.first_name},</p>
      <p>Your lease for <strong>${tenantProperty.properties.name}</strong> will expire in ${days_until_expiry} day(s) on ${new Date(tenantProperty.lease_end_date).toLocaleDateString()}.</p>
      <p><strong>Property:</strong> ${tenantProperty.properties.address}</p>
      <p>Please contact your landlord to discuss lease renewal or move-out arrangements.</p>
      <p>Landlord: ${tenantProperty.properties.profiles.first_name} ${tenantProperty.properties.profiles.last_name}</p>
      <p>Best regards,<br>The RentEase Team</p>
    `,
  });

  // Send to landlord
  const landlordEmailResponse = await resend.emails.send({
    from: "RentEase <noreply@rentease.app>",
    to: [landlordData.user.email],
    subject: `Tenant Lease Expiry Notice - ${tenantProperty.properties.name}`,
    html: `
      <h1>Tenant Lease Expiry Notice</h1>
      <p>Hello ${tenantProperty.properties.profiles.first_name},</p>
      <p>The lease for your tenant ${tenantProperty.profiles.first_name} ${tenantProperty.profiles.last_name} at <strong>${tenantProperty.properties.name}</strong> will expire in ${days_until_expiry} day(s) on ${new Date(tenantProperty.lease_end_date).toLocaleDateString()}.</p>
      <p><strong>Property:</strong> ${tenantProperty.properties.address}</p>
      <p>Please reach out to discuss lease renewal or move-out arrangements.</p>
      <p>Best regards,<br>The RentEase Team</p>
    `,
  });

  return new Response(JSON.stringify({ 
    success: true, 
    tenant_email_id: tenantEmailResponse.data?.id,
    landlord_email_id: landlordEmailResponse.data?.id 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function checkOverduePayments(supabase: any) {
  const today = new Date().toISOString().split('T')[0];

  // Update overdue payments
  const { data: overduePayments, error } = await supabase
    .from('rent_payments')
    .update({ status: 'overdue' })
    .lt('due_date', today)
    .eq('status', 'pending')
    .select(`
      *,
      tenant_properties(
        profiles!tenant_id(first_name, last_name, user_id),
        properties(name, address)
      )
    `);

  if (error) throw error;

  // Send overdue notices
  const emailPromises = overduePayments?.map(async (payment) => {
    const { data: userData } = await supabase.auth.admin.getUserById(
      payment.tenant_properties.profiles.user_id
    );

    if (userData.user?.email) {
      return await resend.emails.send({
        from: "RentEase <noreply@rentease.app>",
        to: [userData.user.email],
        subject: `OVERDUE: Rent Payment - ${payment.tenant_properties.properties.name}`,
        html: `
          <h1>Overdue Rent Payment Notice</h1>
          <p>Hello ${payment.tenant_properties.profiles.first_name},</p>
          <p><strong style="color: red;">Your rent payment is now OVERDUE.</strong></p>
          <p><strong>Property:</strong> ${payment.tenant_properties.properties.address}</p>
          <p><strong>Amount Due:</strong> $${payment.amount}</p>
          <p><strong>Due Date:</strong> ${new Date(payment.due_date).toLocaleDateString()}</p>
          <p>Please submit your payment immediately to avoid additional late fees and potential legal action.</p>
          <p>Best regards,<br>The RentEase Team</p>
        `,
      });
    }
  }) || [];

  const emailResults = await Promise.all(emailPromises);

  return new Response(JSON.stringify({ 
    success: true, 
    overdue_count: overduePayments?.length || 0,
    emails_sent: emailResults.filter(r => r).length 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}