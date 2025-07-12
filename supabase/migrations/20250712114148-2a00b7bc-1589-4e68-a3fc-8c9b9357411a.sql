-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('landlord', 'tenant');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('paid', 'pending', 'overdue');

-- Create enum for document types
CREATE TYPE public.document_type AS ENUM ('lease_agreement', 'payment_receipt', 'maintenance_request', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role user_role NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create properties table
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2),
    property_type TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tenant_properties table (many-to-many relationship)
CREATE TABLE public.tenant_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    lease_start_date DATE NOT NULL,
    lease_end_date DATE NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit_paid DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(tenant_id, property_id, is_active)
);

-- Create rent_payments table
CREATE TABLE public.rent_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_property_id UUID REFERENCES public.tenant_properties(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status payment_status DEFAULT 'pending' NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    late_fee DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_property_id UUID REFERENCES public.tenant_properties(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create messages table for chat
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenant_properties_updated_at BEFORE UPDATE ON public.tenant_properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rent_payments_updated_at BEFORE UPDATE ON public.rent_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Properties RLS policies
CREATE POLICY "Anyone can view properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Landlords can manage their properties" ON public.properties FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'landlord' AND user_id = properties.landlord_id
    )
);
CREATE POLICY "Landlords can insert properties" ON public.properties FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'landlord' AND user_id = landlord_id
    )
);

-- Tenant properties RLS policies
CREATE POLICY "Landlords and tenants can view their tenant_properties" ON public.tenant_properties FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.properties prop ON prop.landlord_id = p.user_id
        WHERE p.user_id = auth.uid() AND prop.id = tenant_properties.property_id
    ) OR 
    tenant_id = auth.uid()
);

CREATE POLICY "Landlords can manage tenant_properties" ON public.tenant_properties FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.properties prop ON prop.landlord_id = p.user_id
        WHERE p.user_id = auth.uid() AND prop.id = tenant_properties.property_id
    )
);

-- Rent payments RLS policies
CREATE POLICY "Related users can view rent_payments" ON public.rent_payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.tenant_properties tp
        JOIN public.properties p ON p.id = tp.property_id
        WHERE tp.id = rent_payments.tenant_property_id 
        AND (tp.tenant_id = auth.uid() OR p.landlord_id = auth.uid())
    )
);

CREATE POLICY "Landlords and tenants can update rent_payments" ON public.rent_payments FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.tenant_properties tp
        JOIN public.properties p ON p.id = tp.property_id
        WHERE tp.id = rent_payments.tenant_property_id 
        AND (tp.tenant_id = auth.uid() OR p.landlord_id = auth.uid())
    )
);

CREATE POLICY "Landlords can insert rent_payments" ON public.rent_payments FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tenant_properties tp
        JOIN public.properties p ON p.id = tp.property_id
        WHERE tp.id = tenant_property_id AND p.landlord_id = auth.uid()
    )
);

-- Documents RLS policies
CREATE POLICY "Related users can view documents" ON public.documents FOR SELECT USING (
    uploader_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.properties p WHERE p.id = documents.property_id AND p.landlord_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.tenant_properties tp WHERE tp.id = documents.tenant_property_id AND tp.tenant_id = auth.uid()
    )
);

CREATE POLICY "Users can upload documents" ON public.documents FOR INSERT WITH CHECK (uploader_id = auth.uid());

-- Messages RLS policies
CREATE POLICY "Users can view their messages" ON public.messages FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
);

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages" ON public.messages FOR UPDATE USING (receiver_id = auth.uid());

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents
CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view documents they have access to" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND auth.uid() IS NOT NULL
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, role, first_name, last_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')::user_role,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();