import { useState, useEffect } from "react";
import { Building2, Users, BedDouble, TrendingUp, TrendingDown, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    totalGuests: 0,
    monthlyIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [roomsRes, guestsRes, expensesRes] = await Promise.all([
        supabase.from("rooms").select("status, monthly_rent"),
        supabase.from("guests").select("monthly_rent, status").eq("status", "active"),
        supabase.from("expenses").select("amount"),
      ]);

      if (roomsRes.error) throw roomsRes.error;
      if (guestsRes.error) throw guestsRes.error;
      if (expensesRes.error) throw expensesRes.error;

      const rooms = roomsRes.data || [];
      const guests = guestsRes.data || [];
      const expenses = expensesRes.data || [];

      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
      const vacantRooms = rooms.filter((r) => r.status === "vacant").length;
      const totalGuests = guests.length;
      const monthlyIncome = guests.reduce((sum, g) => sum + Number(g.monthly_rent), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const netIncome = monthlyIncome - totalExpenses;

      setStats({
        totalRooms,
        occupiedRooms,
        vacantRooms,
        totalGuests,
        monthlyIncome,
        totalExpenses,
        netIncome,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const occupancyRate = stats.totalRooms > 0 
    ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) 
    : 0;

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

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

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

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-primary border-0 text-primary-foreground">
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
              <p className="text-sm opacity-90">From all active guests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <TrendingDown className="h-5 w-5" />
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                ₹{stats.totalExpenses.toLocaleString('en-IN')}
              </div>
              <p className="text-sm text-muted-foreground">Monthly operating costs</p>
            </CardContent>
          </Card>

          <Card className={stats.netIncome >= 0 ? "border-success" : "border-destructive"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Net Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mb-2 ${stats.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                ₹{stats.netIncome.toLocaleString('en-IN')}
              </div>
              <p className="text-sm text-muted-foreground">Income - Expenses</p>
            </CardContent>
          </Card>
        </div>

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
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity w-full">
                  Manage Rooms
                </button>
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
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity w-full">
                  Manage Guests
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
