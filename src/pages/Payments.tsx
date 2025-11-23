import { useState, useEffect } from "react";
import { Plus, Search, Calendar, IndianRupee, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useProperty } from "@/contexts/PropertyContext";
import { format } from "date-fns";

interface Payment {
  id: string;
  guest_id: string;
  room_id: string;
  amount: number;
  payment_date: string;
  payment_month: string;
  payment_method: string | null;
  notes: string | null;
  guests: {
    full_name: string;
    bed_number: string | null;
  } | null;
  rooms: {
    room_number: string;
  } | null;
}

interface Guest {
  id: string;
  full_name: string;
  monthly_rent: number;
  room_id: string;
  bed_number: string | null;
  rooms: {
    room_number: string;
  } | null;
}

const Payments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedProperty } = useProperty();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMonth, setPaymentMonth] = useState(format(new Date(), "yyyy-MM-01"));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (user && selectedProperty) {
      fetchData();
    }
  }, [user, selectedProperty]);

  const fetchData = async () => {
    if (!selectedProperty) return;

    try {
      const [paymentsRes, guestsRes] = await Promise.all([
        supabase
          .from("payments")
          .select(`
            *,
            guests(full_name, bed_number),
            rooms(room_number)
          `)
          .eq("property_id", selectedProperty.id)
          .order("payment_date", { ascending: false }),
        supabase
          .from("guests")
          .select("*, rooms(room_number)")
          .eq("property_id", selectedProperty.id)
          .eq("status", "active"),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (guestsRes.error) throw guestsRes.error;

      setPayments(paymentsRes.data || []);
      setGuests(guestsRes.data || []);
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

  const handleAddPayment = async () => {
    if (!selectedProperty || !selectedGuest || !amount) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const guest = guests.find((g) => g.id === selectedGuest);
    if (!guest) return;

    try {
      const { error } = await supabase.from("payments").insert({
        owner_id: user!.id,
        property_id: selectedProperty.id,
        guest_id: selectedGuest,
        room_id: guest.room_id,
        amount: parseFloat(amount),
        payment_date: paymentDate,
        payment_month: paymentMonth,
        payment_method: paymentMethod || null,
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      const { error } = await supabase.from("payments").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedGuest("");
    setAmount("");
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentMonth(format(new Date(), "yyyy-MM-01"));
    setPaymentMethod("");
    setNotes("");
  };

  const filteredPayments = payments.filter((payment) =>
    payment.guests?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.rooms?.room_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Payment Tracking</h1>
            <p className="text-muted-foreground">Record and manage rent payments</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Guest *</Label>
                  <Select value={selectedGuest} onValueChange={setSelectedGuest}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select guest" />
                    </SelectTrigger>
                    <SelectContent>
                      {guests.map((guest) => (
                        <SelectItem key={guest.id} value={guest.id}>
                          {guest.full_name} - Room {guest.rooms?.room_number}
                          {guest.bed_number && ` (Bed ${guest.bed_number})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Date *</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Month *</Label>
                  <Input
                    type="month"
                    value={format(new Date(paymentMonth), "yyyy-MM")}
                    onChange={(e) => setPaymentMonth(e.target.value + "-01")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    placeholder="Add any notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button onClick={handleAddPayment} className="w-full">
                  Record Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by guest or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-foreground">
                        {payment.guests?.full_name}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        Room {payment.rooms?.room_number}
                        {payment.guests?.bed_number && ` - Bed ${payment.guests.bed_number}`}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(payment.payment_date), "dd MMM yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </div>
                      {payment.payment_method && (
                        <div className="bg-accent text-accent-foreground px-2 py-1 rounded text-xs">
                          {payment.payment_method}
                        </div>
                      )}
                    </div>

                    <div className="text-sm">
                      <span className="text-muted-foreground">For:</span>{" "}
                      <span className="font-medium">
                        {format(new Date(payment.payment_month), "MMMM yyyy")}
                      </span>
                    </div>

                    {payment.notes && (
                      <p className="text-sm text-muted-foreground italic">
                        Note: {payment.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePayment(payment.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredPayments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No payments recorded yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
