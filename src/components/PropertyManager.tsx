import { useState } from 'react';
import { useProperty } from '@/contexts/PropertyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PropertyFormData {
  name: string;
  address: string;
}

export const PropertyManager = () => {
  const { properties, selectedProperty, setSelectedProperty, refreshProperties } = useProperty();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingProperty) {
        const { error } = await supabase
          .from('properties')
          .update(formData)
          .eq('id', editingProperty);

        if (error) throw error;
        toast.success('Property updated successfully');
      } else {
        const { data, error } = await supabase
          .from('properties')
          .insert([{ ...formData, owner_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        toast.success('Property added successfully');
        
        // Auto-select the newly created property
        if (data) {
          setSelectedProperty(data);
        }
      }

      await refreshProperties();
      setIsOpen(false);
      setEditingProperty(null);
      setFormData({ name: '', address: '' });
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleEdit = (property: any) => {
    setEditingProperty(property.id);
    setFormData({
      name: property.name,
      address: property.address || '',
    });
    setIsOpen(true);
  };

  const handleDelete = async () => {
    if (!deletePropertyId) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', deletePropertyId);

      if (error) throw error;

      toast.success('Property deleted successfully');
      
      if (selectedProperty?.id === deletePropertyId) {
        setSelectedProperty(null);
      }
      
      await refreshProperties();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsDeleteOpen(false);
      setDeletePropertyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Properties</h2>
        <Button
          onClick={() => {
            setEditingProperty(null);
            setFormData({ name: '', address: '' });
            setIsOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card
            key={property.id}
            className={selectedProperty?.id === property.id ? 'border-primary' : ''}
          >
            <CardHeader>
              <CardTitle>{property.name}</CardTitle>
              {property.address && (
                <CardDescription>{property.address}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(property)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeletePropertyId(property.id);
                    setIsDeleteOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProperty ? 'Edit Property' : 'Add New Property'}
            </DialogTitle>
            <DialogDescription>
              {editingProperty
                ? 'Update the property details below.'
                : 'Enter the details for your new property.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Downtown Hostel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Property address (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingProperty ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this property and all associated rooms,
              guests, and expenses. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};