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
      case 'send':
        if (method === 'POST') {
          const messageData = await req.json();
          return await sendMessage(supabase, user.id, messageData);
        }
        break;

      case 'conversations':
        if (method === 'GET') {
          return await getConversations(supabase, user.id);
        }
        break;

      case 'messages':
        if (method === 'GET') {
          const otherUserId = url.searchParams.get('other_user_id');
          const propertyId = url.searchParams.get('property_id');
          return await getMessages(supabase, user.id, otherUserId, propertyId);
        }
        break;

      case 'mark-read':
        if (method === 'PUT') {
          const messageId = url.searchParams.get('message_id');
          return await markMessageAsRead(supabase, user.id, messageId);
        }
        break;

      case 'unread-count':
        if (method === 'GET') {
          return await getUnreadCount(supabase, user.id);
        }
        break;

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in messaging function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendMessage(supabase: any, userId: string, messageData: any) {
  const { receiver_id, property_id, content, attachment_url } = messageData;

  // Verify that the sender and receiver have a relationship through a property
  const { data: relationship, error: relationError } = await supabase
    .from('tenant_properties')
    .select(`
      property_id,
      tenant_id,
      properties(landlord_id)
    `)
    .or(`tenant_id.eq.${userId},tenant_id.eq.${receiver_id}`)
    .or(`properties.landlord_id.eq.${userId},properties.landlord_id.eq.${receiver_id}`)
    .eq('property_id', property_id || '')
    .limit(1);

  if (!relationship || relationship.length === 0) {
    throw new Error('No relationship found between users for this property');
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      sender_id: userId,
      receiver_id,
      property_id: property_id || null,
      content,
      attachment_url: attachment_url || null,
    })
    .select(`
      *,
      sender:profiles!sender_id(first_name, last_name, avatar_url),
      receiver:profiles!receiver_id(first_name, last_name, avatar_url),
      properties(name, address)
    `)
    .single();

  if (error) throw error;

  return new Response(JSON.stringify(message), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getConversations(supabase: any, userId: string) {
  // Get all unique conversations where user is sender or receiver
  const { data: conversations, error } = await supabase
    .from('messages')
    .select(`
      sender_id,
      receiver_id,
      property_id,
      content,
      created_at,
      is_read,
      sender:profiles!sender_id(first_name, last_name, avatar_url),
      receiver:profiles!receiver_id(first_name, last_name, avatar_url),
      properties(name, address)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Group by conversation (other user + property)
  const conversationMap = new Map();

  conversations?.forEach(message => {
    const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
    const key = `${otherUserId}-${message.property_id || 'general'}`;
    
    if (!conversationMap.has(key)) {
      conversationMap.set(key, {
        other_user_id: otherUserId,
        other_user: message.sender_id === userId ? message.receiver : message.sender,
        property_id: message.property_id,
        property: message.properties,
        last_message: message.content,
        last_message_time: message.created_at,
        unread_count: 0,
      });
    }

    // Count unread messages
    if (message.receiver_id === userId && !message.is_read) {
      const conversation = conversationMap.get(key);
      conversation.unread_count++;
    }
  });

  return new Response(JSON.stringify(Array.from(conversationMap.values())), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getMessages(supabase: any, userId: string, otherUserId?: string, propertyId?: string) {
  if (!otherUserId) {
    throw new Error('Other user ID required');
  }

  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id(first_name, last_name, avatar_url),
      receiver:profiles!receiver_id(first_name, last_name, avatar_url)
    `)
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`);

  if (propertyId) {
    query = query.eq('property_id', propertyId);
  }

  const { data: messages, error } = await query.order('created_at', { ascending: true });

  if (error) throw error;

  return new Response(JSON.stringify(messages), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function markMessageAsRead(supabase: any, userId: string, messageId?: string) {
  if (!messageId) {
    throw new Error('Message ID required');
  }

  const { data: message, error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)
    .eq('receiver_id', userId) // Only receiver can mark as read
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify(message), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getUnreadCount(supabase: any, userId: string) {
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) throw error;

  return new Response(JSON.stringify({ unread_count: count }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}