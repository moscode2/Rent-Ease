import { useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft } from "lucide-react";

interface AuthFormProps {
  userRole: 'landlord' | 'tenant';
  onBack: () => void;
}

export function AuthForm({ userRole, onBack }: AuthFormProps) {
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_up');

  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-medium">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="absolute left-4 top-4"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">RentEase</h1>
                <p className="text-sm text-muted-foreground capitalize">
                  {userRole} Account
                </p>
              </div>
            </div>
            <CardTitle className="text-xl">
              {view === 'sign_up' ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {view === 'sign_up' 
                ? `Create your ${userRole} account to get started`
                : `Sign in to your ${userRole} account`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              view={view}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(200 85% 45%)',
                      brandAccent: 'hsl(160 80% 45%)',
                    },
                  },
                },
              }}
              providers={[]}
              redirectTo={window.location.origin}
              additionalData={{
                role: userRole,
              }}
            />
            
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setView(view === 'sign_up' ? 'sign_in' : 'sign_up')}
                className="text-sm"
              >
                {view === 'sign_up' 
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}