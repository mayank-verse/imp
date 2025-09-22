import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { supabase } from '../utils/supabase/client';
import { ApiService, showApiError, showApiSuccess } from '../utils/frontend/api-service';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Cpu, 
  BarChart3,
  Eye,
  Target,
  MapPin,
  Leaf,
  Waves,
  Satellite,
  Activity
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface MLVerificationPanelProps {
  project: any;
  onVerificationComplete?: () => void;
}

interface MLVerification {
  projectId: string;
  mlScore: number;
  confidence: number;
  riskFactors: string[];
  recommendation: string;
  timestamp: string;
  verifierId: string;
}

export function MLVerificationPanel({ project, onVerificationComplete }: MLVerificationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<MLVerification | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const runMLVerification = async () => {
    try {
      setLoading(true);

      const data = await ApiService.runMLVerification({
        projectId: project.id,
        projectData: project
      });
      
      setVerification(data.verification);
      toast.success(showApiSuccess('ML verification completed successfully'));
      
      if (onVerificationComplete) {
        onVerificationComplete();
      }
    } catch (error) {
      console.error('Error running ML verification:', error);
      toast.error(showApiError(error, 'Failed to run ML verification'));
    } finally {
      setLoading(false);
    }
  };

  const loadExistingVerification = async () => {
    try {
      const data = await ApiService.getMLVerification(project.id);
      setVerification(data.verification);
    } catch (error) {
      // Silently fail if no verification exists yet
      console.log('No existing verification found:', error);
    }
  };

  React.useEffect(() => {
    loadExistingVerification();
  }, [project.id]);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    if (score >= 0.4) return 'outline';
    return 'destructive';
  };

  const getRecommendationIcon = (recommendation: string) => {
    if (recommendation.includes('APPROVE')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (recommendation.includes('CONDITIONAL')) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    if (recommendation.includes('REVIEW')) return <Eye className="h-4 w-4 text-orange-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getProjectAnalysisInsights = () => {
    const insights = [];
    
    // Ecosystem analysis
    if (project.ecosystemType === 'mangroves') {
      insights.push({
        icon: <Leaf className="h-4 w-4 text-green-600" />,
        title: 'High Carbon Potential',
        description: 'Mangroves are highly effective carbon sinks'
      });
    }
    
    // Location analysis
    const coastalStates = ['gujarat', 'maharashtra', 'goa', 'karnataka', 'kerala', 'tamil nadu', 'andhra pradesh', 'odisha', 'west bengal'];
    const isCoastal = coastalStates.some(state => project.location.toLowerCase().includes(state));
    
    if (isCoastal) {
      insights.push({
        icon: <MapPin className="h-4 w-4 text-blue-600" />,
        title: 'Coastal Location',
        description: 'Located in suitable coastal region for blue carbon'
      });
    }
    
    // Area analysis
    if (project.area > 1000) {
      insights.push({
        icon: <TrendingUp className="h-4 w-4 text-green-600" />,
        title: 'Large Scale Project',
        description: 'Significant area for maximum carbon impact'
      });
    }
    
    return insights;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>AI/ML Project Verification</span>
        </CardTitle>
        <CardDescription>
          Advanced machine learning analysis for blue carbon project verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Quick Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <Waves className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Ecosystem</p>
              <p className="text-xs text-gray-600 capitalize">{project.ecosystemType}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <MapPin className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">Area</p>
              <p className="text-xs text-gray-600">{project.area} hectares</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <Satellite className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-gray-600 capitalize">{project.status}</p>
            </div>
          </div>
        </div>

        {/* Project Analysis Insights */}
        <div>
          <h4 className="font-medium mb-3">Pre-Analysis Insights</h4>
          <div className="space-y-2">
            {getProjectAnalysisInsights().map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-2 border rounded-lg">
                {insight.icon}
                <div>
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-gray-600">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* ML Verification Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center space-x-2">
              <Cpu className="h-4 w-4" />
              <span>ML Model Analysis</span>
            </h4>
            <Button 
              onClick={runMLVerification} 
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  <span>Run ML Verification</span>
                </>
              )}
            </Button>
          </div>

          {verification && (
            <div className="space-y-4">
              {/* Verification Score */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium">Verification Score</h5>
                  <Badge variant={getScoreBadgeVariant(verification.mlScore)}>
                    {Math.round(verification.mlScore * 100)}%
                  </Badge>
                </div>
                
                <Progress value={verification.mlScore * 100} className="mb-2" />
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Confidence: {Math.round(verification.confidence * 100)}%</span>
                  <span className={getScoreColor(verification.mlScore)}>
                    {verification.mlScore >= 0.8 ? 'High' : 
                     verification.mlScore >= 0.6 ? 'Medium' : 
                     verification.mlScore >= 0.4 ? 'Low' : 'Very Low'} Verification Score
                  </span>
                </div>
              </div>

              {/* Recommendation */}
              <Alert>
                <div className="flex items-center space-x-2">
                  {getRecommendationIcon(verification.recommendation)}
                  <span className="font-medium">ML Recommendation</span>
                </div>
                <AlertDescription className="mt-2">
                  {verification.recommendation}
                </AlertDescription>
              </Alert>

              {/* Risk Factors */}
              {verification.riskFactors.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2 flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span>Identified Risk Factors</span>
                  </h5>
                  <ScrollArea className="h-32 border rounded-lg p-3">
                    <div className="space-y-2">
                      {verification.riskFactors.map((risk, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{risk}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Detailed Analysis Toggle */}
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>{showDetails ? 'Hide' : 'Show'} Detailed Analysis</span>
                </Button>
              </div>

              {/* Detailed Analysis */}
              {showDetails && (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h5 className="font-medium mb-3">Detailed ML Analysis</h5>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Project ID:</span> {verification.projectId}
                    </div>
                    <div>
                      <span className="font-medium">Analysis Timestamp:</span> {new Date(verification.timestamp).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Verifier ID:</span> {verification.verifierId}
                    </div>
                    <div className="text-xs text-gray-600 mt-4 p-2 bg-white rounded border">
                      <p><strong>Model Details:</strong> This analysis uses a machine learning model trained on blue carbon project characteristics including ecosystem type, geographical location, project area, and MRV data quality. The model considers India-specific coastal conditions and regulatory requirements.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!verification && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Click "Run ML Verification" to analyze this project with AI</p>
              <p className="text-sm mt-2">The ML model will evaluate project viability, risk factors, and provide recommendations</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}