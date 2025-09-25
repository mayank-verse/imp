// MRV Data Management Service
// Handles Monitoring, Reporting, and Verification data processing

import { createClient } from "npm:@supabase/supabase-js";
import { DatabaseRepository } from "../repository.ts";
import { MRVData, CreateMRVRequest, UploadedFile, CarbonCredit } from "../models.ts";

export class MRVService {
  private supabase: any;
  private static readonly MRV_BUCKET_NAME = 'make-a82c4acb-mrv-files';

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some((bucket: any) => bucket.name === MRVService.MRV_BUCKET_NAME);
      if (!bucketExists) {
        await this.supabase.storage.createBucket(MRVService.MRV_BUCKET_NAME, { public: false });
        console.log(`Created bucket: ${MRVService.MRV_BUCKET_NAME}`);
      }
    } catch (error) {
      console.log(`Bucket initialization error: ${error}`);
    }
  }

  async uploadFiles(projectId: string, files: File[]): Promise<UploadedFile[]> {
    const uploadedFiles: UploadedFile[] = [];
    
    for (const file of files) {
      if (file instanceof File) {
        const fileName = `${projectId}/${Date.now()}_${file.name}`;
        const fileBuffer = await file.arrayBuffer();
        
        const { data, error } = await this.supabase.storage
          .from(MRVService.MRV_BUCKET_NAME)
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false
          });

        if (error) {
          console.log(`File upload error: ${error.message}`);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        // Generate signed URL for the uploaded file
        const { data: signedUrlData } = await this.supabase.storage
          .from(MRVService.MRV_BUCKET_NAME)
          .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

        // Categorize file type
        const category = this.categorizeFile(file);

        uploadedFiles.push({
          name: file.name,
          originalName: file.name,
          size: file.size,
          type: file.type,
          category: category,
          path: fileName,
          url: signedUrlData?.signedUrl,
          uploadedAt: new Date().toISOString()
        });
      }
    }

    return uploadedFiles;
  }

  private categorizeFile(file: File): 'photo' | 'iot_data' | 'document' {
    if (file.type.startsWith('image/')) {
      return 'photo';
    } else if (
      file.type.includes('csv') || 
      file.type.includes('json') || 
      file.type.includes('xml') || 
      file.name.endsWith('.log') || 
      file.name.endsWith('.txt')
    ) {
      return 'iot_data';
    }
    return 'document';
  }

  async submitMRVData(mrvRequest: CreateMRVRequest, managerId: string): Promise<{ mrvId: string; mrvData: MRVData }> {
    const mrvId = DatabaseRepository.generateId('mrv');
    
    const mrvData: MRVData = {
      id: mrvId,
      projectId: mrvRequest.projectId,
      managerId: managerId,
      rawData: mrvRequest.rawData,
      files: mrvRequest.files,
      status: 'pending_ml_processing',
      submittedAt: new Date().toISOString(),
      // Simulate ML processing results - in production this would be async
      mlResults: this.simulateMLProcessing()
    };

    await DatabaseRepository.createMRVData(mrvData);
    
    // Update project status
    await DatabaseRepository.updateProject(mrvRequest.projectId, { status: 'mrv_submitted' });
    
    return { mrvId, mrvData };
  }

  private simulateMLProcessing() {
    return {
      carbon_estimate: Math.floor(Math.random() * 100) + 50, // 50-150 tonnes
      biomass_health_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
      evidenceCid: `Qm${Math.random().toString(36).substr(2, 44)}`
    };
  }

  async getPendingMRV(): Promise<MRVData[]> {
    return DatabaseRepository.getPendingMRV();
  }

  async approveMRV(mrvId: string, verifierId: string, approved: boolean, notes: string): Promise<MRVData> {
    const existingMRV = await DatabaseRepository.getMRVData(mrvId);
    if (!existingMRV) {
      throw new Error('MRV report not found');
    }

    const updatedMrv: MRVData = {
      ...existingMRV,
      status: approved ? 'approved' : 'rejected',
      verificationNotes: notes,
      verifiedBy: verifierId,
      verifiedAt: new Date().toISOString()
    };

    if (approved && existingMRV.mlResults) {
      try {
        // Update total credits issued
        await DatabaseRepository.incrementCreditsIssued(existingMRV.mlResults.carbon_estimate);

        // Generate blockchain transaction hash (simulated for now)
        updatedMrv.onChainTxHash = DatabaseRepository.generateTxHash();
        
        // Create carbon credit record with proper tracking
        const creditId = DatabaseRepository.generateId('credit');
        const carbonCredit: CarbonCredit = {
          id: creditId,
          projectId: existingMRV.projectId,
          amount: existingMRV.mlResults.carbon_estimate,
          ownerId: undefined, // Available for purchase
          isRetired: false,
          healthScore: existingMRV.mlResults.biomass_health_score,
          evidenceCid: existingMRV.mlResults.evidenceCid,
          verifiedAt: new Date().toISOString(),
          mrvId: mrvId,
          onChainTxHash: updatedMrv.onChainTxHash
        };
        
        await DatabaseRepository.createCarbonCredit(carbonCredit);
        
        console.log(`✅ Carbon credits issued for MRV ${mrvId}: ${existingMRV.mlResults.carbon_estimate} tCO₂e`);
      } catch (error) {
        console.error('❌ Failed to issue credits:', error);
        
        // Fallback: update credits without blockchain transaction
        await DatabaseRepository.incrementCreditsIssued(existingMRV.mlResults.carbon_estimate);
        updatedMrv.onChainTxHash = DatabaseRepository.generateTxHash();
        
        // Create carbon credit record even without blockchain
        const creditId = DatabaseRepository.generateId('credit');
        const carbonCredit: CarbonCredit = {
          id: creditId,
          projectId: existingMRV.projectId,
          amount: existingMRV.mlResults.carbon_estimate,
          ownerId: undefined,
          isRetired: false,
          healthScore: existingMRV.mlResults.biomass_health_score,
          evidenceCid: existingMRV.mlResults.evidenceCid,
          verifiedAt: new Date().toISOString(),
          mrvId: mrvId,
          onChainTxHash: updatedMrv.onChainTxHash
        };
        
        await DatabaseRepository.createCarbonCredit(carbonCredit);
        
        console.log(`⚠️ Credits issued without blockchain transaction for MRV ${mrvId}`);
      }
    }

    await DatabaseRepository.updateMRVData(mrvId, updatedMrv);
    
    // Update project status based on approval
    const newProjectStatus = approved ? 'approved' : 'rejected';
    await DatabaseRepository.updateProject(existingMRV.projectId, { status: newProjectStatus });
    
    return updatedMrv;
  }

  async getMRVByProject(projectId: string): Promise<MRVData[]> {
    const allMrv = await DatabaseRepository.getPendingMRV();
    return allMrv.filter(mrv => mrv.projectId === projectId);
  }

  validateMRVData(mrvData: CreateMRVRequest): void {
    if (!mrvData.projectId) {
      throw new Error('Project ID is required');
    }

    const { rawData } = mrvData;
    if (!rawData.satelliteData || !rawData.communityReports) {
      throw new Error('Satellite data and community reports are required');
    }

    if (rawData.satelliteData.length < 50 || rawData.communityReports.length < 50) {
      throw new Error('MRV data must contain sufficient detail (minimum 50 characters each)');
    }
  }

  // Generate MRV quality score based on data completeness
  calculateMRVQualityScore(mrvData: MRVData): number {
    let score = 0;
    const maxScore = 100;

    // Text data completeness (40% of score)
    const textFields = [
      mrvData.rawData.satelliteData,
      mrvData.rawData.communityReports,
      mrvData.rawData.sensorReadings,
      mrvData.rawData.iotData,
      mrvData.rawData.notes
    ];

    const completedTextFields = textFields.filter(field => field && field.length > 20).length;
    score += (completedTextFields / textFields.length) * 40;

    // File uploads (40% of score)
    const fileCategories = ['photo', 'iot_data', 'document'];
    const presentCategories = new Set(mrvData.files.map(f => f.category));
    score += (presentCategories.size / fileCategories.length) * 40;

    // File quantity bonus (20% of score)
    const fileCount = mrvData.files.length;
    if (fileCount >= 10) score += 20;
    else if (fileCount >= 5) score += 15;
    else if (fileCount >= 3) score += 10;
    else if (fileCount >= 1) score += 5;

    return Math.round(score);
  }
}