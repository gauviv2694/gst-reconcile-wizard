
import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ColumnMapping } from '@/components/ColumnMapping';
import { ReconciliationOptions } from '@/components/ReconciliationOptions';
import { ReconciliationResults } from '@/components/ReconciliationResults';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { performReconciliation, MatchResult } from '@/utils/reconciliationUtils';
import { File, CheckCircle, AlertTriangle } from 'lucide-react';

const Index = () => {
  // Toast notifications
  const { toast } = useToast();
  
  // File data states
  const [gstr2bData, setGstr2bData] = useState<any[]>([]);
  const [gstr2bHeaders, setGstr2bHeaders] = useState<string[]>([]);
  const [purchaseRegisterData, setPurchaseRegisterData] = useState<any[]>([]);
  const [purchaseRegisterHeaders, setPurchaseRegisterHeaders] = useState<string[]>([]);
  
  // Column mapping state
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [keyFields, setKeyFields] = useState<string[]>([]);
  
  // Reconciliation states
  const [matchingThreshold, setMatchingThreshold] = useState<number>(90);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [reconciliationResults, setReconciliationResults] = useState<MatchResult | null>(null);
  
  // Handle GSTR-2B file upload
  const handleGstr2bFileLoaded = (data: any[], headers: string[]) => {
    setGstr2bData(data);
    setGstr2bHeaders(headers);
    toast({
      title: 'GSTR-2B file loaded',
      description: `Successfully loaded ${data.length} records`,
    });
  };
  
  // Handle Purchase Register file upload
  const handlePurchaseRegisterFileLoaded = (data: any[], headers: string[]) => {
    setPurchaseRegisterData(data);
    setPurchaseRegisterHeaders(headers);
    toast({
      title: 'Purchase Register file loaded',
      description: `Successfully loaded ${data.length} records`,
    });
  };
  
  // Handle column mapping changes
  const handleMappingChange = (mapping: Record<string, string>) => {
    setColumnMappings(mapping);
  };
  
  // Handle key fields changes
  const handleKeyFieldsChange = (fields: string[]) => {
    setKeyFields(fields);
  };
  
  // Run the reconciliation process
  const handleReconcile = () => {
    if (gstr2bData.length === 0 || purchaseRegisterData.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing data',
        description: 'Please upload both GSTR-2B and Purchase Register files',
      });
      return;
    }
    
    if (keyFields.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing key fields',
        description: 'Please select at least one key field for matching',
      });
      return;
    }
    
    setIsProcessing(true);
    
    // In a real application, this would be an API call to a backend
    // For this example, we'll do the processing on the frontend
    setTimeout(() => {
      try {
        const results = performReconciliation(
          gstr2bData,
          purchaseRegisterData,
          {
            matchingThreshold,
            keyFields,
            mappedFields: columnMappings
          }
        );
        
        setReconciliationResults(results);
        toast({
          title: 'Reconciliation complete',
          description: `Found ${results.common.length} common entries, ${results.moreInGstr2b.length} only in GSTR-2B, and ${results.lessInGstr2b.length} only in Purchase Register`,
        });
      } catch (error) {
        console.error('Reconciliation error:', error);
        toast({
          variant: 'destructive',
          title: 'Reconciliation failed',
          description: 'An error occurred during reconciliation. Check the console for details.',
        });
      } finally {
        setIsProcessing(false);
      }
    }, 1500); // Simulate processing time
  };
  
  // Check if ready to reconcile
  const canReconcile = gstr2bData.length > 0 && 
    purchaseRegisterData.length > 0 && 
    keyFields.length > 0 &&
    Object.keys(columnMappings).length > 0;
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">GST Reconciliation Wizard</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Upload your GSTR-2B and Purchase Register Excel files, map the columns, 
          and get a detailed reconciliation report with fuzzy matching.
        </p>
      </div>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <File className="h-4 w-4" /> Upload Files
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Map Columns
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> View Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FileUpload 
              fileType="gstr2b" 
              label="Upload GSTR-2B File" 
              onFileLoaded={handleGstr2bFileLoaded} 
            />
            <FileUpload 
              fileType="purchaseRegister" 
              label="Upload Purchase Register File" 
              onFileLoaded={handlePurchaseRegisterFileLoaded} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="map" className="pt-6">
          <div className="space-y-8">
            <ColumnMapping 
              gstr2bHeaders={gstr2bHeaders} 
              purchaseRegisterHeaders={purchaseRegisterHeaders} 
              onMappingChange={handleMappingChange}
              onKeyFieldsChange={handleKeyFieldsChange}
            />
            
            <ReconciliationOptions 
              threshold={matchingThreshold}
              setThreshold={setMatchingThreshold}
              keyFields={keyFields}
              onReconcile={handleReconcile}
              isDisabled={!canReconcile}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="results" className="pt-6">
          <ReconciliationResults 
            results={reconciliationResults} 
            mappedFields={columnMappings}
            isLoading={isProcessing} 
          />
        </TabsContent>
      </Tabs>
      
      <Separator className="my-12" />
      
      <footer className="text-center text-sm text-muted-foreground">
        <p>GST Reconciliation Wizard | A powerful tool for tax professionals</p>
      </footer>
    </div>
  );
};

export default Index;
