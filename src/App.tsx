import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { LandingPage } from './components/PUBLIC/LandingPage';
import { PublicDashboard } from './components/PUBLIC/PublicDashboard';
import { ProjectManagerDashboard } from './components/MANAGER/ProjectManagerDashboard';
import { ProjectManagerProfile } from './components/MANAGER/ProjectManagerProfile';
import { NCCRVerifierDashboard } from './components/NCCR/NCCRVerifierDashboard';
import { BuyerDashboard } from './components/BUYER/BuyerDashboard';
import { BuyerProfile } from './components/BUYER/BuyerProfile';
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
          setUser(session.user as unknown as User);
          setShowAuth(true); // Ensure auth screen is shown after login logic
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
        setUser(session.user as unknown as User);
        setShowAuth(true); // User has a session, show the main app
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
  if (user.user_metadata.role === 'project_manager' || user.user_metadata.role === 'buyer' || user.user_metadata.role === 'nccr_verifier') {
    return 'grid-cols-2';
  }
  return 'grid-cols-1';
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showPasswordReset) {
    return <PasswordReset />;
  }
  
  if (!showAuth && !user) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <div className={`min-h-screen ${!user ? 'bg-[#0F172A] relative overflow-hidden' : 'bg-gradient-to-br from-blue-50 to-green-50'}`}>
      
      {!user && (
        <>
          <div className="absolute top-0 -left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </>
      )}

      <header className={!user ? 'bg-transparent' : 'bg-white shadow-sm border-b'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => !user && setShowAuth(false)}>
              <div className="bg-blue-600 rounded-lg p-2">
                <Waves className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${!user ? 'text-white' : 'text-gray-900'}`}>Samudra Ledger</h1>
                <p className={`text-sm ${!user ? 'text-gray-400' : 'text-gray-600'}`}>Blue Carbon Registry</p>
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
              <Button variant="outline" className="bg-transparent  text-white border-slate-600 hover:bg-slate-800 hover:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg" onClick={() => setShowAuth(false)}>
                Back to Home
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className={!user ? "w-full flex items-center justify-center py-8 px-4" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {!user ? (
          <AuthForm />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${getGridCols()}`}>
              {user.user_metadata.role === 'project_manager' && (
                <>
                  <TabsTrigger value="project_manager" className="flex items-center space-x-2"><Leaf className="h-4 w-4" /><span>Projects</span></TabsTrigger>
                  <TabsTrigger value="profile" className="flex items-center space-x-2"><User className="h-4 w-4" /><span>Profile</span></TabsTrigger>
                </>
              )}
              {user.user_metadata.role === 'nccr_verifier' && (
                <TabsTrigger value="nccr_verifier" className="flex items-center space-x-2"><Shield className="h-4 w-4" /><span>Verification</span></TabsTrigger>
              )}
              {user.user_metadata.role === 'buyer' && (
                 <>
                  <TabsTrigger value="buyer" className="flex items-center space-x-2"><TrendingUp className="h-4 w-4" /><span>Marketplace</span></TabsTrigger>
                  <TabsTrigger value="buyer_profile" className="flex items-center space-x-2"><User className="h-4 w-4" /><span>Profile</span></TabsTrigger>
                </>
              )}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="public"><PublicDashboard /></TabsContent>
              <TabsContent value="project_manager"><ProjectManagerDashboard user={user} /></TabsContent>
              <TabsContent value="profile"><ProjectManagerProfile user={user} /></TabsContent>
              <TabsContent value="nccr_verifier"><NCCRVerifierDashboard user={user} /></TabsContent>
              <TabsContent value="buyer"><BuyerDashboard user={user} /></TabsContent>
              <TabsContent value="buyer_profile"><BuyerProfile user={user} /></TabsContent>
            </div>
          </Tabs>
        )}
      </main>

      {user && <SampleDataButton />}

      {user && (
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
      )}
      
      <Toaster theme={!user ? 'dark' : 'light'} />
    </div>
  );
}

export default App;