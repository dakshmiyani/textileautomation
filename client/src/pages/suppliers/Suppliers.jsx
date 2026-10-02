import React from 'react';
import { Truck } from 'lucide-react';
import ModulePlaceholder from '../common/ModulePlaceholder';

export default function Suppliers() {
  return (
    <ModulePlaceholder
      title="Yarn Spinners & Suppliers"
      description="Spinning mill vendors, yarn price comparisons, procurement purchase orders, and mill quality ratings."
      phase="Phase 2"
      icon={Truck}
    />
  );
}
