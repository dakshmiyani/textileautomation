import React from 'react';
import { Package } from 'lucide-react';
import ModulePlaceholder from '../common/ModulePlaceholder';

export default function Inventory() {
  return (
    <ModulePlaceholder
      title="Yarn & Fabric Inventory"
      description="Raw material stock levels, yarn lot tracking, warehouse storage bins, and minimum stock alerts."
      phase="Phase 2"
      icon={Package}
    />
  );
}
