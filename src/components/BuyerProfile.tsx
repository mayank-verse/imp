import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, Avatar as AvatarFallback, Avatar as AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { supabase } from '../utils/supabase/client';
import { mockPaymentService } from '../utils/payments/mock-payment-service';
import { 
  User, 
  Building2, 
  CreditCard, 
  Settings, 
  Target, 
  Bell, 
  Eye, 
  EyeOff, 
  Upload, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Camera,
  Award,
  Leaf,
  TrendingUp,
  ShoppingCart,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: string;
  };
}

interface BuyerProfileProps {
  user: User;
}

interface BuyerProfileData {
  // Personal/Company Information
  name: string;
  email: string;
  phone: string;
  organizationType: string; // individual, corporation, ngo, government
  organizationName: string;
  position: string;
  website: string;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  
  // Sustainability Goals
  annualCarbonTarget: number;
  offsetGoals: string;
  sustainabilityCommitments: string;
  reportingRequirements: string;
  
  // Payment Information
  preferredPaymentMethod: string;
  billingAddress: string;
  vatNumber: string;
  companyRegistration: string;
  
  // Preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  monthlyReports: boolean;
  priceAlerts: boolean;
  newProjectAlerts: boolean;
  
  // Verification Status
  emailVerified: boolean;
  phoneVerified: boolean;
  organizationVerified: boolean;
  paymentVerified: boolean;
}

export function BuyerProfile({ user }: BuyerProfileProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [profileData, setProfileData] = useState<BuyerProfileData>({
    // Personal/Company Information
    name: user.user_metadata.name || '',
    email: user.email || '',
    phone: '',
    organizationType: 'corporation',
    organizationName: '',
    position: '',
    website: '',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    
    // Sustainability Goals
    annualCarbonTarget: 0,
    offsetGoals: '',
    sustainabilityCommitments: '',
    reportingRequirements: '',
    
    // Payment Information
    preferredPaymentMethod: 'credit_card',
    billingAddress: '',
    vatNumber: '',
    companyRegistration: '',
    
    // Preferences
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    monthlyReports: true,
    priceAlerts: true,
    newProjectAlerts: true,
    
    // Verification Status
    emailVerified: true,
    phoneVerified: false,
    organizationVerified: false,
    paymentVerified: false,
  });

  const [stats, setStats] = useState({
    totalSpent: 0,
    creditsPurchased: 0,
    creditsRetired: 0,
    transactionCount: 0,
    averagePrice: 0,
    joinDate: new Date().toISOString()
  });

  useEffect(() => {
    loadProfileData();
    loadStats();
  }, []);

  const loadProfileData = async () => {
    try {
      // In a real implementation, this would load from the database
      const savedProfile = localStorage.getItem(`buyer_profile_${user.id}`);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfileData(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const transactions = await mockPaymentService.getBuyerTransactions(user.id);
      const completedTransactions = transactions.filter(t => t.status === 'completed');
      
      const totalSpent = completedTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
      const creditsPurchased = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
      const averagePrice = creditsPurchased > 0 ? totalSpent / creditsPurchased : 0;
      
      setStats({
        totalSpent,
        creditsPurchased,
        creditsRetired: Math.floor(creditsPurchased * 0.7), // Mock: assume 70% retired
        transactionCount: completedTransactions.length,
        averagePrice,
        joinDate: '2024-03-15T00:00:00Z' // Mock join date
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveProfileData = async () => {
    setSaving(true);
    try {
      // In a real implementation, this would save to the database
      localStorage.setItem(`buyer_profile_${user.id}`, JSON.stringify(profileData));
      
      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          phone: profileData.phone,
          organization: profileData.organizationName,
          organization_type: profileData.organizationType
        }
      });

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
    }
  };

  const getVerificationStatus = () => {
    const verifications = [
      profileData.emailVerified,
      profileData.phoneVerified,
      profileData.organizationVerified,
      profileData.paymentVerified
    ];
    const completed = verifications.filter(Boolean).length;
    return { completed, total: verifications.length, percentage: (completed / verifications.length) * 100 };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getCarbonOffsetProgress = () => {
    if (profileData.annualCarbonTarget === 0) return 0;
    return Math.min((stats.creditsRetired / profileData.annualCarbonTarget) * 100, 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const verificationStatus = getVerificationStatus();
  const carbonProgress = getCarbonOffsetProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Profile & Settings</h2>
          <p className="text-gray-600">Manage your account information, sustainability goals, and preferences</p>
        </div>
        <Button onClick={saveProfileData} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Profile Overview Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" alt={profileData.name} />
                <AvatarFallback className="text-xl bg-blue-600 text-white">
                  {getInitials(profileData.name)}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="sm" 
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                variant="outline"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-semibold">{profileData.name}</h3>
                <Badge variant="secondary">Carbon Credit Buyer</Badge>
                {profileData.organizationVerified && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{profileData.email}</span>
                </div>
                {profileData.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{profileData.phone}</span>
                  </div>
                )}
                {profileData.organizationName && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span>{profileData.organizationName}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Joined {formatDate(stats.joinDate)}</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-700">${stats.totalSpent.toFixed(0)}</div>
                  <div className="text-xs text-gray-600">Total Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-700">{stats.creditsPurchased}</div>
                  <div className="text-xs text-gray-600">Credits Bought</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-700">{stats.creditsRetired}</div>
                  <div className="text-xs text-gray-600">Credits Retired</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-700">${stats.averagePrice.toFixed(1)}</div>
                  <div className="text-xs text-gray-600">Avg Price/tCO₂e</div>
                </div>
              </div>
            </div>

            {/* Carbon Offset Progress */}
            <div className="text-center min-w-[120px]">
              <div className="text-2xl font-bold text-green-700">{carbonProgress.toFixed(0)}%</div>
              <div className="text-sm text-gray-600 mb-2">Annual Goal</div>
              <div className="w-16 h-16 mx-auto relative">
                <div className="w-full h-full rounded-full border-4 border-gray-200 relative">
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-green-600 transition-all duration-300"
                    style={{ 
                      clipPath: `polygon(0 0, 100% 0, 100% ${100-carbonProgress}%, 0 ${100-carbonProgress}%)`,
                      transform: 'rotate(-90deg)'
                    }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.creditsRetired}/{profileData.annualCarbonTarget || 0} tCO₂e
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Sections */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Personal</span>
          </TabsTrigger>
          <TabsTrigger value="sustainability" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Goals</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Payment</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal & Organization Information</CardTitle>
              <CardDescription>
                Update your personal details and organization information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled
                    />
                    {profileData.emailVerified && (
                      <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 12345 67890"
                    />
                    {profileData.phoneVerified ? (
                      <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                    ) : (
                      <Button variant="link" size="sm" className="absolute right-0 top-0 h-full">
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="orgType">Organization Type</Label>
                  <Select 
                    value={profileData.organizationType} 
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, organizationType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="ngo">NGO</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {profileData.organizationType !== 'individual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={profileData.organizationName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, organizationName: e.target.value }))}
                      placeholder="Your company/organization name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="position">Your Position</Label>
                    <Input
                      id="position"
                      value={profileData.position}
                      onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="e.g., Sustainability Manager"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profileData.website}
                      onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyReg">Company Registration</Label>
                    <Input
                      id="companyReg"
                      value={profileData.companyRegistration}
                      onChange={(e) => setProfileData(prev => ({ ...prev, companyRegistration: e.target.value }))}
                      placeholder="Registration number"
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Address Information</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Textarea
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter your complete address"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select 
                      value={profileData.state} 
                      onValueChange={(value) => setProfileData(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delhi">Delhi</SelectItem>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                        <SelectItem value="gujarat">Gujarat</SelectItem>
                        <SelectItem value="kerala">Kerala</SelectItem>
                        <SelectItem value="maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
                        <SelectItem value="west-bengal">West Bengal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pincode">PIN Code</Label>
                    <Input
                      id="pincode"
                      value={profileData.pincode}
                      onChange={(e) => setProfileData(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder="123456"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sustainability Goals */}
        <TabsContent value="sustainability">
          <Card>
            <CardHeader>
              <CardTitle>Sustainability Goals & Commitments</CardTitle>
              <CardDescription>
                Set your carbon offset targets and sustainability objectives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Carbon Neutrality Goals</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Set your annual carbon offset targets and track your progress towards net-zero emissions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carbonTarget">Annual Carbon Offset Target (tCO₂e)</Label>
                  <Input
                    id="carbonTarget"
                    type="number"
                    value={profileData.annualCarbonTarget}
                    onChange={(e) => setProfileData(prev => ({ ...prev, annualCarbonTarget: parseFloat(e.target.value) || 0 }))}
                    placeholder="e.g., 1000"
                  />
                  <p className="text-sm text-gray-500">
                    Current progress: {stats.creditsRetired} tCO₂e ({carbonProgress.toFixed(1)}%)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reportingReq">Reporting Requirements</Label>
                  <Select 
                    value={profileData.reportingRequirements} 
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, reportingRequirements: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reporting standard" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gri">GRI Standards</SelectItem>
                      <SelectItem value="cdp">CDP Reporting</SelectItem>
                      <SelectItem value="tcfd">TCFD Framework</SelectItem>
                      <SelectItem value="sasb">SASB Standards</SelectItem>
                      <SelectItem value="internal">Internal Reporting Only</SelectItem>
                      <SelectItem value="none">No Specific Requirements</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="offsetGoals">Offset Goals & Strategy</Label>
                <Textarea
                  id="offsetGoals"
                  value={profileData.offsetGoals}
                  onChange={(e) => setProfileData(prev => ({ ...prev, offsetGoals: e.target.value }))}
                  placeholder="Describe your carbon offset strategy, preferred project types, and timeline..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sustainabilityCommitments">Sustainability Commitments</Label>
                <Textarea
                  id="sustainabilityCommitments"
                  value={profileData.sustainabilityCommitments}
                  onChange={(e) => setProfileData(prev => ({ ...prev, sustainabilityCommitments: e.target.value }))}
                  placeholder="Describe your broader sustainability commitments, net-zero pledges, and ESG goals..."
                  rows={4}
                />
              </div>

              {/* Progress Visualization */}
              {profileData.annualCarbonTarget > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Annual Carbon Offset Progress</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress towards {profileData.annualCarbonTarget.toLocaleString()} tCO₂e goal</span>
                      <span className="font-medium">{carbonProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={carbonProgress} className="h-3" />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{stats.creditsRetired.toLocaleString()} tCO₂e retired</span>
                      <span>{(profileData.annualCarbonTarget - stats.creditsRetired).toLocaleString()} tCO₂e remaining</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Information */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment & Billing Information</CardTitle>
              <CardDescription>
                Manage your payment methods and billing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Secure Payment Processing</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your payment information is encrypted and secure. We support multiple payment methods for your convenience.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Preferred Payment Method</Label>
                  <Select 
                    value={profileData.preferredPaymentMethod} 
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, preferredPaymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="net_banking">Net Banking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT/Tax Number (Optional)</Label>
                  <Input
                    id="vatNumber"
                    value={profileData.vatNumber}
                    onChange={(e) => setProfileData(prev => ({ ...prev, vatNumber: e.target.value }))}
                    placeholder="Enter VAT/GST number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="billingAddress">Billing Address</Label>
                <Textarea
                  id="billingAddress"
                  value={profileData.billingAddress}
                  onChange={(e) => setProfileData(prev => ({ ...prev, billingAddress: e.target.value }))}
                  placeholder="Enter billing address (if different from above)"
                  rows={3}
                />
              </div>

              {/* Purchase History Summary */}
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium">Purchase Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-blue-700">{stats.transactionCount}</div>
                    <div className="text-sm text-gray-600">Transactions</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-green-700">${stats.totalSpent.toFixed(0)}</div>
                    <div className="text-sm text-gray-600">Total Spent</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-purple-700">{stats.creditsPurchased}</div>
                    <div className="text-sm text-gray-600">Credits Bought</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-orange-700">${stats.averagePrice.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Avg Price</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <div className="space-y-6">
            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how and when you receive updates about carbon credits and market activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive email updates about your purchases and account</p>
                  </div>
                  <Switch
                    checked={profileData.emailNotifications}
                    onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-600">Receive SMS alerts for important updates</p>
                  </div>
                  <Switch
                    checked={profileData.smsNotifications}
                    onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Price Alerts</Label>
                    <p className="text-sm text-gray-600">Get notified about significant price changes</p>
                  </div>
                  <Switch
                    checked={profileData.priceAlerts}
                    onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, priceAlerts: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Project Alerts</Label>
                    <p className="text-sm text-gray-600">Be the first to know about new carbon credit projects</p>
                  </div>
                  <Switch
                    checked={profileData.newProjectAlerts}
                    onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, newProjectAlerts: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Monthly Reports</Label>
                    <p className="text-sm text-gray-600">Receive monthly sustainability and offset reports</p>
                  </div>
                  <Switch
                    checked={profileData.monthlyReports}
                    onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, monthlyReports: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-gray-600">Receive newsletters and promotional content</p>
                  </div>
                  <Switch
                    checked={profileData.marketingEmails}
                    onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, marketingEmails: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Password</Label>
                    <p className="text-sm text-gray-600">Change your account password</p>
                  </div>
                  <Button variant="outline" onClick={changePassword}>
                    Change Password
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  <Button variant="outline" disabled>
                    Enable 2FA (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>
                  Manage your account data and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Download Purchase History</Label>
                    <p className="text-sm text-gray-600">Export your carbon credit purchase and retirement data</p>
                  </div>
                  <Button variant="outline">
                    <Receipt className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Export Account Data</Label>
                    <p className="text-sm text-gray-600">Download a copy of all your account data</p>
                  </div>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label className="text-red-600">Danger Zone</Label>
                  <p className="text-sm text-gray-600">These actions cannot be undone</p>
                  <Button variant="destructive" disabled>
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}