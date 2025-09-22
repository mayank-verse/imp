// Authentication Service
// Handles user registration, login, and role management

import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.ts';

interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: string;
  };
}

export class AuthService {
  private supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  private nccrIdBucketName = 'make-a82c4acb-nccr-ids';

  async createUser(email: string, password: string, name: string, role: string, nccrIdCard?: File): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Check NCCR eligibility for verifier role
      if (role === 'nccr_verifier') {
        const eligibilityResult = AuthService.checkNCCREligibility(email);
        if (!eligibilityResult.eligible) {
          return { success: false, error: eligibilityResult.reason };
        }

        // Require NCCR ID card for verifiers
        if (!nccrIdCard) {
          return { success: false, error: 'NCCR ID card is required for verifier role' };
        }

        // Check if this ID card is already used
        const idCardHash = await this.generateFileHash(nccrIdCard);
        const existingIdCard = await kv.get(`nccr_id_card:${idCardHash}`);
        if (existingIdCard) {
          return { success: false, error: 'This NCCR ID card is already registered with another account' };
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
        return { success: false, error: error.message };
      }

      // Store NCCR ID card if verifier
      if (role === 'nccr_verifier' && nccrIdCard && data.user) {
        await this.storeNCCRIdCard(data.user.id, email, nccrIdCard);
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async authenticateUser(request: Request): Promise<{ user: User; session: any }> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Access denied: No valid authorization token');
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Access denied: Invalid token');
    }

    return { user: user as User, session: { access_token: token } };
  }

  requireRole(auth: { user: User }, requiredRole: string): void {
    if (auth.user.user_metadata.role !== requiredRole) {
      throw new Error(`Access denied: ${requiredRole} role required`);
    }
  }

  async getUserById(userId: string): Promise<any> {
    try {
      const { data: userData } = await this.supabase.auth.admin.getUserById(userId);
      return userData?.user;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return null;
    }
  }

  async verifyNCCRId(idCard: File, email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate file type and size
      if (!idCard.type.startsWith('image/')) {
        return { success: false, error: 'Invalid file type. Please upload an image file.' };
      }

      if (idCard.size > 5 * 1024 * 1024) {
        return { success: false, error: 'File size too large. Maximum 5MB allowed.' };
      }

      // Check if this ID card is already used
      const idCardHash = await this.generateFileHash(idCard);
      const existingIdCard = await kv.get(`nccr_id_card:${idCardHash}`);
      
      if (existingIdCard) {
        return { success: false, error: 'This NCCR ID card is already registered with another account' };
      }

      // Store temporary verification
      await kv.set(`temp_nccr_verification:${email}`, {
        idCardHash,
        fileName: idCard.name,
        fileSize: idCard.size,
        verifiedAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('NCCR ID verification error:', error);
      return { success: false, error: 'Failed to verify NCCR ID card' };
    }
  }

  private async generateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async ensureNCCRBucket(): Promise<void> {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.nccrIdBucketName);
      
      if (!bucketExists) {
        const { error } = await this.supabase.storage.createBucket(this.nccrIdBucketName, {
          public: false,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (error) {
          console.error('Error creating NCCR ID bucket:', error);
          throw new Error('Failed to initialize storage');
        }
      }
    } catch (error) {
      console.error('Error ensuring NCCR bucket:', error);
      throw error;
    }
  }

  private async storeNCCRIdCard(userId: string, email: string, idCard: File): Promise<void> {
    try {
      await this.ensureNCCRBucket();

      const idCardHash = await this.generateFileHash(idCard);
      const fileName = `${userId}_${Date.now()}_${idCard.name}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await this.supabase.storage
        .from(this.nccrIdBucketName)
        .upload(fileName, idCard, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload ID card: ${uploadError.message}`);
      }

      // Store metadata in KV store
      await kv.set(`nccr_id_card:${idCardHash}`, {
        userId,
        email,
        fileName,
        uploadedAt: new Date().toISOString(),
        fileSize: idCard.size,
        originalName: idCard.name
      });

      // Store user's ID card reference
      await kv.set(`user_nccr_id:${userId}`, {
        idCardHash,
        fileName,
        verifiedAt: new Date().toISOString()
      });

      // Clean up temporary verification
      await kv.del(`temp_nccr_verification:${email}`);

    } catch (error) {
      console.error('Error storing NCCR ID card:', error);
      throw error;
    }
  }

  static checkNCCREligibility(email: string): { eligible: boolean; reason?: string; isAllowed?: boolean; message?: string } {
    // Check for government/research institutions
    const eligibleDomains = [
      'nic.in',           // National Informatics Centre
      'gov.in',           // Government domains
      'iisc.ac.in',       // Indian Institute of Science
      'iitb.ac.in',       // IIT Bombay
      'iitd.ac.in',       // IIT Delhi
      'iitm.ac.in',       // IIT Madras
      'iitk.ac.in',       // IIT Kanpur
      'iitkgp.ac.in',     // IIT Kharagpur
      'iitg.ac.in',       // IIT Guwahati
      'iith.ac.in',       // IIT Hyderabad
      'iitbhu.ac.in',     // IIT BHU
      'isro.gov.in',      // ISRO
      'incois.gov.in',    // INCOIS
      'niot.res.in',      // NIOT
      'ncaor.gov.in',     // NCAOR
      'nio.org',          // NIO
      'icmam.gov.in',     // ICMAM
      'moes.gov.in',      // Ministry of Earth Sciences
      'moef.gov.in',      // Ministry of Environment
      'dst.gov.in',       // Department of Science & Technology
      'csir.res.in',      // CSIR labs
      'cmlre.gov.in',     // CMLRE
      'doe.gov.in'        // Department of Ocean Development
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    
    if (eligibleDomains.includes(domain)) {
      return { eligible: true, isAllowed: true };
    }

    // Check for researcher patterns
    const researchKeywords = ['research', 'marine', 'ocean', 'climate', 'carbon', 'env'];
    const hasResearchKeyword = researchKeywords.some(keyword => 
      email.toLowerCase().includes(keyword) || domain?.includes(keyword)
    );

    if (domain?.includes('.ac.in') && hasResearchKeyword) {
      return { eligible: true, isAllowed: true };
    }

    const message = 'NCCR verifier role is restricted to government officials, research institutions, and marine/climate scientists. Please use an institutional email address.';
    return { 
      eligible: false, 
      isAllowed: false,
      reason: message,
      message 
    };
  }
}