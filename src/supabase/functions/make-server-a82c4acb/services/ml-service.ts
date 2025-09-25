// Machine Learning Verification Service
// Handles AI/ML model operations on the backend

import { DatabaseRepository } from "../repository.ts";
import { MLVerification, Project } from "../models.ts";

export class MLService {
  async verifyProject(projectId: string, projectData: Project, verifierId: string): Promise<MLVerification> {
    console.log(`Starting ML verification for project ${projectId}`);
    
    // Calculate ML verification score
    const mlScore = this.calculateVerificationScore(projectData);
    
    // Create verification result
    const verificationResult: MLVerification = {
      projectId,
      mlScore: mlScore.score,
      confidence: mlScore.confidence,
      riskFactors: mlScore.riskFactors,
      recommendation: mlScore.recommendation,
      timestamp: new Date().toISOString(),
      verifierId: verifierId
    };

    // Store ML verification result in database
    await DatabaseRepository.createMLVerification(verificationResult);

    console.log(`ML verification completed for project ${projectId}: score ${mlScore.score}`);
    
    return verificationResult;
  }

  async getVerificationResult(projectId: string): Promise<MLVerification | null> {
    return DatabaseRepository.getMLVerification(projectId);
  }

  private calculateVerificationScore(projectData: Project): {
    score: number;
    confidence: number;
    riskFactors: string[];
    recommendation: string;
  } {
    const {
      name,
      description,
      location,
      ecosystemType,
      area
    } = projectData;

    let score = 0.5; // Base score
    let confidence = 0.8; // Base confidence
    const riskFactors: string[] = [];

    // Ecosystem type scoring
    score += this.scoreEcosystemType(ecosystemType);

    // Area analysis
    const areaScore = this.scoreProjectArea(area, riskFactors);
    score += areaScore;

    // Location analysis (India-specific)
    const locationScore = this.scoreLocation(location, riskFactors);
    score += locationScore;

    // Project description quality analysis
    const descriptionScore = this.scoreDescription(description);
    score += descriptionScore;

    // Project name analysis
    const nameScore = this.scoreName(name);
    score += nameScore;

    // Ensure score is within bounds
    score = Math.max(0, Math.min(1, score));
    confidence = Math.max(0.3, Math.min(1, confidence));

    // Adjust confidence based on risk factors
    if (riskFactors.length > 3) {
      confidence -= 0.1;
    }

    const recommendation = this.generateRecommendation(score, riskFactors);

    return {
      score: Math.round(score * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      riskFactors,
      recommendation
    };
  }

  private scoreEcosystemType(ecosystemType: string): number {
    const ecosystemScores = {
      'mangrove': 0.2,  // Highest for mangroves
      'seagrass': 0.15,
      'saltmarsh': 0.1,
      'coastal_wetland': 0.08
    };
    
    return ecosystemScores[ecosystemType as keyof typeof ecosystemScores] || 0;
  }

  private scoreProjectArea(area: number, riskFactors: string[]): number {
    if (area > 1000) {
      return 0.1; // Large projects get bonus points
    } else if (area < 100) {
      riskFactors.push('Small project area may limit carbon sequestration impact');
      return -0.05;
    } else if (area < 50) {
      riskFactors.push('Very small project area - insufficient for meaningful carbon impact');
      return -0.1;
    }
    return 0;
  }

  private scoreLocation(location: string, riskFactors: string[]): number {
    const coastalStates = [
      'gujarat', 'maharashtra', 'goa', 'karnataka', 'kerala', 
      'tamil nadu', 'andhra pradesh', 'odisha', 'west bengal',
      'puducherry', 'daman', 'diu', 'lakshadweep', 'andaman', 'nicobar'
    ];
    
    const locationLower = location.toLowerCase();
    const isCoastal = coastalStates.some(state => locationLower.includes(state));
    
    if (isCoastal) {
      // Additional bonus for high-priority coastal regions
      const highPriorityRegions = ['sundarbans', 'kerala backwaters', 'chilika', 'pulicat'];
      const isHighPriority = highPriorityRegions.some(region => locationLower.includes(region));
      
      if (isHighPriority) {
        return 0.15; // Extra bonus for priority conservation areas
      }
      return 0.1;
    } else {
      riskFactors.push('Location not identified as suitable coastal area for blue carbon projects');
      return -0.15;
    }
  }

  private scoreDescription(description: string): number {
    if (!description || description.length < 50) {
      return -0.05; // Penalty for insufficient description
    }

    const keyTerms = [
      'restoration', 'conservation', 'monitoring', 'community', 
      'sustainable', 'biodiversity', 'carbon sequestration', 
      'ecosystem services', 'coastal protection', 'climate change',
      'mrv', 'verification', 'baseline', 'stakeholder'
    ];
    
    const descriptionLower = description.toLowerCase();
    const termMatches = keyTerms.filter(term => descriptionLower.includes(term)).length;
    
    // Score based on presence of relevant terms
    return (termMatches / keyTerms.length) * 0.1;
  }

  private scoreName(name: string): number {
    if (!name || name.length < 10) {
      return -0.02; // Minor penalty for very short names
    }

    const nameKeywords = ['mangrove', 'restoration', 'conservation', 'blue carbon', 'coastal', 'marine'];
    const nameLower = name.toLowerCase();
    const hasRelevantKeywords = nameKeywords.some(keyword => nameLower.includes(keyword));
    
    return hasRelevantKeywords ? 0.02 : 0;
  }

  private generateRecommendation(score: number, riskFactors: string[]): string {
    if (score >= 0.8) {
      return 'APPROVE - High confidence for verification. Project demonstrates strong potential for blue carbon impact.';
    } else if (score >= 0.6) {
      const riskCount = riskFactors.length;
      if (riskCount <= 2) {
        return 'CONDITIONAL_APPROVAL - Good project fundamentals with minor concerns. Recommend additional verification steps.';
      } else {
        return 'CONDITIONAL_APPROVAL - Requires additional documentation and verification to address identified risk factors.';
      }
    } else if (score >= 0.4) {
      return 'REVIEW_REQUIRED - Significant concerns about project viability. Detailed review and additional information needed before approval.';
    } else {
      return 'REJECT - High risk factors present. Project does not meet minimum criteria for blue carbon verification.';
    }
  }
}