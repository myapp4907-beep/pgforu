import { Building2, Users, BedDouble, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  // Mock data - will be replaced with real data later
  const stats = {
    totalRooms: 24,
    occupiedRooms: 18,
    vacantRooms: 6,
    totalGuests: 18,
    monthlyIncome: 54000,
  };

  const occupancyRate = Math.round((stats.occupiedRooms / stats.totalRooms) * 100);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    subtitle?: string;
    trend?: string;
  }) => (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className="text-xs text-success mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your PG overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Rooms"
            value={stats.totalRooms}
            icon={BedDouble}
            subtitle="Across all properties"
          />
          <StatCard
            title="Occupied Rooms"
            value={stats.occupiedRooms}
            icon={Building2}
            subtitle={`${occupancyRate}% occupancy`}
            trend="+2 this week"
          />
          <StatCard
            title="Vacant Rooms"
            value={stats.vacantRooms}
            icon={BedDouble}
            subtitle="Ready for guests"
          />
          <StatCard
            title="Total Guests"
            value={stats.totalGuests}
            icon={Users}
            subtitle="Active residents"
          />
        </div>

        {/* Monthly Income Card */}
        <Card className="mb-8 bg-gradient-primary border-0 text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              ₹{stats.monthlyIncome.toLocaleString('en-IN')}
            </div>
            <p className="text-sm opacity-90">Expected for this month</p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle>Room Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View and manage all your rooms, update availability, and track occupancy.
              </p>
              <Link to="/rooms">
                <Button className="w-full">Manage Rooms</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle>Guest Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Add new guests, view resident details, and manage check-ins/check-outs.
              </p>
              <Link to="/guests">
                <Button variant="secondary" className="w-full">Manage Guests</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
