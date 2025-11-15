import { useState } from "react";
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

interface Guest {
  id: string;
  name: string;
  phone: string;
  roomNumber: string;
  joiningDate: string;
  monthlyRent: number;
  paymentStatus: "paid" | "pending";
}

const Guests = () => {
  const { toast } = useToast();
  const [guests, setGuests] = useState<Guest[]>([
    { id: "1", name: "Rahul Sharma", phone: "+91 98765 43210", roomNumber: "101", joiningDate: "2024-01-15", monthlyRent: 5000, paymentStatus: "paid" },
    { id: "2", name: "Priya Patel", phone: "+91 98765 43211", roomNumber: "102", joiningDate: "2024-02-01", monthlyRent: 7000, paymentStatus: "pending" },
    { id: "3", name: "Amit Kumar", phone: "+91 98765 43212", roomNumber: "102", joiningDate: "2024-02-01", monthlyRent: 7000, paymentStatus: "paid" },
    { id: "4", name: "Sneha Reddy", phone: "+91 98765 43213", roomNumber: "104", joiningDate: "2024-01-20", monthlyRent: 4000, paymentStatus: "pending" },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: "",
    phone: "",
    roomNumber: "",
    joiningDate: "",
    monthlyRent: "",
  });

  const handleAddGuest = () => {
    if (!newGuest.name || !newGuest.phone || !newGuest.roomNumber || !newGuest.monthlyRent) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const guest: Guest = {
      id: (guests.length + 1).toString(),
      name: newGuest.name,
      phone: newGuest.phone,
      roomNumber: newGuest.roomNumber,
      joiningDate: newGuest.joiningDate || new Date().toISOString().split('T')[0],
      monthlyRent: parseInt(newGuest.monthlyRent),
      paymentStatus: "pending",
    };

    setGuests([...guests, guest]);
    setIsAddDialogOpen(false);
    setNewGuest({ name: "", phone: "", roomNumber: "", joiningDate: "", monthlyRent: "" });
    
    toast({
      title: "Guest Added",
      description: `${guest.name} has been added successfully`,
    });
  };

  const GuestCard = ({ guest }: { guest: Guest }) => (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {guest.name}
          </CardTitle>
          <Badge variant={guest.paymentStatus === "paid" ? "default" : "destructive"}>
            {guest.paymentStatus === "paid" ? "Paid" : "Pending"}
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
            <span className="font-medium">{guest.roomNumber}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Joined</span>
            <span className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(guest.joiningDate).toLocaleDateString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly Rent</span>
            <span className="font-medium flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {guest.monthlyRent.toLocaleString('en-IN')}
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
                  <Label htmlFor="guest-room">Room Number</Label>
                  <Input
                    id="guest-room"
                    placeholder="e.g., 101"
                    value={newGuest.roomNumber}
                    onChange={(e) => setNewGuest({ ...newGuest, roomNumber: e.target.value })}
                  />
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
                {guests.filter(g => g.paymentStatus === "pending").length}
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
