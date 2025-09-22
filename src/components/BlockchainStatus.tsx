import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Link, Shield, ExternalLink, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface BlockchainStatusProps {
  variant?: 'badge' | 'card' | 'footer';
  showDetails?: boolean;
}

interface NetworkInfo {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorer: string;
  isTestnet: boolean;
}

export function BlockchainStatus({ variant = 'badge', showDetails = false }: BlockchainStatusProps) {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);
  
  useEffect(() => {
    // Simulate blockchain network info (in real app, this would come from the blockchain service)
    const mockNetworkInfo: NetworkInfo = {
      name: 'Avalanche Fuji Testnet',
      chainId: 43113,
      rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
      explorer: 'https://testnet.snowtrace.io',
      isTestnet: true
    };
    
    setNetworkInfo(mockNetworkInfo);
    setIsConnected(true);
  }, []);

  const handleExplorerClick = () => {
    if (networkInfo) {
      window.open(networkInfo.explorer, '_blank');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!networkInfo) {
    return null;
  }

  const StatusBadge = () => (
    <Badge 
      variant={isConnected ? "default" : "destructive"}
      className={`flex items-center space-x-1 ${isConnected ? 'bg-green-100 text-green-800' : ''}`}
    >
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
      <span>{networkInfo.name}</span>
    </Badge>
  );

  const StatusCard = () => (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Link className="h-4 w-4 text-blue-600" />
          <span>Blockchain Network</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm font-medium">{networkInfo.name}</span>
            {networkInfo.isTestnet && (
              <Badge variant="outline" className="text-xs">
                Testnet
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNetworkDialog(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Activity className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const FooterStatus = () => (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <Link className="h-4 w-4" />
      <span>Powered by</span>
      <StatusBadge />
      <span>&</span>
      <Badge variant="outline" className="text-xs">
        Supabase
      </Badge>
    </div>
  );

  const NetworkDialog = () => (
    <Dialog open={showNetworkDialog} onOpenChange={setShowNetworkDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Blockchain Network</span>
          </DialogTitle>
          <DialogDescription>
            Carbon credit transactions are secured on the Avalanche blockchain
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Network:</span>
              <div className="flex items-center space-x-2 mt-1">
                <span>{networkInfo.name}</span>
                {networkInfo.isTestnet && (
                  <Badge variant="secondary" className="text-xs">
                    Testnet
                  </Badge>
                )}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Chain ID:</span>
              <div className="mt-1">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {networkInfo.chainId}
                </code>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Explorer:</span>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-6 px-2 text-xs"
                onClick={handleExplorerClick}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                SnowTrace
              </Button>
            </div>
          </div>
          
          <div>
            <span className="font-medium text-gray-700 text-sm">RPC URL:</span>
            <div className="mt-1 flex items-center space-x-2">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                {networkInfo.rpcUrl}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => copyToClipboard(networkInfo.rpcUrl)}
              >
                Copy
              </Button>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600">
              All project registrations, MRV verifications, and carbon credit transactions 
              are immutably recorded on the Avalanche blockchain for transparency and security.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {variant === 'badge' && <StatusBadge />}
      {variant === 'card' && <StatusCard />}
      {variant === 'footer' && <FooterStatus />}
      
      {showDetails && <NetworkDialog />}
    </>
  );
}