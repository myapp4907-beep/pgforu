import { useState, useEffect } from "react";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  IndianRupee, 
  Calendar, 
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle2,
  Clock,
  History,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_month: string;
  payment_method: string | null;
  notes: string | null;
}

const GuestPayments = () => {
  const { guestProfile, refreshProfile } = useGuestAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [currentMonthPaid, setCurrentMonthPaid] = useState(false);

  useEffect(() => {
    if (guestProfile) {
      fetchPayments();
    }
  }, [guestProfile]);

  const fetchPayments = async () => {
    if (!guestProfile) return;

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("guest_id", guestProfile.id)
      .order("payment_date", { ascending: false });

    if (data) {
      setPayments(data);
      calculatePending(data);
    }
    setLoading(false);
  };

  const calculatePending = (paymentList: Payment[]) => {
    if (!guestProfile) return;

    const totalPaid = paymentList.reduce((sum, p) => sum + Number(p.amount), 0);
    const currentMonth = new Date();
    const joiningDate = new Date(guestProfile.joining_date);
    
    const monthsSinceJoining = Math.max(0, 
      (currentMonth.getFullYear() - joiningDate.getFullYear()) * 12 + 
      (currentMonth.getMonth() - joiningDate.getMonth()) + 1
    );
    
    const expectedTotal = monthsSinceJoining * guestProfile.monthly_rent;
    setPendingAmount(Math.max(0, expectedTotal - totalPaid));

    // Check if current month is paid
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    setCurrentMonthPaid(paymentList.some(p => 
      new Date(p.payment_month) >= currentMonthStart
    ));
  };

  const handlePayment = async () => {
    if (!guestProfile) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock payment - in real scenario, this would go through Stripe
    const currentMonth = new Date();
    const paymentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    try {
      const { error } = await supabase.from("payments").insert({
        guest_id: guestProfile.id,
        property_id: guestProfile.property_id,
        room_id: guestProfile.room_id,
        owner_id: (await supabase.from("properties").select("owner_id").eq("id", guestProfile.property_id).single()).data?.owner_id,
        amount: guestProfile.monthly_rent,
        payment_date: new Date().toISOString().split("T")[0],
        payment_month: paymentMonth.toISOString().split("T")[0],
        payment_method: selectedMethod,
        notes: `Payment via ${selectedMethod.toUpperCase()} - Mock Payment`,
      });

      if (error) throw error;

      // Update guest payment status
      await supabase
        .from("guests")
        .update({ payment_status: "paid" })
        .eq("id", guestProfile.id);

      toast({
        title: "Payment Successful! 🎉",
        description: `₹${guestProfile.monthly_rent.toLocaleString()} paid for ${format(paymentMonth, "MMMM yyyy")}`,
      });

      await fetchPayments();
      await refreshProfile();
      setIsPayDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">Manage your rent payments</p>
        </div>
        {!currentMonthPaid && (
          <Button onClick={() => setIsPayDialogOpen(true)}>
            <IndianRupee className="h-4 w-4 mr-2" />
            Pay Rent
          </Button>
        )}
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="text-2xl font-bold">₹{guestProfile?.monthly_rent?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${pendingAmount > 0 ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                {pendingAmount > 0 ? (
                  <Clock className="h-6 w-6 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Dues</p>
                <p className={`text-2xl font-bold ${pendingAmount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  ₹{pendingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <History className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Month Status */}
      <Card className={currentMonthPaid ? "border-green-500/30" : "border-destructive/30"}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${currentMonthPaid ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                {currentMonthPaid ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div>
                <p className="font-semibold text-lg">{format(new Date(), "MMMM yyyy")} Rent</p>
                <p className="text-sm text-muted-foreground">Due by 5th of every month</p>
              </div>
            </div>
            <Badge 
              variant={currentMonthPaid ? "default" : "destructive"} 
              className="text-sm py-1 px-4"
            >
              {currentMonthPaid ? "Paid" : "Pending"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>Your past rent payments</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <IndianRupee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payments recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {format(new Date(payment.payment_month), "MMMM yyyy")} Rent
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Paid on {format(new Date(payment.payment_date), "MMM d, yyyy")}
                        {payment.payment_method && ` via ${payment.payment_method.toUpperCase()}`}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{Number(payment.amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Rent</DialogTitle>
            <DialogDescription>
              Pay your rent for {format(new Date(), "MMMM yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Amount to Pay</p>
              <p className="text-3xl font-bold text-primary">
                ₹{guestProfile?.monthly_rent?.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3">
              <Label>Select Payment Method</Label>
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Smartphone className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">UPI</p>
                      <p className="text-xs text-muted-foreground">GPay, PhonePe, Paytm</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer">
                  <RadioGroupItem value="netbanking" id="netbanking" />
                  <Label htmlFor="netbanking" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Building2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Net Banking</p>
                      <p className="text-xs text-muted-foreground">All major banks</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                This is a demo payment. No real transaction will occur.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <IndianRupee className="h-4 w-4 mr-2" />
                  Pay ₹{guestProfile?.monthly_rent?.toLocaleString()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuestPayments;
