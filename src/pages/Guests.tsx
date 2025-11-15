import { useState, useEffect } from "react";
import { Plus, User, Phone, Calendar, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProperty } from "@/contexts/PropertyContext";

interface Guest {
  id: string;
  full_name: string;
  phone: string;
  room_id: string | null;
  joining_date: string;
  monthly_rent: number;
  payment_status: string;
}

const Guests = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedProperty } = useProperty();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: "",
    phone: "",
    roomNumber: "",
    joiningDate: "",
    monthlyRent: "",
  });

  useEffect(() => {
    if (user && selectedProperty) {
      fetchData();
    }
  }, [user, selectedProperty]);

  const fetchData = async () => {
    if (!selectedProperty) return;
    
    try {
      const [guestsRes, roomsRes] = await Promise.all([
        supabase.from("guests").select("*").eq("status", "active").eq("property_id", selectedProperty.id).order("full_name", { ascending: true }),
        supabase.from("rooms").select("id, room_number").eq("property_id", selectedProperty.id),
      ]);

      if (guestsRes.error) throw guestsRes.error;
      if (roomsRes.error) throw roomsRes.error;

      setGuests(guestsRes.data || []);
      setRooms(roomsRes.data || []);
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

  const handleAddGuest = async () => {
    if (!newGuest.name || !newGuest.phone || !newGuest.roomNumber || !newGuest.monthlyRent || !selectedProperty) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("guests").insert({
        owner_id: user?.id,
        property_id: selectedProperty.id,
        full_name: newGuest.name,
        phone: newGuest.phone,
        room_id: newGuest.roomNumber,
        joining_date: newGuest.joiningDate || new Date().toISOString().split('T')[0],
        monthly_rent: parseFloat(newGuest.monthlyRent),
        payment_status: "pending",
        status: "active",
      });

      if (error) throw error;
      
      toast({
        title: "Guest Added",
        description: `${newGuest.name} has been added successfully`,
      });

      setIsAddDialogOpen(false);
      setNewGuest({ name: "", phone: "", roomNumber: "", joiningDate: "", monthlyRent: "" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoomNumber = (roomId: string | null) => {
    if (!roomId) return "Not Assigned";
    const room = rooms.find(r => r.id === roomId);
    return room ? room.room_number : "Unknown";
  };

  const GuestCard = ({ guest }: { guest: Guest }) => (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {guest.full_name}
          </CardTitle>
          <Badge variant={guest.payment_status === "paid" ? "default" : "destructive"}>
            {guest.payment_status === "paid" ? "Paid" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{guest.phone}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Room</span>
            <span className="font-medium">{getRoomNumber(guest.room_id)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Joined</span>
            <span className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(guest.joining_date).toLocaleDateString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly Rent</span>
            <span className="font-medium flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {Number(guest.monthly_rent).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => toast({
            title: "Coming Soon",
            description: "Guest details view will be available soon",
          })}
        >
          View Details
        </Button>
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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Guest Management</h1>
            <p className="text-muted-foreground">Manage all your PG guests</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Guest</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new guest to your PG
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="guest-name">Full Name</Label>
                  <Input
                    id="guest-name"
                    placeholder="e.g., John Doe"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-phone">Phone Number</Label>
                  <Input
                    id="guest-phone"
                    placeholder="e.g., +91 98765 43210"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-room">Room</Label>
                  <Select
                    value={newGuest.roomNumber}
                    onValueChange={(value) => setNewGuest({ ...newGuest, roomNumber: value })}
                  >
                    <SelectTrigger id="guest-room">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          Room {room.room_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joining-date">Joining Date</Label>
                  <Input
                    id="joining-date"
                    type="date"
                    value={newGuest.joiningDate}
                    onChange={(e) => setNewGuest({ ...newGuest, joiningDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-rent">Monthly Rent (₹)</Label>
                  <Input
                    id="guest-rent"
                    type="number"
                    placeholder="e.g., 5000"
                    value={newGuest.monthlyRent}
                    onChange={(e) => setNewGuest({ ...newGuest, monthlyRent: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddGuest} className="w-full">
                Add Guest
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{guests.length}</div>
              <p className="text-sm text-muted-foreground">Total Guests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">
                {guests.filter(g => g.payment_status === "pending").length}
              </div>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Guests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guests.map((guest) => (
            <GuestCard key={guest.id} guest={guest} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Guests;
