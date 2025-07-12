import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Sparkles, Shield, MessageSquare, FileText, TrendingUp } from "lucide-react";
import { RoleSelector } from "@/components/RoleSelector";
import { LandlordDashboard } from "@/components/dashboard/LandlordDashboard";
import { TenantDashboard } from "@/components/dashboard/TenantDashboard";
import { Navigation } from "@/components/Navigation";

type UserRole = 'landlord' | 'tenant' | null;
type AppState = 'landing' | 'role-selection' | 'dashboard';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [userRole, setUserRole] = useState<UserRole>(null);

  const handleGetStarted = () => {
    setAppState('role-selection');
  };

  const handleRoleSelect = (role: 'landlord' | 'tenant') => {
    setUserRole(role);
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setUserRole(null);
    setAppState('landing');
  };

  if (appState === 'dashboard' && userRole) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation 
          userRole={userRole} 
          userName="Demo User"
          onLogout={handleLogout} 
        />
        <main className="container mx-auto px-4 py-8">
          {userRole === 'landlord' ? <LandlordDashboard /> : <TenantDashboard />}
        </main>
      </div>
    );
  }

  if (appState === 'role-selection') {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold">RentEase</h1>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Choose Your Role</h2>
            <p className="text-muted-foreground">
              Select how you'll be using RentEase to get started with the right tools for you.
            </p>
          </div>
          <RoleSelector onRoleSelect={handleRoleSelect} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-secondary">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
                <Building2 className="w-9 h-9 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold">RentEase</h1>
                <p className="text-muted-foreground">Smart Rental Management</p>
              </div>
            </div>
            
            <h2 className="text-5xl font-bold tracking-tight mb-6">
              Streamline Your <span className="bg-gradient-primary bg-clip-text text-transparent">Rental Experience</span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The complete solution for landlords and tenants. Track payments, manage documents, 
              communicate seamlessly, and get AI-powered legal assistance - all in one platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Everything You Need</h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to make rental management effortless for both landlords and tenants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Smart Rent Tracking</CardTitle>
                <CardDescription>
                  Automated payment tracking, reminders, and comprehensive financial reporting for landlords.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Document Management</CardTitle>
                <CardDescription>
                  Secure storage for lease agreements, receipts, and property documents with easy access.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <CardTitle>AI Legal Assistant</CardTitle>
                <CardDescription>
                  Generate rental agreements, legal notices, and get instant answers to common legal questions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <CardTitle>In-App Communication</CardTitle>
                <CardDescription>
                  Secure messaging between landlords and tenants with document sharing capabilities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Secure & Compliant</CardTitle>
                <CardDescription>
                  Bank-level security with compliance features to protect sensitive rental information.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Multi-Property Support</CardTitle>
                <CardDescription>
                  Manage multiple properties and tenants from a single, comprehensive dashboard.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Simplify Your Rental Management?</h3>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of landlords and tenants who trust RentEase for their rental management needs.
            </p>
            <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold">RentEase</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 RentEase. Built with Lovable for modern rental management.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
