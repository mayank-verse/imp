// Data Models for Carbon Credit Verification Platform
// Defines all data structures used in the platform

export interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: 'project_manager' | 'nccr_verifier' | 'buyer';
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  ecosystemType: string;
  area: number;
  coordinates?: string;
  communityPartners?: string;
  expectedCarbonCapture?: number;
  managerId: string;
  managerName?: string;
  managerEmail?: string;
  status: 'registered' | 'mrv_submitted' | 'approved' | 'rejected';
  createdAt: string;
  onChainTxHash?: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  location: string;
  ecosystemType: string;
  area: number;
  coordinates?: string;
  communityPartners?: string;
  expectedCarbonCapture?: number;
}

export interface MRVData {
  id: string;
  projectId: string;
  submittedBy: string;
  rawData: {
    satelliteData?: string;
    communityReports?: string;
    sensorReadings?: string;
    iotData?: string;
    notes?: string;
  };
  files: UploadedFile[];
  status: 'pending_ml_processing' | 'pending_verification' | 'approved' | 'rejected';
  submittedAt: string;
  mlResults?: {
    carbon_estimate: number;
    biomass_health_score: number;
    evidenceCid: string;
  };
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  onChainTxHash?: string;
}

export interface CreateMRVRequest {
  projectId: string;
  rawData: {
    satelliteData?: string;
    communityReports?: string;
    sensorReadings?: string;
    iotData?: string;
    notes?: string;
  };
  files: UploadedFile[];
}

export interface UploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadPath: string;
  signedUrl: string;
  uploadedAt: string;
  category: 'photo' | 'iot_data' | 'document';
}

export interface MLVerification {
  id: string;
  projectId: string;
  verifierId: string;
  riskScore: number;
  confidence: number;
  riskFactors: string[];
  recommendation: string;
  detailedAnalysis: {
    locationAnalysis: any;
    ecosystemAnalysis: any;
    scalabilityAnalysis: any;
    dataQualityAssessment: any;
  };
  verifiedAt: string;
  modelVersion: string;
}

export interface CarbonCredit {
  id: string;
  projectId: string;
  amount: number;
  verificationTxHash: string;
  issuedAt: string;
  isRetired: boolean;
  retiredAt?: string;
  retiredBy?: string;
}

export interface CreditRetirement {
  id: string;
  creditId: string;
  buyerId: string;
  amount: number;
  reason: string;
  retiredAt: string;
  onChainTxHash: string;
}

export interface PublicStats {
  totalCreditsIssued: number;
  totalCreditsRetired: number;
  totalProjects: number;
  projects: Project[];
}

// API Request/Response Types
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: string;
}

export interface ApprovalRequest {
  approved: boolean;
  notes: string;
}

export interface RetireCreditRequest {
  creditId: string;
  amount: number;
  reason: string;
}

export interface MLVerificationRequest {
  projectId: string;
  projectData: Project;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProjectListResponse {
  projects: Project[];
}

export interface MRVListResponse {
  pendingMrv: MRVData[];
}

export interface CreditsListResponse {
  availableCredits: CarbonCredit[];
}

export interface MLVerificationResponse {
  verification: MLVerification;
}

export interface FileUploadResponse {
  files: UploadedFile[];
}