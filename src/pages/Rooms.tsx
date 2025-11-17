import { useState, useEffect, useMemo } from "react";
import { Plus, BedDouble, Users, IndianRupee, Search, Filter } from "lucide-react";
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
import { RoomDetailsDialog } from "@/components/RoomDetailsDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    roomTypes: [] as string[],
    statuses: [] as string[],
  });

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch = 
        room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.room_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.monthly_rent.toString().includes(searchQuery);

      const matchesType = filters.roomTypes.length === 0 || filters.roomTypes.includes(room.room_type);
      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(room.status);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [rooms, searchQuery, filters]);

  const toggleFilter = (category: "roomTypes" | "statuses", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((item) => item !== value)
        : [...prev[category], value],
    }));
  };

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
          onClick={() => {
            setSelectedRoom(room);
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">Room Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage all your PG rooms</p>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 w-full sm:w-auto">
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
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by room number, type, status, or rent..."
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
                  {(filters.roomTypes.length + filters.statuses.length > 0) && (
                    <Badge variant="secondary" className="ml-2">
                      {filters.roomTypes.length + filters.statuses.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Room Type</h4>
                    <div className="space-y-2">
                      {["Single", "Double", "Sharing"].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={filters.roomTypes.includes(type)}
                            onCheckedChange={() => toggleFilter("roomTypes", type)}
                          />
                          <label
                            htmlFor={`type-${type}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Status</h4>
                    <div className="space-y-2">
                      {["vacant", "occupied"].map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={filters.statuses.includes(status)}
                            onCheckedChange={() => toggleFilter("statuses", status)}
                          />
                          <label
                            htmlFor={`status-${status}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                          >
                            {status}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  {(filters.roomTypes.length + filters.statuses.length > 0) && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setFilters({ roomTypes: [], statuses: [] })}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No rooms found matching your criteria</p>
          </div>
        )}
      </div>

      {selectedRoom && (
        <RoomDetailsDialog
          room={selectedRoom}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onUpdate={fetchRooms}
        />
      )}
    </div>
  );
};

export default Rooms;
