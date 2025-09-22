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
import { supabase } from '../utils/supabase/client';
import { mockPaymentService } from '../utils/payments/mock-payment-service';
import { 
  User, 
  Building2, 
  CreditCard, 
  Settings, 
  Shield, 
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
  Camera
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

interface ProjectManagerProfileProps {
  user: User;
}

interface ProfileData {
  // Personal Information
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  
  // Organization Information
  organizationName: string;
  organizationType: string;
  organizationWebsite: string;
  organizationDescription: string;
  registrationNumber: string;
  taxId: string;
  
  // Payment Information
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  upiId: string;
  
  // Preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  publicProfile: boolean;
  
  // Verification Status
  emailVerified: boolean;
  phoneVerified: boolean;
  organizationVerified: boolean;
  bankVerified: boolean;
}

export function ProjectManagerProfile({ user }: ProjectManagerProfileProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    // Personal Information
    name: user.user_metadata.name || '',
    email: user.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    
    // Organization Information
    organizationName: '',
    organizationType: 'ngo',
    organizationWebsite: '',
    organizationDescription: '',
    registrationNumber: '',
    taxId: '',
    
    // Payment Information
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: user.user_metadata.name || '',
    upiId: '',
    
    // Preferences
    emailNotifications: true,
    smsNotifications: false,
    publicProfile: true,
    
    // Verification Status
    emailVerified: true,
    phoneVerified: false,
    organizationVerified: false,
    bankVerified: false,
  });

  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalCredits: 0,
    totalProjects: 0,
    joinDate: new Date().toISOString()
  });

  useEffect(() => {
    loadProfileData();
    loadStats();
  }, []);

  const loadProfileData = async () => {
    try {
      // In a real implementation, this would load from the database
      // For now, we'll use some default values and localStorage for persistence
      const savedProfile = localStorage.getItem(`profile_${user.id}`);
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
      const earnings = await mockPaymentService.getProjectManagerEarnings(user.id);
      setStats({
        totalEarnings: earnings.totalEarnings,
        totalCredits: earnings.totalCredits,
        totalProjects: Object.keys(earnings.projects).length,
        joinDate: '2024-01-15T00:00:00Z' // Mock join date
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveProfileData = async () => {
    setSaving(true);
    try {
      // In a real implementation, this would save to the database
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));
      
      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          phone: profileData.phone,
          organization: profileData.organizationName
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
      profileData.bankVerified
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Profile & Settings</h2>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
        <Button onClick={saveProfileData} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Profile Overview Card */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
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
                <Badge variant="secondary">Project Manager</Badge>
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
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-700">${stats.totalEarnings.toFixed(0)}</div>
                  <div className="text-xs text-gray-600">Total Earnings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-700">{stats.totalCredits}</div>
                  <div className="text-xs text-gray-600">Credits Sold</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-700">{stats.totalProjects}</div>
                  <div className="text-xs text-gray-600">Projects</div>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{verificationStatus.percentage.toFixed(0)}%</div>
              <div className="text-sm text-gray-600">Profile Complete</div>
              <div className="mt-2 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${verificationStatus.percentage}%` }}
                />
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
          <TabsTrigger value="organization" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Organization</span>
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
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
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
              </div>

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
                        <SelectItem value="andhra-pradesh">Andhra Pradesh</SelectItem>
                        <SelectItem value="gujarat">Gujarat</SelectItem>
                        <SelectItem value="kerala">Kerala</SelectItem>
                        <SelectItem value="maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
                        <SelectItem value="west-bengal">West Bengal</SelectItem>
                        {/* Add more states as needed */}
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

        {/* Organization Information */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>
                Details about your organization or NGO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={profileData.organizationName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, organizationName: e.target.value }))}
                    placeholder="Your organization name"
                  />
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
                      <SelectItem value="ngo">NGO</SelectItem>
                      <SelectItem value="research">Research Institution</SelectItem>
                      <SelectItem value="government">Government Agency</SelectItem>
                      <SelectItem value="private">Private Company</SelectItem>
                      <SelectItem value="cooperative">Cooperative</SelectItem>
                      <SelectItem value="community">Community Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profileData.organizationWebsite}
                    onChange={(e) => setProfileData(prev => ({ ...prev, organizationWebsite: e.target.value }))}
                    placeholder="https://yourorganization.org"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="regNumber">Registration Number</Label>
                  <Input
                    id="regNumber"
                    value={profileData.registrationNumber}
                    onChange={(e) => setProfileData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    placeholder="Org registration number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orgDescription">Organization Description</Label>
                <Textarea
                  id="orgDescription"
                  value={profileData.organizationDescription}
                  onChange={(e) => setProfileData(prev => ({ ...prev, organizationDescription: e.target.value }))}
                  placeholder="Describe your organization's mission and work"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / PAN</Label>
                <Input
                  id="taxId"
                  value={profileData.taxId}
                  onChange={(e) => setProfileData(prev => ({ ...prev, taxId: e.target.value }))}
                  placeholder="ABCDE1234F"
                />
              </div>

              {!profileData.organizationVerified && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Organization Verification Pending</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Complete your organization details to verify your account and start receiving payments.
                      </p>
                      <Button size="sm" className="mt-2" variant="outline">
                        Submit for Verification
                      </Button>
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
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Bank account details for receiving payments from carbon credit sales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Secure Payment Processing</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your payment information is encrypted and secure. We'll transfer earnings from credit sales directly to your account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={profileData.bankName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="State Bank of India"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Account Holder Name</Label>
                  <Input
                    id="accountHolder"
                    value={profileData.accountHolderName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <div className="relative">
                    <Input
                      id="accountNumber"
                      type={showPassword ? "text" : "password"}
                      value={profileData.accountNumber}
                      onChange={(e) => setProfileData(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="1234567890"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ifsc">IFSC Code</Label>
                  <Input
                    id="ifsc"
                    value={profileData.ifscCode}
                    onChange={(e) => setProfileData(prev => ({ ...prev, ifscCode: e.target.value }))}
                    placeholder="SBIN0001234"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="upi">UPI ID (Optional)</Label>
                <Input
                  id="upi"
                  value={profileData.upiId}
                  onChange={(e) => setProfileData(prev => ({ ...prev, upiId: e.target.value }))}
                  placeholder="yourname@paytm"
                />
              </div>

              {!profileData.bankVerified && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Bank Verification Required</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Verify your bank account to receive payments from carbon credit sales.
                      </p>
                      <Button size="sm" className="mt-2" variant="outline">
                        Verify Account
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <div className="space-y-6">
            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Manage your account preferences and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive email updates about your projects and payments</p>
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
                    <Label>Public Profile</Label>
                    <p className="text-sm text-gray-600">Make your profile visible to other users</p>
                  </div>
                  <Switch
                    checked={profileData.publicProfile}
                    onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, publicProfile: checked }))}
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
                    <Label>Export Data</Label>
                    <p className="text-sm text-gray-600">Download a copy of your account data</p>
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