import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ExternalLink, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { AvalancheService, BlockchainTransaction as Transaction } from '../utils/blockchain/avalanche-service';
import { toast } from 'sonner@2.0.3';

interface BlockchainTransactionProps {
  transaction: Transaction | null;
  title: string;
  description?: string;
  onTransactionComplete?: (success: boolean) => void;
  className?: string;
}

export function BlockchainTransaction({ 
  transaction, 
  title, 
  description,
  onTransactionComplete,
  className = ''
}: BlockchainTransactionProps) {
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (transaction) {
      setCurrentStatus(transaction.status);
      updateProgress(transaction.status);

      // Poll for transaction status if pending
      if (transaction.status === 'pending') {
        const pollInterval = setInterval(async () => {
          try {
            const updatedTx = await AvalancheService.getTransactionStatus(transaction.txHash);
            if (updatedTx && updatedTx.status !== 'pending') {
              setCurrentStatus(updatedTx.status);
              updateProgress(updatedTx.status);
              clearInterval(pollInterval);
              
              if (updatedTx.status === 'confirmed') {
                toast.success('Transaction confirmed on blockchain!');
                onTransactionComplete?.(true);
              } else if (updatedTx.status === 'failed') {
                toast.error('Transaction failed on blockchain');
                onTransactionComplete?.(false);
              }
            }
          } catch (error) {
            console.error('Error polling transaction status:', error);
          }
        }, 3000);

        return () => clearInterval(pollInterval);
      }
    }
  }, [transaction]);

  const updateProgress = (status: string) => {
    switch (status) {
      case 'pending':
        setProgress(30);
        break;
      case 'confirmed':
        setProgress(100);
        break;
      case 'failed':
        setProgress(100);
        break;
      default:
        setProgress(0);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader className="h-4 w-4 animate-spin text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Transaction Pending';
      case 'confirmed':
        return 'Transaction Confirmed';
      case 'failed':
        return 'Transaction Failed';
      default:
        return 'No Transaction';
    }
  };

  const openExplorer = () => {
    if (transaction?.txHash) {
      const url = AvalancheService.getExplorerUrl(transaction.txHash);
      window.open(url, '_blank');
    }
  };

  const formatTxHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  if (!transaction) {
    return null;
  }

  return (
    <Card className={`border-l-4 border-l-blue-500 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          {getStatusIcon(currentStatus)}
          <span>{title}</span>
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={`border ${getStatusColor(currentStatus)}`}>
            {getStatusText(currentStatus)}
          </Badge>
          <span className="text-sm text-gray-500">
            {new Date(transaction.timestamp).toLocaleString()}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Transaction Hash</span>
            <code className="font-mono text-xs">
              {formatTxHash(transaction.txHash)}
            </code>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {currentStatus === 'pending' 
                ? 'Processing on Avalanche network...' 
                : currentStatus === 'confirmed'
                ? 'Successfully recorded on blockchain'
                : currentStatus === 'failed'
                ? 'Transaction failed - please try again'
                : 'Waiting for transaction'
              }
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={openExplorer}
              className="h-6 px-2 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Explorer
            </Button>
          </div>
        </div>

        {transaction.gasUsed && (
          <div className="pt-2 border-t text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Gas Used:</span>
              <span>{transaction.gasUsed.toLocaleString()}</span>
            </div>
            {transaction.blockNumber && (
              <div className="flex justify-between">
                <span>Block Number:</span>
                <span>#{transaction.blockNumber}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}