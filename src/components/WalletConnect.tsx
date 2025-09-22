import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Info } from 'lucide-react';

interface WalletConnectProps {
  variant?: 'full' | 'compact' | 'button-only';
  className?: string;
  authenticationOnly?: boolean;
}

/**
 * Legacy WalletConnect component - replaced with fiat-anchored registry system
 * Displays registry mode status instead of wallet connection
 */
export function WalletConnect({ 
  variant = 'full',
  className = '',
  authenticationOnly = false
}: WalletConnectProps) {

  // Legacy component - wallet functionality has been removed
  // This component now shows registry mode status
  
  if (variant === 'button-only') {
    return (
      <div className={className}>
        <Badge variant="outline" className="flex items-center space-x-1 px-3 py-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Registry Mode</span>
        </Badge>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Registry Mode Active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant (default)
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Info className="h-5 w-5" />
          <span>Registry Authentication</span>
        </CardTitle>
        <CardDescription>
          Fiat-anchored carbon credit registry with blockchain verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-4 w-4 text-blue-600" />
          <div className="text-sm text-blue-800">
            Registry Mode: All transactions are processed through secure payment systems with blockchain records for transparency. 
            No external crypto wallets required.
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">Registry Mode Active</span>
          </div>
          <Badge variant="secondary">Fiat-Anchored</Badge>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Status</label>
            <div className="text-sm text-green-600 mt-1">Authenticated for Registry Access</div>
          </div>
          
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">Payment Methods</label>
            <div className="text-sm text-gray-700 mt-1">Credit Card, Bank Transfer, Digital Payments</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}