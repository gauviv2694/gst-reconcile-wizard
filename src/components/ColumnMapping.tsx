
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash } from 'lucide-react';
import { suggestColumnMappings } from '@/utils/reconciliationUtils';

interface ColumnMappingProps {
  gstr2bHeaders: string[];
  purchaseRegisterHeaders: string[];
  onMappingChange: (mapping: Record<string, string>) => void;
  onKeyFieldsChange: (keyFields: string[]) => void;
}

export function ColumnMapping({
  gstr2bHeaders,
  purchaseRegisterHeaders,
  onMappingChange,
  onKeyFieldsChange
}: ColumnMappingProps) {
  const [mappings, setMappings] = useState<Array<{ gstr2b: string; pr: string; isKey: boolean }>>([]);
  
  // Auto-suggest mappings when headers change
  useEffect(() => {
    if (gstr2bHeaders.length > 0 && purchaseRegisterHeaders.length > 0) {
      const suggestedMappings = suggestColumnMappings(gstr2bHeaders, purchaseRegisterHeaders);
      
      // Convert to array format
      const mappingsArray = Object.entries(suggestedMappings).map(([gstr2b, pr]) => ({
        gstr2b,
        pr,
        isKey: isLikelyKeyField(gstr2b.toLowerCase())
      }));
      
      // Add at least one key field mapping if none suggested
      if (!mappingsArray.some(m => m.isKey)) {
        const possibleKeyField = gstr2bHeaders.find(h => 
          isLikelyKeyField(h.toLowerCase())
        );
        
        if (possibleKeyField) {
          const matchingPrField = purchaseRegisterHeaders.find(h => 
            h.toLowerCase().includes(possibleKeyField.toLowerCase())
          );
          
          if (matchingPrField) {
            mappingsArray.push({
              gstr2b: possibleKeyField,
              pr: matchingPrField,
              isKey: true
            });
          }
        }
      }
      
      setMappings(mappingsArray);
      updateParentComponents(mappingsArray);
    }
  }, [gstr2bHeaders, purchaseRegisterHeaders]);
  
  // Check if a field name is likely to be a key field for matching
  function isLikelyKeyField(fieldName: string): boolean {
    const keywordPatterns = [
      /invoice/i, /bill/i, /gstin/i, /gst.*no/i, /^gst$/i
    ];
    
    return keywordPatterns.some(pattern => pattern.test(fieldName));
  }
  
  // Add a new empty mapping
  const addMapping = () => {
    setMappings([...mappings, { gstr2b: '', pr: '', isKey: false }]);
  };
  
  // Remove a mapping
  const removeMapping = (index: number) => {
    const newMappings = [...mappings];
    newMappings.splice(index, 1);
    setMappings(newMappings);
    updateParentComponents(newMappings);
  };
  
  // Update a mapping
  const updateMapping = (index: number, field: 'gstr2b' | 'pr' | 'isKey', value: string | boolean) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setMappings(newMappings);
    updateParentComponents(newMappings);
  };
  
  // Notify parent components of changes
  const updateParentComponents = (currentMappings: typeof mappings) => {
    // Create mapping object
    const mappingObject: Record<string, string> = {};
    currentMappings.forEach(mapping => {
      if (mapping.gstr2b && mapping.pr) {
        mappingObject[mapping.gstr2b] = mapping.pr;
      }
    });
    
    // Extract key fields
    const keyFields = currentMappings
      .filter(mapping => mapping.isKey && mapping.gstr2b)
      .map(mapping => mapping.gstr2b);
    
    onMappingChange(mappingObject);
    onKeyFieldsChange(keyFields);
  };
  
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Column Mapping</h3>
            <Button onClick={addMapping} size="sm" variant="outline" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Add Mapping
            </Button>
          </div>
          
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center font-medium text-sm">
            <div>GSTR-2B Column</div>
            <div>Purchase Register Column</div>
            <div className="text-center">Key Field</div>
            <div></div>
          </div>
          
          <Separator />
          
          {mappings.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No mappings configured. Add a mapping or upload both files to auto-suggest.
            </div>
          ) : (
            <div className="space-y-3">
              {mappings.map((mapping, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center">
                  <Select
                    value={mapping.gstr2b}
                    onValueChange={(value) => updateMapping(index, 'gstr2b', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select GSTR-2B column" />
                    </SelectTrigger>
                    <SelectContent>
                      {gstr2bHeaders.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={mapping.pr}
                    onValueChange={(value) => updateMapping(index, 'pr', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Purchase Register column" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseRegisterHeaders.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center justify-center">
                    <Switch
                      checked={mapping.isKey}
                      onCheckedChange={(checked) => updateMapping(index, 'isKey', checked)}
                    />
                  </div>
                  
                  <Button
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeMapping(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 bg-muted/30 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Key Fields</strong> are used for matching entries between files. 
              Toggle the switch for important matching fields like Invoice Number, GSTIN, etc.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
