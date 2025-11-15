import { useProperty } from '@/contexts/PropertyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export const PropertySelector = () => {
  const { properties, selectedProperty, setSelectedProperty } = useProperty();

  if (properties.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedProperty?.id}
        onValueChange={(value) => {
          const property = properties.find((p) => p.id === value);
          if (property) setSelectedProperty(property);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select property" />
        </SelectTrigger>
        <SelectContent>
          {properties.map((property) => (
            <SelectItem key={property.id} value={property.id}>
              {property.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};