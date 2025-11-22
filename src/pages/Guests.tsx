import { useState, useEffect, useMemo } from "react";
import { Plus, User, Phone, Calendar, IndianRupee, Search, Filter } from "lucide-react";
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
import { GuestDetailsDialog } from "@/components/GuestDetailsDialog";
import { ExportDialog } from "@/components/ExportDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface Guest {
  id: string;
  full_name: string;
  phone: string;
  room_id: string | null;
  joining_date: string;
  monthly_rent: number;
  payment_status: string;
  status: string;
  bed_number: string | null;
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
    bedNumber: "",
    joiningDate: "",
    monthlyRent: "",
  });
  const [showHistory, setShowHistory] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    paymentStatuses: [] as string[],
  });

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const roomNumber = rooms.find(r => r.id === guest.room_id)?.room_number || "";
      const matchesSearch = 
        guest.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.monthly_rent.toString().includes(searchQuery) ||
        new Date(guest.joining_date).toLocaleDateString('en-IN').includes(searchQuery);

      const matchesPaymentStatus = filters.paymentStatuses.length === 0 || 
        filters.paymentStatuses.includes(guest.payment_status);

      return matchesSearch && matchesPaymentStatus;
    });
  }, [guests, rooms, searchQuery, filters]);

  const toggleFilter = (category: "paymentStatuses", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((item) => item !== value)
        : [...prev[category], value],
    }));
  };

  useEffect(() => {
    if (user && selectedProperty) {
      fetchData();
    }
  }, [user, selectedProperty, showHistory]);

  const fetchData = async () => {
    if (!selectedProperty) return;
    
    try {
      const [guestsRes, roomsRes] = await Promise.all([
        supabase.from("guests").select("*").eq("status", showHistory ? "moved_out" : "active").eq("property_id", selectedProperty.id).order("full_name", { ascending: true }),
        supabase.from("rooms").select("id, room_number, current_guests, max_occupancy").eq("property_id", selectedProperty.id),
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
    if (!newGuest.name || !newGuest.phone || !newGuest.roomNumber || !newGuest.bedNumber || !newGuest.monthlyRent || !selectedProperty) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check room capacity
      const selectedRoom = rooms.find(r => r.id === newGuest.roomNumber);
      if (!selectedRoom) {
        throw new Error("Room not found");
      }

      const currentOccupancy = selectedRoom.current_guests || 0;
      if (currentOccupancy >= selectedRoom.max_occupancy) {
        toast({
          title: "Room Full",
          description: `Room ${selectedRoom.room_number} is at maximum capacity (${selectedRoom.max_occupancy} guests)`,
          variant: "destructive",
        });
        return;
      }

      // Add guest
      const { error: guestError } = await supabase.from("guests").insert({
        owner_id: user?.id,
        property_id: selectedProperty.id,
        full_name: newGuest.name,
        phone: newGuest.phone,
        room_id: newGuest.roomNumber,
        bed_number: newGuest.bedNumber,
        joining_date: newGuest.joiningDate || new Date().toISOString().split('T')[0],
        monthly_rent: parseFloat(newGuest.monthlyRent),
        payment_status: "pending",
        status: "active",
      });

      if (guestError) throw guestError;

      // Update room occupancy
      const newCurrentGuests = currentOccupancy + 1;
      const newStatus = newCurrentGuests >= selectedRoom.max_occupancy ? "occupied" : selectedRoom.status;

      const { error: roomError } = await supabase
        .from("rooms")
        .update({ 
          current_guests: newCurrentGuests,
          status: newStatus
        })
        .eq("id", newGuest.roomNumber);

      if (roomError) throw roomError;
      
      toast({
        title: "Guest Added",
        description: `${newGuest.name} has been added successfully to Bed ${newGuest.bedNumber}`,
      });

      setIsAddDialogOpen(false);
      setNewGuest({ name: "", phone: "", roomNumber: "", bedNumber: "", joiningDate: "", monthlyRent: "" });
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
          {guest.bed_number && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bed</span>
              <span className="font-medium">{guest.bed_number}</span>
            </div>
          )}
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
          onClick={() => {
            setSelectedGuest(guest);
            setIsDetailsOpen(true);
          }}
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
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">Guest Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage all your PG guests</p>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={showHistory ? "default" : "outline"}
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2"
              >
                {showHistory ? "Show Active" : "Show History"}
              </Button>
              <ExportDialog
                data={guests.map(g => ({
                  full_name: g.full_name,
                  phone: g.phone,
                  room_number: getRoomNumber(g.room_id),
                  joining_date: new Date(g.joining_date).toLocaleDateString('en-IN'),
                  monthly_rent: g.monthly_rent,
                  payment_status: g.payment_status,
                }))}
                filename="guests_report"
                title="Guest Report"
                dateField="joining_date"
                csvHeaders={['full_name', 'phone', 'room_number', 'joining_date', 'monthly_rent', 'payment_status']}
                pdfColumns={[
                  { header: 'Name', dataKey: 'full_name' },
                  { header: 'Phone', dataKey: 'phone' },
                  { header: 'Room', dataKey: 'room_number' },
                  { header: 'Joined', dataKey: 'joining_date' },
                  { header: 'Rent', dataKey: 'monthly_rent' },
                  { header: 'Status', dataKey: 'payment_status' },
                ]}
              />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 w-full sm:w-auto">
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
                  <Label htmlFor="bed-number">Bed Number</Label>
                  <Input
                    id="bed-number"
                    placeholder="e.g., B1 or Bed 1"
                    value={newGuest.bedNumber}
                    onChange={(e) => setNewGuest({ ...newGuest, bedNumber: e.target.value })}
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
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, room, rent, or joining date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {filters.paymentStatuses.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {filters.paymentStatuses.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Payment Status</h4>
                    <div className="space-y-2">
                      {["paid", "pending"].map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`payment-${status}`}
                            checked={filters.paymentStatuses.includes(status)}
                            onCheckedChange={() => toggleFilter("paymentStatuses", status)}
                          />
                          <label
                            htmlFor={`payment-${status}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                          >
                            {status}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  {filters.paymentStatuses.length > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setFilters({ paymentStatuses: [] })}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {filteredGuests.map((guest) => (
            <GuestCard key={guest.id} guest={guest} />
          ))}
        </div>

        {filteredGuests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No guests found matching your criteria</p>
          </div>
        )}
      </div>

      {selectedGuest && (
        <GuestDetailsDialog
          guest={selectedGuest}
          rooms={rooms}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
};

export default Guests;
