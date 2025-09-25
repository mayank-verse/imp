// Authentication Service
// Handles user authentication and authorization

import { createClient } from "@supabase/supabase-js";

export interface AuthResult {
  success: boolean;
  user?: any;
  role?: string;
  error?: string;
  status?: number;
}

export class AuthService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  // NCCR Verifier allowlist - only these emails can register as verifiers
  private static readonly NCCR_VERIFIER_ALLOWLIST = [
    'nccr.admin@gov.in',
    'verifier1@nccr.gov.in',
    'verifier2@nccr.gov.in',
    'climate.officer@nccr.gov.in',
    'blue.carbon@nccr.gov.in'
  ];

  async authenticateUser(request: Request): Promise<AuthResult> {
    try {
      const authHeader = request.headers.get('Authorization');
      console.log('Auth header present:', !!authHeader);
      
      const accessToken = authHeader?.split(' ')[1];
      if (!accessToken) {
        console.log('No access token found in Authorization header');
        return { success: false, error: 'No access token provided', status: 401 };
      }

      console.log('Attempting to verify token for user authentication');
      const { data: { user }, error } = await this.supabase.auth.getUser(accessToken);
      
      if (error) {
        console.log('Auth error:', error);
        return { success: false, error: 'Invalid access token', status: 401 };
      }
      
      if (!user) {
        console.log('No user found for token');
        return { success: false, error: 'User not found', status: 401 };
      }

      console.log('User authenticated:', user.id, 'Role:', user.user_metadata?.role);
      
      // Get user role from metadata or default to buyer
      const userRole = user.user_metadata?.role || 'buyer';
      return { success: true, user, role: userRole };
    } catch (err) {
      console.log('Authentication function error:', err);
      return { success: false, error: 'Authentication failed', status: 500 };
    }
  }

  async createUser(email: string, password: string, name: string, role: string) {
    // Validate NCCR verifier role restriction
    if (role === 'nccr_verifier') {
      if (!AuthService.NCCR_VERIFIER_ALLOWLIST.includes(email.toLowerCase())) {
        throw new Error('NCCR Verifier registration is restricted. Please contact the administrator for access approval.');
      }
    }
    
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Signup error: ${error.message}`);
      throw new Error(error.message);
    }

    return { user: data.user, role };
  }

  static checkNCCREligibility(email: string): { isAllowed: boolean; message: string } {
    const isAllowed = AuthService.NCCR_VERIFIER_ALLOWLIST.includes(email.toLowerCase());
    
    return { 
      isAllowed,
      message: isAllowed 
        ? 'Email is authorized for NCCR Verifier role'
        : 'Email is not authorized for NCCR Verifier role. Please contact the administrator.'
    };
  }

  async getUserById(userId: string) {
    const { data: userData } = await this.supabase.auth.admin.getUserById(userId);
    return userData?.user;
  }

  requireRole(authResult: AuthResult, requiredRole: string): void {
    if (!authResult.success) {
      throw new Error(authResult.error || 'Authentication failed');
    }

    if (authResult.role !== requiredRole) {
      throw new Error(`Access denied. ${requiredRole.replace('_', ' ')} role required.`);
    }
  }

  requireAnyRole(authResult: AuthResult, allowedRoles: string[]): void {
    if (!authResult.success) {
      throw new Error(authResult.error || 'Authentication failed');
    }

    if (!allowedRoles.includes(authResult.role || '')) {
      throw new Error(`Access denied. One of the following roles required: ${allowedRoles.join(', ')}`);
    }
  }
}