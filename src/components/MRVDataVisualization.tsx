// src/components/MRVDataVisualization.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Area, AreaChart, Tooltip
} from 'recharts';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { 
  ChartContainer, 
  ChartTooltip as ChartTooltipContainer, 
  ChartTooltipContent,
  ChartConfig
} from './ui/chart';
import {
  TrendingUp, Satellite, Camera, FileText, MapPin, Calendar,
  BarChart3, Activity, Zap, Target, Brain, Shield, AlertCircle,
  CheckCircle, Clock, TreePine, Waves, Users, Database
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: string;
  };
}

interface Project {
  communityPartners: string | undefined;
  managerEmail: string;
  managerName: string;
  managerId: string;
  description: string;
  id: string;
  name: string;
  location: string;
  ecosystemType: string;
  area: number;
  coordinates?: string;
  expectedCarbonCapture?: number;
  status: string;
  createdAt: string;
}

interface MRVData {
  id: string;
  projectId: string;
  rawData: {
    satelliteData: string;
    communityReports: string;
    sensorReadings: string;
    notes: string;
  };
  files: Array<{ name: string; size: number; type: string }>;
  status: string;
  submittedAt: string;
  mlResults: {
    carbon_estimate: number;
    biomass_health_score: number;
    evidenceCid: string;
    confidence_score?: number;
    data_completeness?: number;
    temporal_consistency?: number;
    spatial_accuracy?: number;
  };
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

interface ProjectTimeline {
  date: string;
  event: string;
  type: 'registration' | 'mrv_submission' | 'verification' | 'credit_issuance';
  status: 'completed' | 'pending' | 'failed';
}

interface QualityMetrics {
  dataCompleteness: number;
  temporalConsistency: number;
  spatialAccuracy: number;
  communityEngagement: number;
  satelliteConfidence: number;
}

interface TrendData {
  month: string;
  carbon_estimate: number;
  health_score: number;
  submissions: number;
  approvals: number;
}

interface MRVDataVisualizationProps {
  user: User;
  selectedProject?: Project | null;
  onProjectSelect?: (project: Project) => void;
}

const chartConfig = {
  carbon: { label: "tCO₂e", color: "var(--chart-1)" },
  health: { label: "Health Score", color: "var(--chart-2)" },
  confidence: { label: "Confidence", color: "var(--chart-3)" },
  submissions: { label: "Submissions", color: "var(--chart-4)" },
  approvals: { label: "Approvals", color: "var(--chart-2)" },
} satisfies ChartConfig;

const pieChartConfig = {
    approved: { label: 'Approved', color: 'var(--chart-2)' },
    pending_ml_processing: { label: 'Pending ML', color: 'var(--chart-4)' },
    pending_verification: { label: 'Pending Verification', color: 'var(--chart-3)' },
    rejected: { label: 'Rejected', color: 'var(--chart-5)' },
} satisfies ChartConfig

export function MRVDataVisualization({ user, selectedProject, onProjectSelect }: MRVDataVisualizationProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [mrvData, setMrvData] = useState<MRVData[]>([]);
  const [filteredMrvData, setFilteredMrvData] = useState<MRVData[]>([]);
  const [projectTimeline, setProjectTimeline] = useState<ProjectTimeline[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    dataCompleteness: 0,
    temporalConsistency: 0,
    spatialAccuracy: 0,
    communityEngagement: 0,
    satelliteConfidence: 0
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  const [currentProject, setCurrentProject] = useState<Project | null>(selectedProject || null);
  const [timeRange, setTimeRange] = useState('6m');
  const [selectedMRV, setSelectedMRV] = useState<MRVData | null>(null);
  const [showMRVDetail, setShowMRVDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
    fetchMRVData();
    fetchTrendData();
  }, []);

  useEffect(() => {
    if (currentProject) {
      filterDataByProject(currentProject.id);
      fetchProjectTimeline(currentProject.id);
    }
  }, [currentProject, mrvData]);

  const fetchProjects = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/projects/all`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        if (!currentProject && data.projects.length > 0) {
          setCurrentProject(data.projects[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchMRVData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/mrv/all`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMrvData(data.mrvData || []);
      }
    } catch (error) {
      console.error('Error fetching MRV data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/analytics/trends?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTrendData(data.trends || []);
      }
    } catch (error) {
      console.error('Error fetching trend data:', error);
    }
  };

  const fetchProjectTimeline = async (selectedProjectId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/projects/${selectedProjectId}/timeline`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjectTimeline(data.timeline || []);
      }
    } catch (error) {
      console.error('Error fetching project timeline:', error);
    }
  };

  const filterDataByProject = (projectId: string) => {
    const filtered = mrvData.filter(mrv => mrv.projectId === projectId);
    setFilteredMrvData(filtered);

    // Calculate quality metrics from filtered data
    if (filtered.length > 0) {
      const avgMetrics = filtered.reduce((acc, mrv) => {
        acc.dataCompleteness += mrv.mlResults.data_completeness || 0;
        acc.temporalConsistency += mrv.mlResults.temporal_consistency || 0;
        acc.spatialAccuracy += mrv.mlResults.spatial_accuracy || 0;
        acc.satelliteConfidence += mrv.mlResults.confidence_score || 0;
        return acc;
      }, {
        dataCompleteness: 0,
        temporalConsistency: 0,
        spatialAccuracy: 0,
        communityEngagement: 85, // Mock data
        satelliteConfidence: 0
      });

      setQualityMetrics({
        dataCompleteness: avgMetrics.dataCompleteness / filtered.length,
        temporalConsistency: avgMetrics.temporalConsistency / filtered.length,
        spatialAccuracy: avgMetrics.spatialAccuracy / filtered.length,
        communityEngagement: avgMetrics.communityEngagement,
        satelliteConfidence: avgMetrics.satelliteConfidence / filtered.length
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const radarData = [
    { subject: 'Data Completeness', A: qualityMetrics.dataCompleteness, fullMark: 100 },
    { subject: 'Temporal Consistency', A: qualityMetrics.temporalConsistency, fullMark: 100 },
    { subject: 'Spatial Accuracy', A: qualityMetrics.spatialAccuracy, fullMark: 100 },
    { subject: 'Community Engagement', A: qualityMetrics.communityEngagement, fullMark: 100 },
    { subject: 'Satellite Confidence', A: qualityMetrics.satelliteConfidence, fullMark: 100 },
  ];

  const submissionStatusData = filteredMrvData.reduce((acc, mrv) => {
    const status = mrv.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(submissionStatusData).map(([status, count]) => ({
    name: status,
    value: count,
    count,
    fill: `var(--color-${status})`
  }));
  
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Project Selection */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span>MRV Data Analytics</span>
          </h2>
          <p className="text-muted-foreground">Advanced monitoring, reporting, and verification insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select
            value={currentProject?.id || ''}
            onValueChange={(value: string) => {
              const project = projects.find(p => p.id === value);
              if (project) {
                setCurrentProject(project);
                if (onProjectSelect) onProjectSelect(project);
              }
            }}
          >
            <SelectTrigger className="w-64 truncate">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name} ({project.location})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentProject && (
        <>
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TreePine className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span>{currentProject.name}</span>
                <Badge className={getStatusColor(currentProject.status)}>
                  {currentProject.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{currentProject.location}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Waves className="h-4 w-4" />
                  <span>{currentProject.ecosystemType}</span>
                </span>
                <span>{currentProject.area.toLocaleString()} hectares</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {filteredMrvData.length}
                  </div>
                  <p className="text-sm text-muted-foreground">MRV Submissions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {filteredMrvData.filter(mrv => mrv.status === 'approved').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Approved Reports</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {filteredMrvData.reduce((sum, mrv) => sum + (mrv.mlResults?.carbon_estimate || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total tCO₂e</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {filteredMrvData.length > 0 ?
                      (filteredMrvData.reduce((sum, mrv) => sum + (mrv.mlResults?.biomass_health_score || 0), 0) / filteredMrvData.length * 100).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Quality Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Visualization Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Carbon Estimates Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span>Carbon Sequestration Over Time</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <ChartContainer config={chartConfig} className="h-64">
                        <AreaChart data={filteredMrvData.map(mrv => ({
                          date: formatDate(mrv.submittedAt),
                          carbon: mrv.mlResults?.carbon_estimate || 0,
                        }))}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                          <ChartTooltipContainer cursor={false} content={<ChartTooltipContent />} />
                          <Area type="monotone" dataKey="carbon" stroke="var(--color-carbon)" fill="var(--color-carbon)" fillOpacity={0.3} />
                        </AreaChart>
                      </ChartContainer>
                  </CardContent>
                </Card>

                {/* Submission Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <span>Submission Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={pieChartConfig} className="h-64">
                        <PieChart>
                          <ChartTooltipContainer content={<ChartTooltipContent nameKey="name" />} />
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            labelLine={false}
                            label={({ name, count }) => `${pieChartConfig[name as keyof typeof pieChartConfig]?.label}: ${count}`}
                          >
                            {pieData.map((entry) => (
                              <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* ML Confidence vs Health Score Scatter */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <span>ML Confidence vs Data Quality</span>
                  </CardTitle>
                  <CardDescription>
                    Relationship between ML model confidence and biomass health scores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64">
                    <ScatterChart data={filteredMrvData.map(mrv => ({
                        confidence: (mrv.mlResults?.confidence_score || 0) * 100,
                        health: (mrv.mlResults?.biomass_health_score || 0) * 100,
                      }))}>
                        <CartesianGrid />
                        <XAxis type="number" dataKey="confidence" name="ML Confidence" unit="%" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis type="number" dataKey="health" name="Health Score" unit="%" tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltipContainer cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Scatter name="MRV Reports" dataKey="health" fill="var(--color-health)" />
                      </ScatterChart>
                    </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quality Radar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span>Data Quality Assessment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-64">
                      <RadarChart data={radarData}>
                          <CartesianGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <ChartTooltipContainer content={<ChartTooltipContent />} />
                          <Radar
                            name="Quality Score"
                            dataKey="A"
                            stroke="var(--color-carbon)"
                            fill="var(--color-carbon)"
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ChartContainer>
                  </CardContent>
                </Card>

                {/* Quality Metrics Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Metrics Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Data Completeness</span>
                        <span>{qualityMetrics.dataCompleteness.toFixed(1)}%</span>
                      </div>
                      <Progress value={qualityMetrics.dataCompleteness} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Temporal Consistency</span>
                        <span>{qualityMetrics.temporalConsistency.toFixed(1)}%</span>
                      </div>
                      <Progress value={qualityMetrics.temporalConsistency} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Spatial Accuracy</span>
                        <span>{qualityMetrics.spatialAccuracy.toFixed(1)}%</span>
                      </div>
                      <Progress value={qualityMetrics.spatialAccuracy} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Community Engagement</span>
                        <span>{qualityMetrics.communityEngagement.toFixed(1)}%</span>
                      </div>
                      <Progress value={qualityMetrics.communityEngagement} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Satellite Confidence</span>
                        <span>{qualityMetrics.satelliteConfidence.toFixed(1)}%</span>
                      </div>
                      <Progress value={qualityMetrics.satelliteConfidence} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <span>Platform Trends</span>
                  </CardTitle>
                  <CardDescription>
                    Historical trends in carbon estimates and approval rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64">
                    <ComposedChart data={trendData}>
                        <CartesianGrid vertical={false}/>
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltipContainer content={<ChartTooltipContent />} />
                        <Bar yAxisId="left" dataKey="submissions" fill="var(--color-submissions)" />
                        <Line yAxisId="right" type="monotone" dataKey="carbon_estimate" stroke="var(--color-carbon)" />
                        <Line yAxisId="right" type="monotone" dataKey="health_score" stroke="var(--color-health)" />
                      </ComposedChart>
                    </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span>Project Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projectTimeline.map((event, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          {getStatusIcon(event.status)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{event.event}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                        </div>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMrvData.map((mrv) => (
                  <Card key={mrv.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => { setSelectedMRV(mrv); setShowMRVDetail(true); }}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">MRV Report</CardTitle>
                        <Badge className={getStatusColor(mrv.status)}>
                          {mrv.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Submitted: {formatDate(mrv.submittedAt)}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {mrv.mlResults?.carbon_estimate || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">tCO₂e</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Health Score</span>
                          <span className="font-medium">
                            {((mrv.mlResults?.biomass_health_score || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={(mrv.mlResults?.biomass_health_score || 0) * 100} className="h-2" />
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span className="font-medium">
                          {((mrv.mlResults?.confidence_score || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* MRV Detail Dialog */}
          <Dialog open={showMRVDetail} onOpenChange={setShowMRVDetail}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>MRV Report Details</DialogTitle>
                <DialogDescription>
                  Comprehensive analysis of monitoring, reporting, and verification data
                </DialogDescription>
              </DialogHeader>

              {selectedMRV && (
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-6 pr-4">
                    {/* ML Results Visualization */}
                    <div>
                      <h3 className="font-semibold mb-3">ML Analysis Results</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {selectedMRV.mlResults?.carbon_estimate || 0}
                          </div>
                          <p className="text-sm text-blue-700 dark:text-blue-500">tCO₂e</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {((selectedMRV.mlResults?.biomass_health_score || 0) * 100).toFixed(1)}%
                          </div>
                          <p className="text-sm text-green-700 dark:text-green-500">Health Score</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {((selectedMRV.mlResults?.confidence_score || 0) * 100).toFixed(1)}%
                          </div>
                          <p className="text-sm text-purple-700 dark:text-purple-500">Confidence</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {((selectedMRV.mlResults?.data_completeness || 0) * 100).toFixed(1)}%
                          </div>
                          <p className="text-sm text-orange-700 dark:text-orange-500">Completeness</p>
                        </div>
                      </div>
                    </div>

                    {/* Data Sources Summary */}
                    <div>
                      <h3 className="font-semibold mb-3">Data Sources</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Satellite className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">Satellite Data</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedMRV.rawData.satelliteData ? 'Available' : 'No data'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Users className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">Community Reports</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedMRV.rawData.communityReports ? 'Available' : 'No data'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Database className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">Sensor Readings</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedMRV.rawData.sensorReadings ? 'Available' : 'No data'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Supporting Files */}
                    <div>
                      <h3 className="font-semibold mb-3">Supporting Files ({selectedMRV.files.length})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedMRV.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}