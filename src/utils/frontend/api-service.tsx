// Frontend API Service Layer
// Handles all API calls from the frontend to the backend

import { supabase } from '../supabase/client.tsx';
import { projectId } from '../supabase/info.tsx';
import {
  Project,
  MRVData,
  CarbonCredit,
  MLVerification,
  CreateProjectRequest,
  CreateMRVRequest,
  ApprovalRequest,
  RetireCreditRequest,
  SignupRequest,
  MLVerificationRequest,
  PublicStats,
  ProjectListResponse,
  MRVListResponse,
  CreditsListResponse,
  MLVerificationResponse,
  FileUploadResponse,
  ApiResponse
} from '../database/models.tsx';

export class ApiService {
  // Helper method to get base URL (lazy construction)
  private static getBaseUrl(): string {
    return `https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb`;
  }

  // Helper method to get auth headers
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`
    };
  }

  // Helper method to handle HTTP responses
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, use the status text
        errorMessage = `Server error (${response.status}): ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    try {
      return await response.json();
    } catch {
      throw new Error('Invalid response format from server');
    }
  }

  // Authentication APIs
  static async signup(signupData: SignupRequest): Promise<{ user: any; role: string }> {
    const response = await fetch(`${this.getBaseUrl()}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });
    return this.handleResponse(response);
  }

  static async checkNCCREligibility(email: string): Promise<{ isAllowed: boolean; message: string }> {
    const response = await fetch(`${this.getBaseUrl()}/check-nccr-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return this.handleResponse(response);
  }

  // Public APIs (no authentication required)
  static async getPublicStats(): Promise<PublicStats> {
    const response = await fetch(`${this.getBaseUrl()}/public/stats`);
    return this.handleResponse(response);
  }

  // Project Management APIs
  static async createProject(projectData: CreateProjectRequest): Promise<{ projectId: string; project: Project }> {
    const response = await fetch(`${this.getBaseUrl()}/projects`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(projectData)
    });
    return this.handleResponse(response);
  }

  static async getManagerProjects(): Promise<ProjectListResponse> {
    const response = await fetch(`${this.getBaseUrl()}/projects/manager`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getManagerProjectsWithCredits(): Promise<{ projects: any[] }> {
    const response = await fetch(`${this.getBaseUrl()}/projects/manager-with-credits`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async getAllProjects(): Promise<ProjectListResponse> {
    const response = await fetch(`${this.getBaseUrl()}/projects/all`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async deleteProject(projectId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.getBaseUrl()}/projects/${projectId}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // MRV Data APIs
  static async uploadMRVFiles(projectId: string, files: File[]): Promise<FileUploadResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const formData = new FormData();
    formData.append('projectId', projectId);
    files.forEach(file => formData.append('files', file));

    const response = await fetch(`${this.getBaseUrl()}/mrv/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token || ''}`
      },
      body: formData
    });
    return this.handleResponse(response);
  }

  static async submitMRVData(mrvData: CreateMRVRequest): Promise<{ mrvId: string; mrvData: MRVData }> {
    const response = await fetch(`${this.getBaseUrl()}/mrv`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(mrvData)
    });
    return this.handleResponse(response);
  }

  static async getPendingMRV(): Promise<MRVListResponse> {
    const response = await fetch(`${this.getBaseUrl()}/mrv/pending`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async approveMRV(mrvId: string, approval: ApprovalRequest): Promise<{ success: boolean; mrvData: MRVData }> {
    const response = await fetch(`${this.getBaseUrl()}/mrv/${mrvId}/approve`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(approval)
    });
    return this.handleResponse(response);
  }

  // ML Verification APIs
  static async runMLVerification(request: MLVerificationRequest): Promise<MLVerificationResponse> {
    const response = await fetch(`${this.getBaseUrl()}/ml/verify-project`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(request)
    });
    return this.handleResponse(response);
  }

  static async getMLVerification(projectId: string): Promise<MLVerificationResponse> {
    const response = await fetch(`${this.getBaseUrl()}/ml/verification/${projectId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Carbon Credits APIs
  static async getAvailableCredits(): Promise<CreditsListResponse> {
    const response = await fetch(`${this.getBaseUrl()}/credits/available`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async retireCredits(retirement: RetireCreditRequest): Promise<{ retirementId: string; retirement: any }> {
    const response = await fetch(`${this.getBaseUrl()}/credits/retire`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(retirement)
    });
    return this.handleResponse(response);
  }

  static async createPaymentIntent(creditId: string, quantity: number): Promise<{ orderId: string; amount: number; currency: string }> {
    const response = await fetch(`${this.getBaseUrl()}/payment/create-order`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ creditId, quantity })
    });
    return this.handleResponse(response);
  }

  // Health check
  static async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${this.getBaseUrl()}/health`);
    return this.handleResponse(response);
  }
}

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Toast notification helpers for API responses
export const showApiError = (error: unknown, defaultMessage = 'An error occurred') => {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error('API Error:', error);
  return message;
};

export const showApiSuccess = (message: string) => {
  console.log('API Success:', message);
  return message;
};