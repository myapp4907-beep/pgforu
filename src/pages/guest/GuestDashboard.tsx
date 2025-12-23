import { useState, useEffect } from "react";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  IndianRupee, 
  Calendar, 
  Bell, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Megaphone
} from "lucide-react";
import { format, isAfter, addDays } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  announcement_type: string;
  created_at: string;
}

interface PaymentSummary {
  totalPaid: number;
  pendingAmount: number;
  lastPaymentDate: string | null;
  currentMonthPaid: boolean;
}

const GuestDashboard = () => {
  const { guestProfile } = useGuestAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalPaid: 0,
    pendingAmount: 0,
    lastPaymentDate: null,
    currentMonthPaid: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guestProfile) {
      fetchDashboardData();
    }
  }, [guestProfile]);

  const fetchDashboardData = async () => {
    if (!guestProfile) return;

    // Fetch announcements
    const { data: announcementsData } = await supabase
      .from("announcements")
      .select("*")
      .eq("property_id", guestProfile.property_id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (announcementsData) {
      setAnnouncements(announcementsData);
    }

    // Fetch payment history
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("guest_id", guestProfile.id)
      .order("payment_date", { ascending: false });

    if (payments) {
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const currentMonth = new Date();
      const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const currentMonthPaid = payments.some(p => 
        new Date(p.payment_month) >= currentMonthStart
      );
      
      // Calculate pending (assuming rent is due from joining date)
      const joiningDate = new Date(guestProfile.joining_date);
      const monthsSinceJoining = Math.max(0, 
        (currentMonth.getFullYear() - joiningDate.getFullYear()) * 12 + 
        (currentMonth.getMonth() - joiningDate.getMonth()) + 1
      );
      const expectedTotal = monthsSinceJoining * guestProfile.monthly_rent;
      const pendingAmount = Math.max(0, expectedTotal - totalPaid);

      setPaymentSummary({
        totalPaid,
        pendingAmount,
        lastPaymentDate: payments[0]?.payment_date || null,
        currentMonthPaid,
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isDueDate = !paymentSummary.currentMonthPaid && new Date().getDate() >= 5;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {guestProfile?.full_name}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your PG dashboard overview
        </p>
      </div>

      {/* Alert Banner */}
      {isDueDate && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Payment Due!</p>
              <p className="text-sm text-muted-foreground">
                Your rent for this month is pending. Please pay to avoid late fees.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => window.location.href = '/guest/payments'}>
              Pay Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Room</p>
                <p className="text-xl font-bold">
                  {guestProfile?.room_number}
                  {guestProfile?.bed_number && ` - Bed ${guestProfile.bed_number}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="text-xl font-bold">₹{guestProfile?.monthly_rent?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${paymentSummary.pendingAmount > 0 ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                {paymentSummary.pendingAmount > 0 ? (
                  <Clock className="h-6 w-6 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Dues</p>
                <p className={`text-xl font-bold ${paymentSummary.pendingAmount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  ₹{paymentSummary.pendingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-xl font-bold">
                  {guestProfile?.joining_date ? format(new Date(guestProfile.joining_date), "MMM yyyy") : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Month Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Current Month Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium">
                {format(new Date(), "MMMM yyyy")} Rent
              </p>
              <p className="text-muted-foreground">Due by 5th of every month</p>
            </div>
            <Badge variant={paymentSummary.currentMonthPaid ? "default" : "destructive"} className="text-sm py-1 px-3">
              {paymentSummary.currentMonthPaid ? "Paid" : "Pending"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcements
          </CardTitle>
          <CardDescription>Latest updates from your PG owner</CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No announcements yet
            </p>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className="p-4 rounded-lg border border-border/50 bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {announcement.announcement_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(announcement.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <h4 className="font-medium">{announcement.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestDashboard;
