
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ReconciliationOptionsProps {
  threshold: number;
  setThreshold: React.Dispatch<React.SetStateAction<number>>;
  keyFields: string[];
  onReconcile: () => void;
  isDisabled: boolean;
}

export function ReconciliationOptions({
  threshold,
  setThreshold,
  keyFields,
  onReconcile,
  isDisabled
}: ReconciliationOptionsProps) {
  const handleThresholdChange = (values: number[]) => {
    setThreshold(values[0]);
  };
  
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-base">Fuzzy Matching Threshold</Label>
            <span className="text-sm font-medium">{threshold}%</span>
          </div>
          <Slider
            value={[threshold]}
            min={50}
            max={100}
            step={1}
            onValueChange={handleThresholdChange}
          />
          <p className="text-xs text-muted-foreground">
            Higher value = More exact matching. Lower value = More fuzzy matching.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-base">Key Fields for Matching</Label>
          <div className="flex flex-wrap gap-2">
            {keyFields.length > 0 ? (
              keyFields.map((field, index) => (
                <div key={index} className="bg-secondary px-2 py-1 rounded-md text-xs">
                  {field}
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-amber-500 text-sm">
                <AlertTriangle className="h-4 w-4" />
                No key fields selected
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Select key fields in the column mapping section above.
          </p>
        </div>
        
        <Button 
          className="w-full" 
          onClick={onReconcile} 
          disabled={isDisabled || keyFields.length === 0}
        >
          Reconcile Data
        </Button>
        
        {keyFields.length === 0 && (
          <p className="text-xs text-destructive">
            You need to select at least one key field for matching.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
