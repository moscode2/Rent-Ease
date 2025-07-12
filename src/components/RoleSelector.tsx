import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User } from "lucide-react";

interface RoleSelectorProps {
  onRoleSelect: (role: 'landlord' | 'tenant') => void;
}

export function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<'landlord' | 'tenant' | null>(null);

  const handleRoleSelect = (role: 'landlord' | 'tenant') => {
    setSelectedRole(role);
    onRoleSelect(role);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <Card 
        className={`cursor-pointer transition-all duration-300 hover:shadow-medium ${
          selectedRole === 'landlord' ? 'ring-2 ring-primary shadow-medium' : 'hover:scale-105'
        }`}
        onClick={() => handleRoleSelect('landlord')}
      >
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">I'm a Landlord</CardTitle>
          <CardDescription>
            Manage properties, track rent payments, and communicate with tenants
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Add and manage multiple properties</li>
            <li>• Track rent payments and due dates</li>
            <li>• Upload and store lease agreements</li>
            <li>• Generate financial reports</li>
            <li>• AI-powered legal assistance</li>
          </ul>
          <Button 
            className="w-full mt-6" 
            variant={selectedRole === 'landlord' ? 'default' : 'outline'}
          >
            Continue as Landlord
          </Button>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-all duration-300 hover:shadow-medium ${
          selectedRole === 'tenant' ? 'ring-2 ring-primary shadow-medium' : 'hover:scale-105'
        }`}
        onClick={() => handleRoleSelect('tenant')}
      >
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">I'm a Tenant</CardTitle>
          <CardDescription>
            View rent details, upload receipts, and stay connected with your landlord
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• View rent schedule and payment history</li>
            <li>• Upload payment receipts and documents</li>
            <li>• Direct messaging with landlord</li>
            <li>• Access lease agreements</li>
            <li>• Maintenance request system</li>
          </ul>
          <Button 
            className="w-full mt-6" 
            variant={selectedRole === 'tenant' ? 'default' : 'outline'}
          >
            Continue as Tenant
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}