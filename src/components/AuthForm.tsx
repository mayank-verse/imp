import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import { Waves, Leaf, Shield, TrendingUp, CheckCircle, XCircle, Upload, FileImage, AlertCircle } from 'lucide-react';

export function AuthForm() {
  const [loading, setLoading] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'buyer' as 'project_manager' | 'nccr_verifier' | 'buyer'
  });
  const [nccrEligible, setNccrEligible] = useState<boolean | null>(null);
  const [nccrIdCard, setNccrIdCard] = useState<File | null>(null);
  const [idCardVerified, setIdCardVerified] = useState<boolean | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) {
        toast.error(`Sign in failed: ${error.message}`);
      } else {
        toast.success('Signed in successfully!');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('An unexpected error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const checkNCCREligibility = async (email: string) => {
    if (!email || signUpData.role !== 'nccr_verifier') {
      setNccrEligible(null);
      return;
    }

    setCheckingEligibility(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/check-nccr-eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      setNccrEligible(result.isAllowed);
      
      if (!result.isAllowed) {
        toast.warning(result.message);
      }
    } catch (error) {
      console.error('NCCR eligibility check error:', error);
      setNccrEligible(false);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleIdCardUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingIdCard(true);
    try {
      const formData = new FormData();
      formData.append('idCard', file);
      formData.append('email', signUpData.email);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/verify-nccr-id`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setIdCardVerified(true);
        setNccrIdCard(file);
        toast.success('NCCR ID card uploaded and verified successfully!');
      } else {
        setIdCardVerified(false);
        toast.error(result.error || 'Failed to verify NCCR ID card');
      }
    } catch (error) {
      console.error('ID card upload error:', error);
      setIdCardVerified(false);
      toast.error('Error uploading NCCR ID card');
    } finally {
      setUploadingIdCard(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(`Password reset failed: ${error.message}`);
      } else {
        toast.success('Password reset email sent! Check your inbox.');
        setShowForgotPassword(false);
        setResetEmail('');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check NCCR eligibility before proceeding
    if (signUpData.role === 'nccr_verifier') {
      if (nccrEligible !== true) {
        toast.error('Please verify your email eligibility for NCCR Verifier role first.');
        return;
      }
      if (idCardVerified !== true) {
        toast.error('Please upload and verify your NCCR ID card.');
        return;
      }
    }

    setLoading(true);

    try {
      let response;
      
      if (signUpData.role === 'nccr_verifier' && nccrIdCard) {
        // Use FormData for NCCR verifiers with ID cards
        const formData = new FormData();
        formData.append('email', signUpData.email);
        formData.append('password', signUpData.password);
        formData.append('name', signUpData.name);
        formData.append('role', signUpData.role);
        formData.append('nccrIdCard', nccrIdCard);

        response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/signup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: formData
        });
      } else {
        // Use JSON for regular signups
        response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(signUpData)
        });
      }

      const result = await response.json();

      if (!response.ok) {
        toast.error(`Sign up failed: ${result.error}`);
      } else {
        toast.success('Account created successfully! Please sign in.');
        // Clear form
        setSignUpData({
          email: '',
          password: '',
          name: '',
          role: 'buyer'
        });
        setNccrEligible(null);
        setNccrIdCard(null);
        setIdCardVerified(null);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error('An unexpected error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'project_manager':
        return <Leaf className="h-4 w-4" />;
      case 'nccr_verifier':
        return <Shield className="h-4 w-4" />;
      case 'buyer':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Waves className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 rounded-lg p-3">
            <Waves className="h-8 w-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl">Welcome to Samudra Ledger</CardTitle>
        <CardDescription>
          India's Transparent Blue Carbon Registry
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="mt-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={signInData.email}
                  onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={signInData.password}
                  onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
              
              <div className="text-center mt-4">
                <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="text-sm text-blue-600 hover:text-blue-800">
                      Forgot your password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Enter your email address and we'll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={loading} className="flex-1">
                          {loading ? 'Sending...' : 'Send Reset Email'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="mt-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  placeholder="Enter your full name"
                  value={signUpData.name}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={signUpData.email}
                  onChange={(e) => {
                    const email = e.target.value;
                    setSignUpData(prev => ({ ...prev, email }));
                    // Reset NCCR eligibility and ID card when email changes
                    if (signUpData.role === 'nccr_verifier') {
                      setNccrEligible(null);
                      setNccrIdCard(null);
                      setIdCardVerified(null);
                    }
                  }}
                  required
                />
                {signUpData.role === 'nccr_verifier' && signUpData.email && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => checkNCCREligibility(signUpData.email)}
                      disabled={checkingEligibility}
                      className="w-full"
                    >
                      {checkingEligibility ? 'Checking...' : 'Verify NCCR Eligibility'}
                    </Button>
                    {nccrEligible === true && (
                      <div className="flex items-center mt-2 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Email verified for NCCR Verifier role
                      </div>
                    )}
                    {nccrEligible === false && (
                      <div className="flex items-center mt-2 text-red-600 text-sm">
                        <XCircle className="h-4 w-4 mr-2" />
                        Email not authorized for NCCR Verifier role
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* NCCR ID Card Upload - Only show if verifier role and email is eligible */}
              {signUpData.role === 'nccr_verifier' && nccrEligible === true && (
                <div className="space-y-2">
                  <Label htmlFor="nccr-id-card">NCCR ID Card Verification</Label>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Upload your verified NCCR ID card. Each ID card can only be used for one account.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {!nccrIdCard ? (
                      <div>
                        <FileImage className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <Label htmlFor="id-card-upload" className="cursor-pointer">
                            <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload NCCR ID Card
                            </div>
                            <Input
                              id="id-card-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleIdCardUpload(file);
                                }
                              }}
                            />
                          </Label>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          PNG, JPG, or JPEG up to 5MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <FileImage className="mx-auto h-12 w-12 text-green-500" />
                        <p className="mt-2 text-sm">{nccrIdCard.name}</p>
                        {uploadingIdCard && (
                          <p className="text-sm text-blue-600">Verifying ID card...</p>
                        )}
                        {idCardVerified === true && (
                          <div className="flex items-center justify-center mt-2 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            ID card verified successfully
                          </div>
                        )}
                        {idCardVerified === false && (
                          <div className="flex items-center justify-center mt-2 text-red-600 text-sm">
                            <XCircle className="h-4 w-4 mr-2" />
                            ID card verification failed
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setNccrIdCard(null);
                            setIdCardVerified(null);
                          }}
                        >
                          Upload Different File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-role">Role</Label>
                <Select value={signUpData.role} onValueChange={(value: any) => {
                  setSignUpData(prev => ({ ...prev, role: value }));
                  setNccrEligible(null); // Reset eligibility when role changes
                  setNccrIdCard(null); // Reset ID card when role changes
                  setIdCardVerified(null);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Buyer - Purchase & retire carbon credits</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="project_manager">
                      <div className="flex items-center space-x-2">
                        <Leaf className="h-4 w-4" />
                        <span>Project Manager - Register & manage blue carbon projects</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="nccr_verifier">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>NCCR Verifier - Verify MRV reports</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 mb-2">
            <strong>Demo Credentials:</strong> Use any email/password combination to create an account and explore the different role-based dashboards.
          </p>
          <div className="text-xs text-blue-600 space-y-1">
            <p><strong>NCCR Verifier Testing:</strong></p>
            <p>• Use emails with eligible domains like @nic.in, @gov.in, @iisc.ac.in for instant verification</p>
            <p>• Upload any image file as NCCR ID card for demonstration</p>
            <p>• Each ID card can only be used once per account</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}