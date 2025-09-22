import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { LandingPage } from './components/LandingPage';
import { PublicDashboard } from './components/PublicDashboard';
import { ProjectManagerDashboard } from './components/ProjectManagerDashboard';
import { ProjectManagerProfile } from './components/ProjectManagerProfile';
import { NCCRVerifierDashboard } from './components/NCCRVerifierDashboard';
import { BuyerDashboard } from './components/BuyerDashboard';
import { BuyerProfile } from './components/BuyerProfile';
import { AuthForm } from './components/AuthForm';
import { PasswordReset } from './components/PasswordReset';
import { supabase } from './utils/supabase/client';
import { Waves, Leaf, Shield, TrendingUp, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { BlockchainStatus } from './components/BlockchainStatus';
import { SampleDataButton } from './components/SampleDataButton';

interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: 'project_manager' | 'nccr_verifier' | 'buyer';
  };
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [activeTab, setActiveTab] = useState('public');

  useEffect(() => {
    // Check if this is a password reset redirect
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const type = urlParams.get('type');
    
    if (type === 'recovery' && accessToken && refreshToken) {
      setShowPasswordReset(true);
      return;
    }
    
    // Check for existing session
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user as User);
          // Set active tab based on user role
          if (session.user.user_metadata?.role) {
            setActiveTab(session.user.user_metadata.role);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setActiveTab('public');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user as User);
        if (session.user.user_metadata?.role) {
          setActiveTab(session.user.user_metadata.role);
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setShowAuth(false); // Return to landing page
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const handleGetStarted = () => {
    setShowAuth(true);
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'project_manager':
        return 'Project Manager';
      case 'nccr_verifier':
        return 'NCCR Verifier';
      case 'buyer':
        return 'Buyer';
      default:
        return 'Public';
    }
  };

  const getGridCols = () => {
    if (!user) return 'grid-cols-1';
    
    // Project managers and buyers have 3 tabs (public, role-specific, profile)
    // NCCR verifiers have 2 tabs (public, verification)
    if (user.user_metadata.role === 'project_manager' || user.user_metadata.role === 'buyer') {
      return 'grid-cols-3';
    }
    return 'grid-cols-2';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show password reset page if needed
  if (showPasswordReset) {
    return <PasswordReset />;
  }
  
  // Show landing page first
  if (!showAuth && !user) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => !user && setShowAuth(false)}>
              <div className="bg-blue-600 rounded-lg p-2">
                <Waves className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Samudra Ledger</h1>
                <p className="text-sm text-gray-600">Blue Carbon Registry</p>
              </div>
            </div>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="flex items-center space-x-1">
                  {getRoleIcon(user.user_metadata.role)}
                  <span>{getRoleLabel(user.user_metadata.role)}</span>
                </Badge>
                <span className="text-sm text-gray-600">{user.user_metadata.name}</span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowAuth(false)}>
                Back to Home
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={user ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
        {!user ? (
          <div className="max-w-md mx-auto py-8">
            <AuthForm />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${getGridCols()}`}>
              <TabsTrigger value="public" className="flex items-center space-x-2">
                <Waves className="h-4 w-4" />
                <span>Public</span>
              </TabsTrigger>
              {user.user_metadata.role === 'project_manager' && (
                <TabsTrigger value="project_manager" className="flex items-center space-x-2">
                  <Leaf className="h-4 w-4" />
                  <span>Projects</span>
                </TabsTrigger>
              )}
              {user.user_metadata.role === 'project_manager' && (
                <TabsTrigger value="profile" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </TabsTrigger>
              )}
              {user.user_metadata.role === 'nccr_verifier' && (
                <TabsTrigger value="nccr_verifier" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Verification</span>
                </TabsTrigger>
              )}
              {user.user_metadata.role === 'buyer' && (
                <TabsTrigger value="buyer" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Marketplace</span>
                </TabsTrigger>
              )}
              {user.user_metadata.role === 'buyer' && (
                <TabsTrigger value="buyer_profile" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </TabsTrigger>
              )}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="public">
                <PublicDashboard />
              </TabsContent>
              
              <TabsContent value="project_manager">
                <ProjectManagerDashboard user={user} />
              </TabsContent>
              
              <TabsContent value="profile">
                <ProjectManagerProfile user={user} />
              </TabsContent>
              
              <TabsContent value="nccr_verifier">
                <NCCRVerifierDashboard user={user} />
              </TabsContent>
              
              <TabsContent value="buyer">
                <BuyerDashboard user={user} />
              </TabsContent>
              
              <TabsContent value="buyer_profile">
                <BuyerProfile user={user} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </main>

      {/* Sample Data Button (for demo purposes) */}
      {user && <SampleDataButton />}

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>© 2025 Samudra Ledger - Transparent Blue Carbon Registry for India</p>
            <div className="mt-3 flex justify-center">
              <BlockchainStatus variant="footer" showDetails />
            </div>
          </div>
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
}

export default App;