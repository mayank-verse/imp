// Supabase Database Repository Layer
// Handles all data access operations using Supabase PostgreSQL database

import { createClient } from "npm:@supabase/supabase-js";
import { 
  Project, 
  MRVData, 
  MLVerification, 
  CreditRetirement, 
  PublicStats,
  User,
  UploadedFile,
  CarbonCredit
} from './models.ts';

export class DatabaseRepository {
  private static supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Project operations
  static async createProject(project: Project): Promise<void> {
    const projectData = {
      id: project.id,
      name: project.name,
      description: project.description,
      location: project.location,
      ecosystem_type: project.ecosystemType,
      area: project.area,
      coordinates: project.coordinates,
      community_partners: project.communityPartners,
      expected_carbon_capture: project.expectedCarbonCapture,
      manager_id: project.managerId,
      manager_name: project.managerName,
      manager_email: project.managerEmail,
      status: project.status,
      on_chain_tx_hash: project.onChainTxHash
    };

    const { error } = await this.supabase
      .from('projects')
      .insert(projectData);

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  static async getProject(projectId: string): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to get project: ${error.message}`);
    }

    return this.mapProjectFromDB(data);
  }

  static async getProjectsByManager(managerId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get projects by manager: ${error.message}`);
    }

    return data?.map(this.mapProjectFromDB) || [];
  }

  static async getAllProjects(): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get all projects: ${error.message}`);
    }

    return data?.map(this.mapProjectFromDB) || [];
  }

  static async getApprovedProjects(): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get approved projects: ${error.message}`);
    }

    return data?.map(this.mapProjectFromDB) || [];
  }

  static async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.location) updateData.location = updates.location;
    if (updates.ecosystemType) updateData.ecosystem_type = updates.ecosystemType;
    if (updates.area) updateData.area = updates.area;
    if (updates.coordinates) updateData.coordinates = updates.coordinates;
    if (updates.communityPartners) updateData.community_partners = updates.communityPartners;
    if (updates.expectedCarbonCapture) updateData.expected_carbon_capture = updates.expectedCarbonCapture;
    if (updates.status) updateData.status = updates.status;
    if (updates.onChainTxHash) updateData.on_chain_tx_hash = updates.onChainTxHash;

    const { error } = await this.supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  static async deleteProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  // MRV operations
  static async createMRVData(mrvData: MRVData): Promise<void> {
    const { error: mrvError } = await this.supabase
      .from('mrv_data')
      .insert({
        id: mrvData.id,
        project_id: mrvData.projectId,
        manager_id: mrvData.managerId,
        satellite_data: mrvData.rawData.satelliteData,
        community_reports: mrvData.rawData.communityReports,
        sensor_readings: mrvData.rawData.sensorReadings,
        iot_data: mrvData.rawData.iotData,
        notes: mrvData.rawData.notes,
        status: mrvData.status,
        verification_notes: mrvData.verificationNotes,
        verified_by: mrvData.verifiedBy,
        verified_at: mrvData.verifiedAt,
        ml_carbon_estimate: mrvData.mlResults?.carbon_estimate,
        ml_biomass_health_score: mrvData.mlResults?.biomass_health_score,
        ml_evidence_cid: mrvData.mlResults?.evidenceCid,
        on_chain_tx_hash: mrvData.onChainTxHash
      });

    if (mrvError) {
      throw new Error(`Failed to create MRV data: ${mrvError.message}`);
    }

    // Insert uploaded files
    if (mrvData.files && mrvData.files.length > 0) {
      const filesData = mrvData.files.map(file => ({
        mrv_data_id: mrvData.id,
        file_name: file.name,
        original_name: file.originalName,
        file_size: file.size,
        file_type: file.type,
        category: file.category,
        upload_path: file.path,
        signed_url: file.url
      }));

      const { error: filesError } = await this.supabase
        .from('uploaded_files')
        .insert(filesData);

      if (filesError) {
        throw new Error(`Failed to create uploaded files: ${filesError.message}`);
      }
    }
  }

  static async getMRVData(mrvId: string): Promise<MRVData | null> {
    const { data, error } = await this.supabase
      .from('mrv_data')
      .select(`
        *,
        uploaded_files (*)
      `)
      .eq('id', mrvId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to get MRV data: ${error.message}`);
    }

    return this.mapMRVDataFromDB(data);
  }

  static async getMRVDataByProject(projectId: string): Promise<MRVData[]> {
    const { data, error } = await this.supabase
      .from('mrv_data')
      .select(`
        *,
        uploaded_files (*)
      `)
      .eq('project_id', projectId)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get MRV data by project: ${error.message}`);
    }

    return data?.map(this.mapMRVDataFromDB) || [];
  }

  static async getPendingMRV(): Promise<MRVData[]> {
    const { data, error } = await this.supabase
      .from('mrv_data')
      .select(`
        *,
        uploaded_files (*),
        projects (name, location, ecosystem_type)
      `)
      .in('status', ['pending_ml_processing', 'pending_verification'])
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get pending MRV: ${error.message}`);
    }

    return data?.map(this.mapMRVDataFromDB) || [];
  }

  static async getApprovedMRV(): Promise<MRVData[]> {
    const { data, error } = await this.supabase
      .from('mrv_data')
      .select(`
        *,
        uploaded_files (*)
      `)
      .eq('status', 'approved')
      .order('verified_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get approved MRV: ${error.message}`);
    }

    return data?.map(this.mapMRVDataFromDB) || [];
  }

  static async updateMRVData(mrvId: string, updates: Partial<MRVData>): Promise<void> {
    const updateData: any = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.verificationNotes) updateData.verification_notes = updates.verificationNotes;
    if (updates.verifiedBy) updateData.verified_by = updates.verifiedBy;
    if (updates.verifiedAt) updateData.verified_at = updates.verifiedAt;
    if (updates.onChainTxHash) updateData.on_chain_tx_hash = updates.onChainTxHash;
    
    if (updates.mlResults) {
      updateData.ml_carbon_estimate = updates.mlResults.carbon_estimate;
      updateData.ml_biomass_health_score = updates.mlResults.biomass_health_score;
      updateData.ml_evidence_cid = updates.mlResults.evidenceCid;
    }

    const { error } = await this.supabase
      .from('mrv_data')
      .update(updateData)
      .eq('id', mrvId);

    if (error) {
      throw new Error(`Failed to update MRV data: ${error.message}`);
    }
  }

  // Carbon Credits operations
  static async createCarbonCredit(creditData: any): Promise<void> {
    const { error } = await this.supabase
      .from('carbon_credits')
      .insert({
        id: creditData.id,
        mrv_data_id: creditData.mrvId,
        project_id: creditData.projectId,
        total_amount: creditData.totalAmount,
        available_amount: creditData.availableAmount,
        price_per_credit: creditData.pricePerCredit || 25.00,
        health_score: creditData.healthScore,
        evidence_cid: creditData.evidenceCid,
        on_chain_tx_hash: creditData.onChainTxHash
      });

    if (error) {
      throw new Error(`Failed to create carbon credit: ${error.message}`);
    }
  }

  static async getAvailableCredits(): Promise<CarbonCredit[]> {
    const { data, error } = await this.supabase
      .from('carbon_credits')
      .select(`
        *,
        projects (name, location, ecosystem_type, manager_name),
        mrv_data (verified_at)
      `)
      .eq('status', 'available')
      .gt('available_amount', 0)
      .order('issued_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get available credits: ${error.message}`);
    }

    return data?.map(this.mapCarbonCreditFromDB) || [];
  }

  static async getCarbonCredit(creditId: string): Promise<CarbonCredit | null> {
    const { data, error } = await this.supabase
      .from('carbon_credits')
      .select(`
        *,
        projects (name, location, ecosystem_type, manager_name),
        mrv_data (verified_at)
      `)
      .eq('id', creditId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to get carbon credit: ${error.message}`);
    }

    return this.mapCarbonCreditFromDB(data);
  }

  static async updateCreditAvailability(creditId: string, purchasedAmount: number): Promise<void> {
    const { data: currentCredit, error: fetchError } = await this.supabase
      .from('carbon_credits')
      .select('available_amount')
      .eq('id', creditId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current credit: ${fetchError.message}`);
    }

    const newAvailableAmount = currentCredit.available_amount - purchasedAmount;
    const newStatus = newAvailableAmount <= 0 ? 'sold_out' : 'available';

    const { error } = await this.supabase
      .from('carbon_credits')
      .update({
        available_amount: Math.max(0, newAvailableAmount),
        status: newStatus
      })
      .eq('id', creditId);

    if (error) {
      throw new Error(`Failed to update credit availability: ${error.message}`);
    }
  }

  // Credit Purchase operations
  static async createCreditPurchase(purchase: any): Promise<void> {
    const { error } = await this.supabase
      .from('credit_purchases')
      .insert({
        id: purchase.id,
        credit_id: purchase.creditId,
        buyer_id: purchase.buyerId,
        amount: purchase.amount,
        price_per_credit: purchase.pricePerCredit,
        total_price: purchase.totalPrice,
        payment_method: purchase.paymentMethod,
        payment_status: purchase.paymentStatus,
        on_chain_tx_hash: purchase.onChainTxHash
      });

    if (error) {
      throw new Error(`Failed to create credit purchase: ${error.message}`);
    }

    // Update user's credit balance
    await this.updateUserCreditBalance(purchase.buyerId, purchase.amount);
  }

  static async getUserPurchases(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('credit_purchases')
      .select(`
        *,
        carbon_credits (
          project_id,
          projects (name, location)
        )
      `)
      .eq('buyer_id', userId)
      .order('purchased_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user purchases: ${error.message}`);
    }

    return data || [];
  }

  // Credit Retirement operations
  static async createRetirement(retirement: CreditRetirement): Promise<void> {
    const { error } = await this.supabase
      .from('credit_retirements')
      .insert({
        id: retirement.id,
        purchase_id: retirement.purchaseId,
        buyer_id: retirement.buyerId,
        amount: retirement.amount,
        reason: retirement.reason,
        on_chain_tx_hash: retirement.onChainTxHash,
        certificate_url: retirement.certificateUrl
      });

    if (error) {
      throw new Error(`Failed to create retirement: ${error.message}`);
    }

    // Update user's credit balance (reduce)
    await this.updateUserCreditBalance(retirement.buyerId, -retirement.amount);
  }

  static async getUserRetirements(userId: string): Promise<CreditRetirement[]> {
    const { data, error } = await this.supabase
      .from('credit_retirements')
      .select(`
        *,
        credit_purchases (
          carbon_credits (
            project_id,
            projects (name, location)
          )
        )
      `)
      .eq('buyer_id', userId)
      .order('retired_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user retirements: ${error.message}`);
    }

    return data?.map(item => ({
      id: item.id,
      purchaseId: item.purchase_id,
      buyerId: item.buyer_id,
      amount: item.amount,
      reason: item.reason,
      retiredAt: item.retired_at,
      onChainTxHash: item.on_chain_tx_hash,
      certificateUrl: item.certificate_url
    })) || [];
  }

  // User Profile operations
  static async getUserProfile(userId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to get user profile: ${error.message}`);
    }

    return data;
  }

  static async updateUserProfile(userId: string, updates: any): Promise<void> {
    const { error } = await this.supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  static async getUserCreditBalance(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('credit_balance')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting user credit balance:', error);
      return 0;
    }

    return data?.credit_balance || 0;
  }

  static async setUserCreditBalance(userId: string, balance: number): Promise<void> {
    const { error } = await this.supabase
      .from('user_profiles')
      .update({ credit_balance: balance })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to set user credit balance: ${error.message}`);
    }
  }

  static async updateUserCreditBalance(userId: string, change: number): Promise<void> {
    const currentBalance = await this.getUserCreditBalance(userId);
    const newBalance = Math.max(0, currentBalance + change);
    await this.setUserCreditBalance(userId, newBalance);
  }

  // Watchlist operations
  static async getUserWatchlist(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('user_watchlists')
      .select(`
        *,
        carbon_credits (
          *,
          projects (name, location)
        )
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user watchlist: ${error.message}`);
    }

    return data || [];
  }

  static async addToWatchlist(userId: string, creditId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_watchlists')
      .insert({
        user_id: userId,
        credit_id: creditId
      });

    if (error) {
      // If it's a unique constraint violation, ignore it
      if (error.code !== '23505') {
        throw new Error(`Failed to add to watchlist: ${error.message}`);
      }
    }
  }

  static async removeFromWatchlist(userId: string, creditId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_watchlists')
      .delete()
      .eq('user_id', userId)
      .eq('credit_id', creditId);

    if (error) {
      throw new Error(`Failed to remove from watchlist: ${error.message}`);
    }
  }

  // Public Stats operations
  static async getPublicStats(): Promise<PublicStats> {
    const { data, error } = await this.supabase
      .from('public_stats')
      .select('*')
      .single();

    if (error) {
      // If no stats exist, return defaults
      return {
        totalCreditsIssued: 0,
        totalCreditsRetired: 0,
        totalProjects: 0,
        projects: []
      };
    }

    // Get approved projects for the public view
    const approvedProjects = await this.getApprovedProjects();

    return {
      totalCreditsIssued: data.total_credits_issued,
      totalCreditsRetired: data.total_credits_retired,
      totalProjects: data.total_projects,
      projects: approvedProjects
    };
  }

  static async updatePublicStats(): Promise<void> {
    // Stats are automatically updated by database triggers
    // This method can be used for manual refresh if needed
    const { error } = await this.supabase.rpc('update_public_stats');
    
    if (error) {
      console.error('Failed to update public stats:', error);
    }
  }

  // ML Verification operations
  static async createMLVerification(verification: MLVerification): Promise<void> {
    const { error } = await this.supabase
      .from('ml_verifications')
      .insert({
        project_id: verification.projectId,
        mrv_data_id: verification.mrvDataId,
        ml_score: verification.mlScore,
        confidence: verification.confidence,
        risk_factors: verification.riskFactors,
        recommendation: verification.recommendation,
        verifier_id: verification.verifierId
      });

    if (error) {
      throw new Error(`Failed to create ML verification: ${error.message}`);
    }
  }

  static async getMLVerification(projectId: string): Promise<MLVerification | null> {
    const { data, error } = await this.supabase
      .from('ml_verifications')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to get ML verification: ${error.message}`);
    }

    return {
      projectId: data.project_id,
      mrvDataId: data.mrv_data_id,
      mlScore: data.ml_score,
      confidence: data.confidence,
      riskFactors: data.risk_factors,
      recommendation: data.recommendation,
      timestamp: data.created_at,
      verifierId: data.verifier_id
    };
  }

  // Analytics and Stats for NCCR
  static async getMarketStatsForNCCR(): Promise<any> {
    try {
      const [creditsData, retirementsData, purchasesData] = await Promise.all([
        this.supabase
          .from('carbon_credits')
          .select('total_amount, available_amount')
          .eq('status', 'available'),
        this.supabase
          .from('credit_retirements')
          .select('amount'),
        this.supabase
          .from('credit_purchases')
          .select('buyer_id', { count: 'exact' })
      ]);

      const totalCreditsInMarket = creditsData.data?.reduce((sum, credit) => sum + credit.available_amount, 0) || 0;
      const totalCreditsRetired = retirementsData.data?.reduce((sum, retirement) => sum + retirement.amount, 0) || 0;
      
      // Get unique buyers
      const uniqueBuyers = new Set(purchasesData.data?.map(p => p.buyer_id) || []);
      const totalActiveUsers = uniqueBuyers.size;
      
      const averageRetirementPerUser = totalActiveUsers > 0 ? totalCreditsRetired / totalActiveUsers : 0;

      return {
        totalCreditsInMarket,
        totalCreditsRetired,
        totalActiveUsers,
        averageRetirementPerUser
      };
    } catch (error) {
      console.error('Error calculating NCCR market stats:', error);
      return {
        totalCreditsInMarket: 0,
        totalCreditsRetired: 0,
        totalActiveUsers: 0,
        averageRetirementPerUser: 0
      };
    }
  }

  // Enhanced MRV methods
  static async getAllMRVData(): Promise<MRVData[]> {
    const { data, error } = await this.supabase
      .from('mrv_data')
      .select(`
        *,
        uploaded_files (*)
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get all MRV data: ${error.message}`);
    }

    return data?.map(this.mapMRVDataFromDB) || [];
  }

  // Utility methods
  static generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateTxHash(): string {
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }

  // Helper methods to map database records to application models
  private static mapProjectFromDB(data: any): Project {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      location: data.location,
      ecosystemType: data.ecosystem_type,
      area: data.area,
      coordinates: data.coordinates,
      communityPartners: data.community_partners,
      expectedCarbonCapture: data.expected_carbon_capture,
      managerId: data.manager_id,
      managerName: data.manager_name,
      managerEmail: data.manager_email,
      status: data.status,
      createdAt: data.created_at,
      onChainTxHash: data.on_chain_tx_hash
    };
  }

  private static mapMRVDataFromDB(data: any): MRVData {
    return {
      id: data.id,
      projectId: data.project_id,
      managerId: data.manager_id,
      rawData: {
        satelliteData: data.satellite_data || '',
        communityReports: data.community_reports || '',
        sensorReadings: data.sensor_readings || '',
        iotData: data.iot_data || '',
        notes: data.notes || ''
      },
      files: data.uploaded_files?.map((file: any) => ({
        name: file.file_name,
        originalName: file.original_name,
        size: file.file_size,
        type: file.file_type,
        category: file.category,
        path: file.upload_path,
        url: file.signed_url,
        uploadedAt: file.uploaded_at
      })) || [],
      status: data.status,
      submittedAt: data.submitted_at,
      verificationNotes: data.verification_notes,
      verifiedBy: data.verified_by,
      verifiedAt: data.verified_at,
      mlResults: data.ml_carbon_estimate ? {
        carbon_estimate: data.ml_carbon_estimate,
        biomass_health_score: data.ml_biomass_health_score,
        evidenceCid: data.ml_evidence_cid
      } : undefined,
      onChainTxHash: data.on_chain_tx_hash
    };
  }

  private static mapCarbonCreditFromDB(data: any): CarbonCredit {
    return {
      id: data.id,
      projectId: data.project_id,
      carbonCredits: data.total_amount,
      availableAmount: data.available_amount,
      pricePerCredit: data.price_per_credit,
      healthScore: data.health_score,
      evidenceCid: data.evidence_cid,
      verifiedAt: data.mrv_data?.verified_at || data.issued_at,
      status: data.status === 'available' ? 'available' : 'retired',
      projectName: data.projects?.name,
      projectLocation: data.projects?.location,
      ecosystemType: data.projects?.ecosystem_type,
      managerName: data.projects?.manager_name
    };
  }
}