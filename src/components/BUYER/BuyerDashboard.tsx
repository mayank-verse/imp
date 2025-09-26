import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { supabase } from '../../utils/supabase/client';
import { ShoppingCart, Award, TrendingUp, Leaf, ExternalLink, Calendar, MapPin, CreditCard, FileText, DollarSign, BarChart3, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { ApiService } from '../../utils/frontend/api-service'; // Import ApiService
// Wallet functionality removed - using fiat-anchored registry
import { EnhancedMarketplace } from '../EnhancedMarketplace';
import { RetirementCertificate } from '../RetirementCertificate';
import PaymentForm from './PaymentForm'; // Note the named import change

interface User {
    id: string;
    email: string;
    user_metadata: {
        name: string;
        role: string;
    };
}

interface CarbonCredit {
    id: string;
    projectId: string;
    carbonCredits: number;
    healthScore: number;
    evidenceCid: string;
    verifiedAt: string;
    ownerId?: string;
    availableAmount?: number;
}

interface Retirement {
    id: string;
    creditId: string;
    buyerId: string;
    amount: number;
    reason: string;
    retiredAt: string;
    onChainTxHash: string;
}

interface BuyerDashboardProps {
    user: User;
}

export function BuyerDashboard({ user }: BuyerDashboardProps) {
    const [availableCredits, setAvailableCredits] = useState<CarbonCredit[]>([]);
    const [selectedCredit, setSelectedCredit] = useState<CarbonCredit | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
    const [showRetirementDialog, setShowRetirementDialog] = useState(false);
    const [purchaseAmount, setPurchaseAmount] = useState(0);
    const [retirementReason, setRetirementReason] = useState('');
    const [userBalance, setUserBalance] = useState(0);
    const [retirements, setRetirements] = useState<Retirement[]>([]);
    const [retiring, setRetiring] = useState(false);
    const [selectedRetirement, setSelectedRetirement] = useState<Retirement | null>(null);
    const [showCertificate, setShowCertificate] = useState(false);
    const [orderData, setOrderData] = useState<{ amount: number; orderId: string } | null>(null); // New state for server-generated order details
    const [isOrderCreating, setIsOrderCreating] = useState(false); // New state for loading during order creation

    // Unused states removed: purchasing, paymentTransactions

    useEffect(() => {
        fetchAvailableCredits();
        fetchUserBalance();
        fetchRetirementHistory();
        // Removed fetchPaymentHistory as it used the mock service
    }, []);

    const fetchAvailableCredits = async () => {
        try {
            const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/credits/available`, {
                headers: {
                    'Authorization': `Bearer ${publicAnonKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch available credits');
            }

            const data = await response.json();
            setAvailableCredits(data.availableCredits || []);
        } catch (error) {
            console.error('Error fetching available credits:', error);
            toast.error('Failed to load available credits');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserBalance = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/credits/balance`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserBalance(data.balance || 0);
            }
        } catch (error) {
            console.error('Error fetching user balance:', error);
        }
    };

    const fetchRetirementHistory = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/credits/retirements`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRetirements(data.retirements || []);
            }
        } catch (error) {
            console.error('Error fetching retirement history:', error);
        }
    };

    const handleRetirement = async () => {
        if (!selectedCredit || purchaseAmount <= 0 || !retirementReason.trim()) return;

        setRetiring(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Please sign in to retire credits');
                return;
            }

            const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/credits/retire`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    amount: purchaseAmount,
                    reason: retirementReason
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to retire credits');
            }

            const data = await response.json();
            toast.success(`Successfully retired ${purchaseAmount} tCO₂e credits! Permanent record created on blockchain.`);

            // Refresh data
            await fetchUserBalance();
            await fetchRetirementHistory();

            setShowRetirementDialog(false);
            setPurchaseAmount(0);
            setRetirementReason('');
            setSelectedCredit(null);
        } catch (error) {
            console.error('Error retiring credits:', error);
            toast.error(`Failed to retire credits: ${error}`);
        } finally {
            setRetiring(false);
        }
    };

    const openPurchaseDialog = (credit: CarbonCredit) => {
        setSelectedCredit(credit);
        setPurchaseAmount(Math.min(credit.carbonCredits, 50));
        setOrderData(null); // Reset order data when opening dialog
        setShowPurchaseDialog(true);
    };

    const handleInitiatePurchase = async () => {
        if (!selectedCredit || purchaseAmount <= 0) {
            toast.error('Please select a credit and enter a valid purchase amount.');
            return;
        }

        setIsOrderCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Please sign in to make a purchase.');
                setIsOrderCreating(false);
                return;
            }

            const response = await ApiService.createPaymentIntent(selectedCredit.id, purchaseAmount);
            
            if (response && response.orderId && response.amount) {
                setOrderData({ amount: response.amount, orderId: response.orderId });
            } else {
                throw new Error('Failed to create payment intent: Invalid response from server.');
            }
        } catch (error: any) { // Cast error to any
            console.error('Error initiating purchase:', error);
            toast.error(`Failed to initiate purchase: ${error.message || 'Unknown error'}`);
        } finally {
            setIsOrderCreating(false);
        }
    };

    const openRetirementDialog = (credit: CarbonCredit) => {
        setSelectedCredit(credit);
        setPurchaseAmount(Math.min(userBalance, 25));
        setRetirementReason('');
        setShowRetirementDialog(true);
    };

    const getHealthScoreColor = (score: number) => {
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getHealthScoreLabel = (score: number) => {
        if (score >= 0.8) return 'Premium Quality';
        if (score >= 0.6) return 'Standard Quality';
        return 'Basic Quality';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="space-y-0 pb-2">
                                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold flex items-center space-x-2">
                        <ShoppingCart className="h-6 w-6 text-green-600" />
                        <span>Carbon Credit Marketplace</span>
                    </h2>
                    <p className="text-gray-600">Purchase and retire verified blue carbon credits with secure fiat payments</p>
                </div>
            </div>

            {/* Enhanced Marketplace Tabs */}
            <Tabs defaultValue="marketplace" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="marketplace" className="flex items-center space-x-2">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Marketplace</span>
                    </TabsTrigger>
                    <TabsTrigger value="purchased" className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>My Credits</span>
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="marketplace">
                    <div className="space-y-6">
                        {/* Info Banner */}
                        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="bg-blue-100 rounded-full p-2">
                                        <DollarSign className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-blue-900 mb-1">Fiat-Anchored Registry</h3>
                                        <p className="text-sm text-blue-800">
                                            Purchase credits with traditional payment methods (credit card, bank transfer) while maintaining
                                            blockchain transparency. Payments are instantly transferred to project managers after platform fees.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card className="bg-gradient-to-br from-green-50 to-green-100">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
                                    <CreditCard className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-700">
                                        {userBalance.toLocaleString()} tCO₂e
                                    </div>
                                    <p className="text-xs text-green-600 mt-1">
                                        Available for retirement
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                                    <DollarSign className="h-4 w-4 text-purple-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-purple-700">
                                        N/A
                                    </div>
                                    <p className="text-xs text-purple-600 mt-1">
                                        Data not available
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
                                    <Award className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-700">
                                        {availableCredits.reduce((sum, credit) => sum + credit.carbonCredits, 0).toLocaleString()}
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">
                                        tCO₂e in marketplace
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Retired Credits</CardTitle>
                                    <Leaf className="h-4 w-4 text-teal-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-teal-700">
                                        {retirements.reduce((sum, retirement) => sum + retirement.amount, 0).toLocaleString()}
                                    </div>
                                    <p className="text-xs text-teal-600 mt-1">
                                        Your offset impact
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Available Credits Marketplace */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Available Carbon Credits</CardTitle>
                                <CardDescription>
                                    Purchase verified blue carbon credits from coastal restoration projects
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {availableCredits.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No credits available for purchase</p>
                                        <p className="text-sm mt-2">Check back later for new verified projects</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {availableCredits.map((credit) => (
                                            <Card key={credit.id} className="hover:shadow-lg transition-shadow">
                                                <CardHeader className="pb-3">
                                                    <div className="flex justify-between items-start">
                                                        <CardTitle className="text-lg">Project {credit.projectId.slice(-8)}</CardTitle>
                                                        <Badge className={`${credit.healthScore >= 0.8 ? 'bg-green-100 text-green-800' :
                                                            credit.healthScore >= 0.6 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                            {getHealthScoreLabel(credit.healthScore)}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-blue-700">
                                                            {credit.carbonCredits.toLocaleString()}
                                                        </div>
                                                        <p className="text-sm text-gray-600">tCO₂e Available</p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span>Quality Score</span>
                                                            <span className={getHealthScoreColor(credit.healthScore)}>
                                                                {(credit.healthScore * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <Progress value={credit.healthScore * 100} className="h-2" />
                                                    </div>

                                                    <div className="text-sm text-gray-600">
                                                        <div className="flex items-center justify-between">
                                                            <span>Verified:</span>
                                                            <span>{formatDate(credit.verifiedAt)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span>Evidence:</span>
                                                            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                                IPFS
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <Separator />

                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={() => openPurchaseDialog(credit)}
                                                        >
                                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                                            Purchase
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="purchased">
                    <div className="space-y-6">
                        {/* Purchased Credits Balance Section */}
                        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-green-900 mb-2">My Carbon Credits</h3>
                                        <p className="text-green-800">Manage and retire your purchased carbon credits</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-green-700">
                                            {userBalance.toLocaleString()} tCO₂e
                                        </div>
                                        <p className="text-green-600">Available for retirement</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Purchased Credits from Payment History */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Purchased Credits</CardTitle>
                                <CardDescription>
                                    Credits you have purchased grouped by project - retire them to offset your carbon footprint
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-gray-500">
                                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No credits purchased yet</p>
                                    <p className="text-sm mt-2">Visit the marketplace to purchase your first carbon credits</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Retirement History */}
                        {retirements.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Your Retirement History</CardTitle>
                                    <CardDescription>
                                        View your carbon credit retirement certificates and offset impact
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {retirements.map((retirement) => (
                                            <div key={retirement.id} className="border rounded-lg p-4 bg-green-50">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-green-900">
                                                            {retirement.amount.toLocaleString()} tCO₂e Retired
                                                        </h3>
                                                        <p className="text-sm text-gray-700 mt-1 font-medium">Reason: {retirement.reason}</p>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Retired on {formatDate(retirement.retiredAt)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge className="bg-green-100 text-green-800 mb-2">
                                                            PERMANENTLY RETIRED
                                                        </Badge>
                                                        <br />
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="h-auto p-0 text-green-700"
                                                            onClick={() => {
                                                                setSelectedRetirement(retirement);
                                                                setShowCertificate(true);
                                                            }}
                                                        >
                                                            <ExternalLink className="h-3 w-3 mr-1" />
                                                            View Certificate
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="advanced">
                    <EnhancedMarketplace user={user} />
                </TabsContent>
            </Tabs>

            {/* Purchase Dialog */}
            <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Purchase Carbon Credits</DialogTitle>
                        <DialogDescription>
                            Purchase verified blue carbon credits from Project {selectedCredit?.projectId.slice(-8)}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedCredit && (
                        <>
                            {!orderData ? (
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="purchase-amount">Amount to Purchase (tCO₂e)</Label>
                                        <Input
                                            id="purchase-amount"
                                            type="number"
                                            min="1"
                                            max={selectedCredit.carbonCredits}
                                            value={purchaseAmount}
                                            onChange={(e) => setPurchaseAmount(parseInt(e.target.value) || 0)}
                                            disabled={isOrderCreating}
                                        />
                                        <p className="text-sm text-gray-500">
                                            Maximum: {selectedCredit.carbonCredits.toLocaleString()} tCO₂e
                                        </p>
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <Button variant="outline" onClick={() => setShowPurchaseDialog(false)} disabled={isOrderCreating}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleInitiatePurchase}
                                            disabled={purchaseAmount <= 0 || purchaseAmount > selectedCredit.carbonCredits || isOrderCreating}
                                        >
                                            {isOrderCreating ? 'Processing...' : 'Proceed to Pay'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <PaymentForm
                                    amount={orderData.amount}
                                    orderId={orderData.orderId}
                                    onSuccess={() => {
                                        toast.success('Payment successful!');
                                        fetchUserBalance();
                                        fetchAvailableCredits();
                                        setShowPurchaseDialog(false);
                                        setOrderData(null); // Reset order data
                                    }}
                                    onCancel={() => {
                                        toast.info('Payment cancelled.');
                                        setOrderData(null); // Reset order data to show initial purchase form
                                    }}
                                />
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Retirement Dialog */}
            <Dialog open={showRetirementDialog} onOpenChange={setShowRetirementDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Retire Carbon Credits</DialogTitle>
                        <DialogDescription>
                            Permanently retire carbon credits to offset your carbon footprint
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-green-800">
                                <strong>Available Balance:</strong> {userBalance.toLocaleString()} tCO₂e credits
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="retirement-amount">Amount to Retire (tCO₂e)</Label>
                            <Input
                                id="retirement-amount"
                                type="number"
                                min="1"
                                max={userBalance}
                                value={purchaseAmount}
                                onChange={(e) => setPurchaseAmount(parseInt(e.target.value) || 0)}
                            />
                            <p className="text-sm text-gray-500">
                                Maximum: {userBalance.toLocaleString()} tCO₂e
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="retirement-reason">Reason for Retirement</Label>
                            <Textarea
                                id="retirement-reason"
                                placeholder="e.g., Company annual carbon offset, Personal sustainability goal, Event carbon neutrality..."
                                value={retirementReason}
                                onChange={(e) => setRetirementReason(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="bg-red-50 rounded-lg p-4 text-sm">
                            <p className="font-medium text-red-800">Important Notice</p>
                            <p className="text-red-700 mt-1">
                                Retired credits cannot be transferred or sold. This action is permanent and will be recorded on the blockchain.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => setShowRetirementDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRetirement}
                                disabled={purchaseAmount <= 0 || !retirementReason.trim() || retiring}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Leaf className="h-4 w-4 mr-2" />
                                {retiring ? 'Retiring...' : 'Retire Credits'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Retirement Certificate Dialog */}
            {selectedRetirement && (
                <RetirementCertificate
                    retirement={selectedRetirement}
                    user={user}
                    isOpen={showCertificate}
                    onClose={() => {
                        setShowCertificate(false);
                        setSelectedRetirement(null);
                    }}
                />
            )}
        </div>
    );
}
