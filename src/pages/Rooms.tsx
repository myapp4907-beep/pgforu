import { useState, useEffect } from "react";
import { Plus, BedDouble, Users, IndianRupee } from "lucide-react";
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

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  monthly_rent: number;
  status: string;
  current_guests?: number;
  max_occupancy: number;
}

const Rooms = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedProperty } = useProperty();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    number: "",
    type: "Single",
    rent: "",
    maxOccupancy: "1",
  });

  useEffect(() => {
    if (user && selectedProperty) {
      fetchRooms();
    }
  }, [user, selectedProperty]);

  const fetchRooms = async () => {
    if (!selectedProperty) return;
    
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("property_id", selectedProperty.id)
        .order("room_number", { ascending: true });

      if (error) throw error;
      setRooms(data || []);
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

  const handleAddRoom = async () => {
    if (!newRoom.number || !newRoom.rent || !selectedProperty) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("rooms").insert({
        owner_id: user?.id,
        property_id: selectedProperty.id,
        room_number: newRoom.number,
        room_type: newRoom.type,
        monthly_rent: parseFloat(newRoom.rent),
        max_occupancy: parseInt(newRoom.maxOccupancy),
        status: "vacant",
        current_guests: 0,
      });

      if (error) throw error;

      toast({
        title: "Room Added",
        description: `Room ${newRoom.number} has been added successfully`,
      });

      setIsAddDialogOpen(false);
      setNewRoom({ number: "", type: "Single", rent: "", maxOccupancy: "1" });
      fetchRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const RoomCard = ({ room }: { room: Room }) => (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-primary" />
            Room {room.room_number}
          </CardTitle>
          <Badge variant={room.status === "occupied" ? "default" : "secondary"}>
            {room.status === "occupied" ? "Occupied" : "Vacant"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium">{room.room_type}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rent</span>
            <span className="font-medium flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {Number(room.monthly_rent).toLocaleString('en-IN')}/month
            </span>
          </div>
          {room.status === "occupied" && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Occupancy</span>
              <span className="font-medium flex items-center gap-1">
                <Users className="h-3 w-3" />
                {room.current_guests}/{room.max_occupancy}
              </span>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => toast({
            title: "Coming Soon",
            description: "Room details view will be available soon",
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
            <h1 className="text-4xl font-bold text-foreground mb-2">Room Management</h1>
            <p className="text-muted-foreground">Manage all your PG rooms</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new room to your PG
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="room-number">Room Number</Label>
                  <Input
                    id="room-number"
                    placeholder="e.g., 101"
                    value={newRoom.number}
                    onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room-type">Room Type</Label>
                  <Select
                    value={newRoom.type}
                    onValueChange={(value) => setNewRoom({ ...newRoom, type: value })}
                  >
                    <SelectTrigger id="room-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Double">Double</SelectItem>
                      <SelectItem value="Sharing">Sharing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room-rent">Monthly Rent (₹)</Label>
                  <Input
                    id="room-rent"
                    type="number"
                    placeholder="e.g., 5000"
                    value={newRoom.rent}
                    onChange={(e) => setNewRoom({ ...newRoom, rent: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-occupancy">Max Occupancy</Label>
                  <Select
                    value={newRoom.maxOccupancy}
                    onValueChange={(value) => setNewRoom({ ...newRoom, maxOccupancy: value })}
                  >
                    <SelectTrigger id="max-occupancy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Person</SelectItem>
                      <SelectItem value="2">2 People</SelectItem>
                      <SelectItem value="3">3 People</SelectItem>
                      <SelectItem value="4">4 People</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddRoom} className="w-full">
                Add Room
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{rooms.length}</div>
              <p className="text-sm text-muted-foreground">Total Rooms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">
                {rooms.filter(r => r.status === "occupied").length}
              </div>
              <p className="text-sm text-muted-foreground">Occupied</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-info">
                {rooms.filter(r => r.status === "vacant").length}
              </div>
              <p className="text-sm text-muted-foreground">Vacant</p>
            </CardContent>
          </Card>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rooms;
