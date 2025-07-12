import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Home, DollarSign, Calendar, FileText, MessageSquare, Upload, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const paymentHistory = [
  { month: 'Jul', amount: 1200, status: 'paid' },
  { month: 'Aug', amount: 1200, status: 'paid' },
  { month: 'Sep', amount: 1200, status: 'paid' },
  { month: 'Oct', amount: 1200, status: 'paid' },
  { month: 'Nov', amount: 1200, status: 'paid' },
  { month: 'Dec', amount: 1200, status: 'pending' },
];

const documents = [
  { id: 1, name: "Lease Agreement", type: "PDF", uploadDate: "2024-01-01", status: "approved" },
  { id: 2, name: "November Rent Receipt", type: "PDF", uploadDate: "2024-11-05", status: "pending" },
  { id: 3, name: "Utility Bills", type: "PDF", uploadDate: "2024-10-28", status: "approved" },
];

const upcomingPayments = [
  { description: "December Rent", amount: 1200, dueDate: "2024-12-01", priority: "high" },
  { description: "Utility Deposit", amount: 150, dueDate: "2024-12-15", priority: "medium" },
];

export function TenantDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground">Sunset Apartments - Unit 4B</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4" />
            Contact Landlord
          </Button>
          <Button size="sm">
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Rent</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,200</div>
            <p className="text-xs text-muted-foreground">
              Monthly rent amount
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Dec 1</div>
            <p className="text-xs text-warning">
              Due in 3 days
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">Pending</div>
            <p className="text-xs text-muted-foreground">
              November payment
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              1 pending review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment History Chart */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your rent payment track record</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={paymentHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
            <CardDescription>Your payment schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    payment.priority === 'high' ? 'bg-destructive' : 'bg-warning'
                  }`} />
                  <div>
                    <div className="font-medium">{payment.description}</div>
                    <div className="text-sm text-muted-foreground">
                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${payment.amount}</div>
                  <Button variant="outline" size="sm" className="mt-1">
                    Pay Now
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Documents and Lease Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Your uploaded documents and status</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{doc.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={doc.status === 'approved' ? 'default' : 'secondary'}
                    className={doc.status === 'approved' ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}
                  >
                    {doc.status === 'approved' ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lease Information */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Lease Information</CardTitle>
            <CardDescription>Your current lease details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Property</div>
                <div className="font-medium">Sunset Apartments</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Unit</div>
                <div className="font-medium">4B</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Lease Start</div>
                <div className="font-medium">Jan 1, 2024</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Lease End</div>
                <div className="font-medium">Dec 31, 2024</div>
              </div>
            </div>
            
            <div className="pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Lease Progress</span>
                <span>11 of 12 months</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1">
                <FileText className="w-4 h-4" />
                View Lease
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Renewal Options
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}