import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { Waves, Leaf, Shield, Download, ExternalLink, Award } from 'lucide-react';

interface Retirement {
  id: string;
  creditId: string;
  buyerId: string;
  amount: number;
  reason: string;
  retiredAt: string;
  onChainTxHash: string;
}

interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: string;
  };
}

interface RetirementCertificateProps {
  retirement: Retirement;
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function RetirementCertificate({ retirement, user, isOpen, onClose }: RetirementCertificateProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const certificateNumber = `SL-RC-${retirement.id.slice(-8).toUpperCase()}`;
  const blockchainExplorerUrl = `https://testnet.snowtrace.io/tx/${retirement.onChainTxHash}`;

  const handleDownload = () => {
    // In a real implementation, this would generate and download a PDF
    window.print();
  };

  const handleViewBlockchain = () => {
    window.open(blockchainExplorerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Carbon Credit Retirement Certificate</span>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleViewBlockchain}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Certificate Content */}
        <div className="bg-white p-8 rounded-lg border-2 border-blue-200 print:shadow-none" id="certificate">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className="bg-blue-600 rounded-full p-3 mr-4">
                <Waves className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-blue-900">Samudra Ledger</h1>
                <p className="text-blue-700">Blue Carbon Registry • India</p>
              </div>
            </div>
            
            <div className="border-t-4 border-blue-600 pt-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                CARBON CREDIT RETIREMENT CERTIFICATE
              </h2>
              <p className="text-gray-600">
                Official verification of permanent carbon offset retirement
              </p>
            </div>
          </div>

          {/* Certificate Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left Column */}
            <div className="space-y-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Award className="h-6 w-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-green-900">Retirement Details</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-center bg-white rounded-lg p-4 border border-green-200">
                      <div className="text-3xl font-bold text-green-700">
                        {retirement.amount.toLocaleString()} tCO₂e
                      </div>
                      <p className="text-green-600 text-sm">Carbon Credits Permanently Retired</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Retirement Date:</p>
                        <p className="font-semibold">{formatDate(retirement.retiredAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Certificate #:</p>
                        <p className="font-semibold font-mono">{certificateNumber}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Shield className="h-6 w-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-900">Blockchain Verification</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600">Transaction Hash:</p>
                      <p className="font-mono text-xs bg-white p-2 rounded border break-all">
                        {retirement.onChainTxHash}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Network:</p>
                      <p className="font-semibold">Avalanche Fuji Testnet</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Timestamp:</p>
                      <p className="font-semibold">{formatDateTime(retirement.retiredAt)}</p>
                    </div>
                  </div>
                  
                  <Badge className="mt-3 bg-green-100 text-green-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Blockchain Verified
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Leaf className="h-6 w-6 text-purple-600 mr-2" />
                    <h3 className="text-lg font-semibold text-purple-900">Retirement Purpose</h3>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-gray-800 leading-relaxed">
                      {retirement.reason}
                    </p>
                  </div>
                  
                  <div className="mt-4 text-sm text-purple-700">
                    <p className="font-semibold">Environmental Impact:</p>
                    <p>This retirement represents the permanent removal of {retirement.amount.toLocaleString()} tonnes of CO₂ equivalent from the atmosphere through verified blue carbon projects.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Holder</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600">Name:</p>
                      <p className="font-semibold">{user.user_metadata.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email:</p>
                      <p className="font-semibold">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">User ID:</p>
                      <p className="font-mono text-xs">{user.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Role:</p>
                      <Badge variant="secondary">
                        {user.user_metadata.role === 'buyer' ? 'Carbon Credit Buyer' : user.user_metadata.role}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Project Information */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Blue Carbon Project Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Project Type:</p>
                  <p className="font-semibold">Blue Carbon Restoration</p>
                </div>
                <div>
                  <p className="text-gray-600">Ecosystem:</p>
                  <p className="font-semibold">Coastal Mangroves</p>
                </div>
                <div>
                  <p className="text-gray-600">Location:</p>
                  <p className="font-semibold">Indian Coastal Region</p>
                </div>
                <div>
                  <p className="text-gray-600">Standard:</p>
                  <p className="font-semibold">Blue Carbon Methodology</p>
                </div>
                <div>
                  <p className="text-gray-600">Registry:</p>
                  <p className="font-semibold">Samudra Ledger</p>
                </div>
                <div>
                  <p className="text-gray-600">Credit ID:</p>
                  <p className="font-mono text-xs">{retirement.creditId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Official Seals and Signatures */}
          <div className="border-t-2 border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center mb-2">
                    <Waves className="h-8 w-8 text-white" />
                  </div>
                  <div className="border-t border-gray-400 w-32 mx-auto mb-2"></div>
                </div>
                <p className="text-sm font-semibold">Registry Authority</p>
                <p className="text-xs text-gray-600">Samudra Ledger Platform</p>
                <p className="text-xs text-gray-500 mt-1">
                  Issued on {formatDate(retirement.retiredAt)}
                </p>
              </div>
              
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-green-600 rounded-full mx-auto flex items-center justify-center mb-2">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div className="border-t border-gray-400 w-32 mx-auto mb-2"></div>
                </div>
                <p className="text-sm font-semibold">Blockchain Verification</p>
                <p className="text-xs text-gray-600">Avalanche Network</p>
                <p className="text-xs text-gray-500 mt-1">
                  Immutable Record Created
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">
              This certificate confirms the permanent retirement of the specified carbon credits and cannot be transferred or resold.
              <br />
              For verification, visit the blockchain explorer using the transaction hash above.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Generated by Samudra Ledger - India's Blue Carbon Registry Platform
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}