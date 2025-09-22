// AI/ML Verification Service
// Handles machine learning model operations for project verification

import { Project, MLVerification } from '../database/models.tsx';

export interface MLScore {
  score: number;
  confidence: number;
  riskFactors: string[];
  recommendation: string;
}

export class MLVerificationService {
  // Main ML model calculation function
  static calculateVerificationScore(projectData: Project): MLScore {
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

  // Ecosystem type scoring
  private static scoreEcosystemType(ecosystemType: string): number {
    const ecosystemScores = {
      'mangrove': 0.2,  // Highest for mangroves
      'seagrass': 0.15,
      'saltmarsh': 0.1,
      'coastal_wetland': 0.08
    };
    
    return ecosystemScores[ecosystemType as keyof typeof ecosystemScores] || 0;
  }

  // Project area scoring
  private static scoreProjectArea(area: number, riskFactors: string[]): number {
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

  // Location-based scoring (India-specific coastal analysis)
  private static scoreLocation(location: string, riskFactors: string[]): number {
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

  // Project description quality analysis
  private static scoreDescription(description: string): number {
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

  // Project name quality analysis
  private static scoreName(name: string): number {
    if (!name || name.length < 10) {
      return -0.02; // Minor penalty for very short names
    }

    const nameKeywords = ['mangrove', 'restoration', 'conservation', 'blue carbon', 'coastal', 'marine'];
    const nameLower = name.toLowerCase();
    const hasRelevantKeywords = nameKeywords.some(keyword => nameLower.includes(keyword));
    
    return hasRelevantKeywords ? 0.02 : 0;
  }

  // Generate recommendation based on score and risk factors
  private static generateRecommendation(score: number, riskFactors: string[]): string {
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

  // Advanced MRV data analysis (if MRV data is available)
  static analyzeMRVData(mrvData: any[]): {
    score: number;
    insights: string[];
    recommendations: string[];
  } {
    if (!mrvData || mrvData.length === 0) {
      return {
        score: 0,
        insights: ['No MRV data provided'],
        recommendations: ['Submit comprehensive MRV data including satellite imagery, field measurements, and community reports']
      };
    }

    let score = 0.1; // Base score for having data
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Check for satellite data
    const hasSatelliteData = mrvData.some(data => 
      data.type === 'satellite' || 
      data.description?.toLowerCase().includes('satellite') ||
      data.description?.toLowerCase().includes('ndvi') ||
      data.description?.toLowerCase().includes('remote sensing')
    );

    if (hasSatelliteData) {
      score += 0.15;
      insights.push('Satellite verification data available');
    } else {
      recommendations.push('Include satellite imagery and remote sensing data for enhanced verification');
    }

    // Check for IoT/sensor data
    const hasIoTData = mrvData.some(data => 
      data.type === 'iot' || 
      data.description?.toLowerCase().includes('sensor') ||
      data.description?.toLowerCase().includes('iot') ||
      data.description?.toLowerCase().includes('monitoring device')
    );

    if (hasIoTData) {
      score += 0.1;
      insights.push('IoT sensor monitoring data present');
    } else {
      recommendations.push('Deploy IoT sensors for continuous environmental monitoring');
    }

    // Check for community reports
    const hasCommunityData = mrvData.some(data => 
      data.type === 'community' || 
      data.description?.toLowerCase().includes('community') ||
      data.description?.toLowerCase().includes('field report') ||
      data.description?.toLowerCase().includes('ground truth')
    );

    if (hasCommunityData) {
      score += 0.05;
      insights.push('Community engagement and field reporting documented');
    } else {
      recommendations.push('Include community-based monitoring and field reports');
    }

    return {
      score: Math.min(score, 0.3), // Cap MRV contribution to 30% of total score
      insights,
      recommendations
    };
  }

  // Risk assessment specific to Indian blue carbon projects
  static assessRegulatoryCompliance(project: Project): {
    complianceScore: number;
    issues: string[];
    requirements: string[];
  } {
    const issues: string[] = [];
    const requirements: string[] = [];
    let complianceScore = 0.8; // Start with high compliance assumption

    // Check for coastal regulation zone compliance
    const location = project.location.toLowerCase();
    
    requirements.push('Compliance with Coastal Regulation Zone (CRZ) Notification 2019');
    requirements.push('Environmental clearance from State Pollution Control Board');
    requirements.push('Forest clearance if applicable (Forest Conservation Act 1980)');
    requirements.push('Wildlife clearance if in protected areas');

    // Size-based requirements
    if (project.area > 500) {
      requirements.push('Environmental Impact Assessment (EIA) required for large projects');
    }

    // Ecosystem-specific requirements
    if (project.ecosystemType === 'mangrove') {
      requirements.push('Mangrove conservation approval from Forest Department');
    }

    return {
      complianceScore,
      issues,
      requirements
    };
  }

  // Generate comprehensive verification report
  static generateVerificationReport(
    project: Project, 
    mlScore: MLScore, 
    mrvAnalysis?: any,
    complianceAssessment?: any
  ): string {
    const timestamp = new Date().toISOString();
    
    return `
# Blue Carbon Project Verification Report

**Project:** ${project.name}
**Generated:** ${timestamp}
**ML Verification Score:** ${Math.round(mlScore.score * 100)}%

## Executive Summary
${mlScore.recommendation}

## Project Overview
- **Location:** ${project.location}
- **Ecosystem Type:** ${project.ecosystemType}
- **Area:** ${project.area} hectares
- **Status:** ${project.status}

## ML Analysis Results
- **Verification Score:** ${Math.round(mlScore.score * 100)}%
- **Confidence Level:** ${Math.round(mlScore.confidence * 100)}%

### Risk Factors Identified:
${mlScore.riskFactors.map(risk => `- ${risk}`).join('\n')}

## Recommendations
Based on the analysis, the following actions are recommended:
1. ${mlScore.recommendation}
${mrvAnalysis?.recommendations ? mrvAnalysis.recommendations.map((rec: string, i: number) => `${i + 2}. ${rec}`).join('\n') : ''}

---
*This report was generated by Samudra Ledger's AI verification system*
    `.trim();
  }
}