import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Property {
  id: string;
  name: string;
  address: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface PropertyContextType {
  properties: Property[];
  selectedProperty: Property | null;
  setSelectedProperty: (property: Property | null) => void;
  loading: boolean;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setProperties(data || []);
      
      // Auto-select first property if none selected
      const savedPropertyId = localStorage.getItem('selectedPropertyId');
      if (savedPropertyId && data) {
        const saved = data.find(p => p.id === savedPropertyId);
        if (saved) {
          setSelectedProperty(saved);
        } else if (data.length > 0) {
          setSelectedProperty(data[0]);
          localStorage.setItem('selectedPropertyId', data[0].id);
        }
      } else if (data && data.length > 0 && !selectedProperty) {
        setSelectedProperty(data[0]);
        localStorage.setItem('selectedPropertyId', data[0].id);
      }
    } catch (error: any) {
      toast.error('Failed to fetch properties: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [user]);

  const handleSetSelectedProperty = (property: Property | null) => {
    setSelectedProperty(property);
    if (property) {
      localStorage.setItem('selectedPropertyId', property.id);
    } else {
      localStorage.removeItem('selectedPropertyId');
    }
  };

  return (
    <PropertyContext.Provider
      value={{
        properties,
        selectedProperty,
        setSelectedProperty: handleSetSelectedProperty,
        loading,
        refreshProperties: fetchProperties,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};