// Database Repository Layer
// Handles all data access operations using the KV store

import * as kv from './kv_store.tsx';
import { 
  Project, 
  MRVData, 
  MLVerification, 
  CreditRetirement, 
  PublicStats,
  User 
} from './models.tsx';

export class DatabaseRepository {
  // Project operations
  static async createProject(project: Project): Promise<void> {
    await kv.set(project.id, project);
  }

  static async getProject(projectId: string): Promise<Project | null> {
    const result = await kv.get(projectId);
    return result?.value || null;
  }

  static async getProjectsByManager(managerId: string): Promise<Project[]> {
    const allProjects = await kv.getByPrefix('project_');
    return allProjects
      .filter(p => p.value && p.value.managerId === managerId)
      .map(p => p.value);
  }

  static async getAllProjects(): Promise<Project[]> {
    const allProjects = await kv.getByPrefix('project_');
    return allProjects.map(p => p.value);
  }

  static async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const existing = await this.getProject(projectId);
    if (existing) {
      await kv.set(projectId, { ...existing, ...updates });
    }
  }

  static async deleteProject(projectId: string): Promise<void> {
    await kv.del(projectId);
  }

  // MRV operations
  static async createMRVData(mrvData: MRVData): Promise<void> {
    await kv.set(mrvData.id, mrvData);
  }

  static async getMRVData(mrvId: string): Promise<MRVData | null> {
    const result = await kv.get(mrvId);
    return result?.value || null;
  }

  static async getPendingMRV(): Promise<MRVData[]> {
    const allMrv = await kv.getByPrefix('mrv_');
    return allMrv
      .map(m => m.value)
      .filter(mrv => mrv.status === 'pending_ml_processing' || mrv.status === 'pending_verification');
  }

  static async getApprovedMRV(): Promise<MRVData[]> {
    const allMrv = await kv.getByPrefix('mrv_');
    return allMrv
      .map(m => m.value)
      .filter(mrv => mrv.status === 'approved');
  }

  static async updateMRVData(mrvId: string, updates: Partial<MRVData>): Promise<void> {
    const existing = await this.getMRVData(mrvId);
    if (existing) {
      await kv.set(mrvId, { ...existing, ...updates });
    }
  }

  // ML Verification operations
  static async createMLVerification(verification: MLVerification): Promise<void> {
    await kv.set(`ml_verification_${verification.projectId}`, verification);
  }

  static async getMLVerification(projectId: string): Promise<MLVerification | null> {
    const result = await kv.get(`ml_verification_${projectId}`);
    return result?.value || null;
  }

  // Credit operations
  static async getAvailableCredits(): Promise<any[]> {
    const approvedMrv = await this.getApprovedMRV();
    return approvedMrv.map(mrv => ({
      id: mrv.id,
      projectId: mrv.projectId,
      carbonCredits: mrv.mlResults?.carbon_estimate || 0,
      healthScore: mrv.mlResults?.biomass_health_score || 0,
      evidenceCid: mrv.mlResults?.evidenceCid || '',
      verifiedAt: mrv.verifiedAt || '',
      availableAmount: mrv.mlResults?.carbon_estimate || 0
    }));
  }

  static async createCreditPurchase(purchase: any): Promise<void> {
    await kv.set(purchase.id, purchase);
    
    // Update user's credit balance
    const currentBalance = await this.getUserCreditBalance(purchase.buyerId);
    await this.setUserCreditBalance(purchase.buyerId, currentBalance + purchase.amount);
  }

  static async updateCreditAvailability(creditId: string, purchasedAmount: number): Promise<void> {
    // In a real implementation, this would update the available amount in the credit record
    console.log(`Reducing available credits for ${creditId} by ${purchasedAmount}`);
  }

  static async getUserCreditBalance(userId: string): Promise<number> {
    const result = await kv.get(`user_balance_${userId}`);
    return result?.value || 0;
  }

  static async setUserCreditBalance(userId: string, balance: number): Promise<void> {
    await kv.set(`user_balance_${userId}`, balance);
  }

  static async updateUserCreditBalance(userId: string, change: number): Promise<void> {
    const currentBalance = await this.getUserCreditBalance(userId);
    await this.setUserCreditBalance(userId, Math.max(0, currentBalance + change));
  }

  static async getUserRetirements(userId: string): Promise<any[]> {
    const allRetirements = await kv.getByPrefix('retirement_');
    return allRetirements
      .map(r => r.value)
      .filter(retirement => retirement.buyerId === userId)
      .sort((a, b) => new Date(b.retiredAt).getTime() - new Date(a.retiredAt).getTime());
  }

  static async createCreditRecord(credit: any): Promise<void> {
    await kv.set(credit.id, credit);
  }

  static async createRetirement(retirement: CreditRetirement): Promise<void> {
    await kv.set(retirement.id, retirement);
  }

  // Stats operations
  static async getTotalCreditsIssued(): Promise<number> {
    const result = await kv.get('total_credits_issued');
    return result?.value || 0;
  }

  static async setTotalCreditsIssued(total: number): Promise<void> {
    await kv.set('total_credits_issued', total);
  }

  static async incrementCreditsIssued(amount: number): Promise<void> {
    const current = await this.getTotalCreditsIssued();
    await this.setTotalCreditsIssued(current + amount);
  }

  static async getTotalCreditsRetired(): Promise<number> {
    const result = await kv.get('total_credits_retired');
    return result?.value || 0;
  }

  static async setTotalCreditsRetired(total: number): Promise<void> {
    await kv.set('total_credits_retired', total);
  }

  static async incrementCreditsRetired(amount: number): Promise<void> {
    const current = await this.getTotalCreditsRetired();
    await this.setTotalCreditsRetired(current + amount);
  }

  static async getPublicStats(): Promise<PublicStats> {
    const [totalCreditsIssued, totalCreditsRetired, projects] = await Promise.all([
      this.getTotalCreditsIssued(),
      this.getTotalCreditsRetired(),
      this.getAllProjects()
    ]);

    return {
      totalCreditsIssued,
      totalCreditsRetired,
      totalProjects: projects.length,
      projects
    };
  }

  // Utility methods
  static generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateTxHash(): string {
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }

  // Enhanced marketplace methods
  static async getMarketStats(): Promise<any> {
    const result = await kv.get('market_stats');
    return result?.value || null;
  }

  static async setMarketStats(stats: any): Promise<void> {
    await kv.set('market_stats', stats);
  }

  // Watchlist methods
  static async getUserWatchlist(userId: string): Promise<any[]> {
    const result = await kv.get(`watchlist_${userId}`);
    return result?.value || [];
  }

  static async addToWatchlist(userId: string, creditId: string): Promise<void> {
    const watchlist = await this.getUserWatchlist(userId);
    const exists = watchlist.some(item => item.creditId === creditId);
    
    if (!exists) {
      watchlist.push({
        creditId,
        addedAt: new Date().toISOString()
      });
      await kv.set(`watchlist_${userId}`, watchlist);
    }
  }

  static async removeFromWatchlist(userId: string, creditId: string): Promise<void> {
    const watchlist = await this.getUserWatchlist(userId);
    const filtered = watchlist.filter(item => item.creditId !== creditId);
    await kv.set(`watchlist_${userId}`, filtered);
  }

  // Enhanced MRV methods
  static async getAllMRVData(): Promise<MRVData[]> {
    const allMrv = await kv.getByPrefix('mrv_');
    return allMrv.map(m => m.value).filter(Boolean);
  }

  // NCCR specific methods
  static async getMarketStatsForNCCR(): Promise<any> {
    try {
      // Get total credits available in market
      const availableCredits = await this.getAvailableCredits();
      const totalCreditsInMarket = availableCredits.reduce((sum, credit) => sum + credit.carbonCredits, 0);

      // Get total credits retired
      const totalCreditsRetired = await this.getTotalCreditsRetired();

      // Get all retirements to calculate user stats
      const allRetirements = await kv.getByPrefix('retirement_');
      const retirements = allRetirements.map(r => r.value).filter(Boolean);
      
      // Calculate unique active users (users who have retired credits)
      const uniqueUsers = new Set(retirements.map(r => r.buyerId));
      const totalActiveUsers = uniqueUsers.size;

      // Calculate average retirement per user
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
}