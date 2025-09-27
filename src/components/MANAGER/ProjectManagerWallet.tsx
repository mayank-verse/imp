import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { DollarSign } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: 'project_manager' | 'nccr_verifier' | 'buyer';
  };
  fakeMoneyBalance?: number;
}

interface ProjectManagerWalletProps {
  user: User;
}

export function ProjectManagerWallet({ user }: ProjectManagerWalletProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagerBalance();
  }, [user.id]);

  const fetchManagerBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server/users/${user.id}/balance`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.fakeMoneyBalance || 0);
      } else {
        throw new Error('Failed to fetch balance');
      }
    } catch (error) {
      console.error('Error fetching manager balance:', error);
      toast.error('Failed to load wallet balance');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="space-y-0 pb-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
        <DollarSign className="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-700">
          ₹{(balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-green-600 mt-1">
          Fake money earned from credit sales
        </p>
      </CardContent>
    </Card>
  );
}
