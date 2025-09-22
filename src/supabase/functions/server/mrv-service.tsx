// MRV Service
// Handles Monitoring, Reporting, and Verification data processing

import { createClient } from "npm:@supabase/supabase-js";
import { DatabaseRepository } from './database-repository.tsx';
import { MRVData, CreateMRVRequest, UploadedFile } from './models.tsx';

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

        // Create signed URL for the uploaded file
        const { data: signedUrlData } = await this.supabase.storage
          .from(MRVService.MRV_BUCKET_NAME)
          .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days expiry

        const uploadedFile: UploadedFile = {
          name: file.name,
          originalName: file.name,
          size: file.size,
          type: file.type,
          path: fileName,
          url: signedUrlData?.signedUrl || '',
          uploadedAt: new Date().toISOString(),
          category: this.categorizeFile(file.name, file.type)
        };

        uploadedFiles.push(uploadedFile);
        console.log(`File uploaded: ${file.name} -> ${fileName}`);
      }
    }

    return uploadedFiles;
  }

  private categorizeFile(fileName: string, fileType: string): 'photo' | 'iot_data' | 'document' {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'heic'].includes(extension || '')) {
      return 'photo';
    }
    
    if (['csv', 'json', 'xml', 'txt', 'log'].includes(extension || '')) {
      return 'iot_data';
    }
    
    return 'document';
  }

  async submitMRVData(mrvRequest: CreateMRVRequest, submitterId: string): Promise<{ mrvId: string; mrvData: MRVData }> {
    const mrvId = DatabaseRepository.generateId('mrv');
    
    const mrvData: MRVData = {
      id: mrvId,
      projectId: mrvRequest.projectId,
      managerId: submitterId,
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
      // Create carbon credit record in database
      const creditId = DatabaseRepository.generateId('credit');
      const creditRecord = {
        id: creditId,
        mrvId: mrvId,
        projectId: existingMRV.projectId,
        totalAmount: existingMRV.mlResults.carbon_estimate,
        availableAmount: existingMRV.mlResults.carbon_estimate,
        pricePerCredit: 25.00, // Default price
        healthScore: existingMRV.mlResults.biomass_health_score,
        evidenceCid: existingMRV.mlResults.evidenceCid,
        onChainTxHash: DatabaseRepository.generateTxHash()
      };

      await DatabaseRepository.createCarbonCredit(creditRecord);

      // Generate blockchain transaction hash for MRV record (simulated for now)
      updatedMrv.onChainTxHash = DatabaseRepository.generateTxHash();
      
      console.log(`✅ Carbon credits issued for MRV ${mrvId}: ${existingMRV.mlResults.carbon_estimate} tCO₂e`);
      console.log(`📝 Creating immutable record on blockchain: ${updatedMrv.onChainTxHash}`);
    }

    await DatabaseRepository.updateMRVData(mrvId, updatedMrv);
    
    // Update project status based on approval
    const newProjectStatus = approved ? 'approved' : 'rejected';
    await DatabaseRepository.updateProject(existingMRV.projectId, { status: newProjectStatus });
    
    return updatedMrv;
  }

  validateMRVData(mrvData: CreateMRVRequest): void {
    if (!mrvData.projectId) {
      throw new Error('Project ID is required');
    }

    if (!mrvData.rawData) {
      throw new Error('Raw data is required');
    }

    // Validate that at least some data is provided
    const { satelliteData, communityReports, sensorReadings, iotData } = mrvData.rawData;
    if (!satelliteData && !communityReports && !sensorReadings && !iotData) {
      throw new Error('At least one type of monitoring data must be provided');
    }
  }
}