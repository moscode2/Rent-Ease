import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, Users, TrendingUp, Plus, MessageSquare, FileText, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const rentData = [
  { month: 'Jan', collected: 8500, due: 9000 },
  { month: 'Feb', collected: 9000, due: 9000 },
  { month: 'Mar', collected: 8200, due: 9000 },
  { month: 'Apr', collected: 9000, due: 9000 },
  { month: 'May', collected: 7800, due: 9000 },
  { month: 'Jun', collected: 9000, due: 9000 },
];

const propertyData = [
  { name: 'Occupied', value: 8, color: 'hsl(var(--success))' },
  { name: 'Vacant', value: 2, color: 'hsl(var(--warning))' },
];

const properties = [
  { id: 1, name: "Sunset Apartments", address: "123 Main St", tenant: "John Doe", rent: 1200, status: "paid", dueDate: "2024-01-01" },
  { id: 2, name: "Ocean View Villa", address: "456 Beach Rd", tenant: "Jane Smith", rent: 2500, status: "pending", dueDate: "2024-01-03" },
  { id: 3, name: "Downtown Loft", address: "789 City Ave", tenant: "Mike Johnson", rent: 1800, status: "overdue", dueDate: "2023-12-28" },
  { id: 4, name: "Garden Court", address: "321 Oak St", tenant: "Sarah Wilson", rent: 1500, status: "paid", dueDate: "2024-01-01" },
];

export function LandlordDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your property overview.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4" />
            Messages
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-success">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$18,500</div>
            <p className="text-xs text-muted-foreground">
              Collected: $17,200 (93%)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              80% occupancy rate
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-warning">
              2 overdue payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Rent Collection Overview</CardTitle>
            <CardDescription>Monthly rent collected vs due amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="due" fill="hsl(var(--muted))" name="Due" />
                <Bar dataKey="collected" fill="hsl(var(--primary))" name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Property Occupancy</CardTitle>
            <CardDescription>Current occupancy status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={propertyData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {propertyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {propertyData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Table */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Properties Overview</CardTitle>
            <CardDescription>Manage your properties and track rent payments</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4" />
            Export Report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Property</th>
                  <th className="text-left p-4 font-medium">Tenant</th>
                  <th className="text-left p-4 font-medium">Rent</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Due Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{property.name}</div>
                        <div className="text-sm text-muted-foreground">{property.address}</div>
                      </div>
                    </td>
                    <td className="p-4">{property.tenant}</td>
                    <td className="p-4 font-medium">${property.rent.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge 
                        variant={
                          property.status === 'paid' ? 'default' : 
                          property.status === 'pending' ? 'secondary' : 
                          'destructive'
                        }
                        className={
                          property.status === 'paid' ? 'bg-success text-success-foreground' :
                          property.status === 'pending' ? 'bg-warning text-warning-foreground' :
                          ''
                        }
                      >
                        {property.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm">{new Date(property.dueDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">View</Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}