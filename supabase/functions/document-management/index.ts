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
      case 'upload':
        if (method === 'POST') {
          return await uploadDocument(supabase, user.id, req);
        }
        break;

      case 'list':
        if (method === 'GET') {
          const propertyId = url.searchParams.get('property_id');
          const tenantPropertyId = url.searchParams.get('tenant_property_id');
          return await listDocuments(supabase, user.id, propertyId, tenantPropertyId);
        }
        break;

      case 'download':
        if (method === 'GET') {
          const documentId = url.searchParams.get('document_id');
          return await downloadDocument(supabase, user.id, documentId);
        }
        break;

      case 'delete':
        if (method === 'DELETE') {
          const documentId = url.searchParams.get('document_id');
          return await deleteDocument(supabase, user.id, documentId);
        }
        break;

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in document-management function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function uploadDocument(supabase: any, userId: string, req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const documentType = formData.get('document_type') as string;
  const title = formData.get('title') as string;
  const propertyId = formData.get('property_id') as string;
  const tenantPropertyId = formData.get('tenant_property_id') as string;

  if (!file) {
    throw new Error('No file provided');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  // Save document metadata
  const { data: document, error: dbError } = await supabase
    .from('documents')
    .insert({
      uploader_id: userId,
      property_id: propertyId || null,
      tenant_property_id: tenantPropertyId || null,
      document_type: documentType,
      title: title || file.name,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    })
    .select()
    .single();

  if (dbError) {
    // Clean up uploaded file if database insert fails
    await supabase.storage.from('documents').remove([filePath]);
    throw dbError;
  }

  return new Response(JSON.stringify(document), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function listDocuments(supabase: any, userId: string, propertyId?: string, tenantPropertyId?: string) {
  let query = supabase
    .from('documents')
    .select(`
      *,
      properties(name, address),
      tenant_properties(
        properties(name, address),
        profiles(first_name, last_name)
      )
    `);

  if (propertyId) {
    query = query.eq('property_id', propertyId);
  }

  if (tenantPropertyId) {
    query = query.eq('tenant_property_id', tenantPropertyId);
  }

  const { data: documents, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify(documents), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function downloadDocument(supabase: any, userId: string, documentId?: string) {
  if (!documentId) {
    throw new Error('Document ID required');
  }

  // Verify user has access to this document
  const { data: document, error } = await supabase
    .from('documents')
    .select('file_url, file_name')
    .eq('id', documentId)
    .single();

  if (error) throw error;

  if (!document) {
    throw new Error('Document not found');
  }

  // Extract file path from URL
  const url = new URL(document.file_url);
  const filePath = url.pathname.split('/').slice(-2).join('/'); // Get userId/filename

  // Get signed URL for download
  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (signedUrlError) throw signedUrlError;

  return new Response(JSON.stringify({
    download_url: signedUrl.signedUrl,
    file_name: document.file_name,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteDocument(supabase: any, userId: string, documentId?: string) {
  if (!documentId) {
    throw new Error('Document ID required');
  }

  // Get document details first
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_url, uploader_id')
    .eq('id', documentId)
    .single();

  if (fetchError) throw fetchError;

  if (!document) {
    throw new Error('Document not found');
  }

  // Check if user has permission to delete (only uploader can delete)
  if (document.uploader_id !== userId) {
    throw new Error('Unauthorized to delete this document');
  }

  // Extract file path from URL
  const url = new URL(document.file_url);
  const filePath = url.pathname.split('/').slice(-2).join('/');

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([filePath]);

  if (storageError) {
    console.error('Error deleting from storage:', storageError);
    // Continue with database deletion even if storage deletion fails
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (dbError) throw dbError;

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}