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
import { Building2 } from 'lucide-react';

export const FirstPropertySetup = () => {
  const { properties, loading, refreshProperties, setSelectedProperty } = useProperty();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([{ ...formData, owner_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Property created successfully!');
      
      // Auto-select the newly created property
      if (data) {
        setSelectedProperty(data);
      }
      
      await refreshProperties();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  if (loading) return null;
  if (properties.length > 0) return null;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">Welcome!</DialogTitle>
          <DialogDescription className="text-center">
            Let's get started by adding your first property. You can add more properties later.
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
                placeholder="e.g., Downtown Hostel, Main Building"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter the property address"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">
              Create Property
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};