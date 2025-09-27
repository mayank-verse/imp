// src/components/MANAGER/ProjectManagerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { supabase } from '../../utils/supabase/client';
import { ApiService, showApiError, showApiSuccess } from '../../utils/frontend/api-service';
import { Plus, TreePine, Upload, FileText, MapPin, Calendar, Activity, Camera, Database, FileImage, Trash2, DollarSign, TrendingUp, Receipt, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { mockPaymentService, ProjectManagerEarnings, PaymentTransaction } from '../../utils/payments/mock-payment-service';

interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: string;
  };
}

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  ecosystemType: string;
  area: number;
  status: string;
  createdAt: string;
  managerId: string;
  onChainTxHash?: string;
}

interface ProjectManagerDashboardProps {
  user: User;
}

export function ProjectManagerDashboard({ user }: ProjectManagerDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showMRVDialog, setShowMRVDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [earnings, setEarnings] = useState<ProjectManagerEarnings | null>(null);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [showEarningsDetails, setShowEarningsDetails] = useState(false);

  const [newProject, setNewProject] = useState<{
    name: string;
    description: string;
    location: string;
    ecosystemType: "mangrove" | "saltmarsh" | "seagrass" | "coastal_wetland";
    area: number;
    coordinates: string;
    communityPartners: string;
    expectedCarbonCapture: number;
  }>({
    name: '',
    description: '',
    location: '',
    ecosystemType: 'mangrove',
    area: 0,
    coordinates: '',
    communityPartners: '',
    expectedCarbonCapture: 0
  });

  const [mrvData, setMrvData] = useState({
    projectId: '',
    satelliteData: '',
    communityReports: '',
    sensorReadings: '',
    iotData: '',
    photos: [] as File[],
    iotFiles: [] as File[],
    documents: [] as File[],
    notes: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchEarnings();
    fetchPaymentTransactions();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await ApiService.getManagerProjects();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error(showApiError(error, 'Failed to load projects'));
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const earningsData = await mockPaymentService.getProjectManagerEarnings(user.id);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const fetchPaymentTransactions = async () => {
    try {
      const transactions = await mockPaymentService.getProjectManagerTransactions(user.id);
      setPaymentTransactions(transactions);
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await ApiService.deleteProject(projectId);
      toast.success(showApiSuccess(`Project "${projectName}" deleted successfully`));
      fetchProjects(); // Refresh the projects list
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(showApiError(error, 'Failed to delete project'));
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await ApiService.createProject(newProject);
      toast.success(showApiSuccess('Project registered successfully!'));
      setShowNewProjectDialog(false);
      setNewProject({
        name: '',
        description: '',
        location: '',
        ecosystemType: 'mangrove',
        area: 0,
        coordinates: '',
        communityPartners: '',
        expectedCarbonCapture: 0
      });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(showApiError(error, 'Failed to create project'));
    }
  };

  const handleSubmitMRV = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let uploadedFiles: { name: string; url: string; category: string }[] = [];

      // Upload files first if any are selected
      const allFiles = [...mrvData.photos, ...mrvData.iotFiles, ...mrvData.documents];
      if (allFiles.length > 0) {
        toast.info(`Uploading ${allFiles.length} files...`);

        const uploadResult = await ApiService.uploadMRVFiles(mrvData.projectId, allFiles);
        uploadedFiles = uploadResult.files.map(f => ({
          name: f.name,
          url: f.url ?? '',
          category: f.category
        }));

        // Show breakdown of uploaded files
        const photoCount = uploadedFiles.filter(f => f.category === 'photo').length;
        const iotCount = uploadedFiles.filter(f => f.category === 'iot_data').length;
        const docCount = uploadedFiles.filter(f => f.category === 'document').length;

        let message = `Successfully uploaded ${uploadedFiles.length} files`;
        if (photoCount > 0) message += ` (${photoCount} photos`;
        if (iotCount > 0) message += `${photoCount > 0 ? ', ' : ' ('}${iotCount} IoT files`;
        if (docCount > 0) message += `${(photoCount > 0 || iotCount > 0) ? ', ' : ' ('}${docCount} documents`;
        if (photoCount > 0 || iotCount > 0 || docCount > 0) message += ')';

        toast.success(message);
      }

      toast.info('Preparing MRV data submission for blockchain verification...');

      // Submit MRV data with file references
      const mrvPayload = {
        projectId: mrvData.projectId,
        rawData: {
          satelliteData: mrvData.satelliteData,
          communityReports: mrvData.communityReports,
          sensorReadings: mrvData.sensorReadings,
          iotData: mrvData.iotData,
          notes: mrvData.notes
        },
        files: uploadedFiles.map(f => ({
          name: f.name,
          url: f.url,
          category: f.category as "photo" | "iot_data" | "document",
          originalName: f.name,
          size: 0, // If you have the size, set it here
          type: '', // If you have the type, set it here
          path: f.url, // Or set the correct path if available
          uploadedAt: new Date().toISOString()
        }))
      };

      await ApiService.submitMRVData(mrvPayload);
      toast.success(showApiSuccess('MRV data submitted successfully! Processing with ML model and blockchain verification...'));

      setShowMRVDialog(false);
      setMrvData({
        projectId: '',
        satelliteData: '',
        communityReports: '',
        sensorReadings: '',
        iotData: '',
        photos: [],
        iotFiles: [],
        documents: [],
        notes: ''
      });
      fetchProjects();
    } catch (error) {
      console.error('Error submitting MRV data:', error);
      toast.error(showApiError(error, 'Failed to submit MRV data'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'mrv_submitted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'heic':
        return <FileImage className="h-3 w-3 text-blue-500 dark:text-blue-400" />;
      case 'csv':
      case 'json':
      case 'xml':
      case 'txt':
      case 'log':
        return <Database className="h-3 w-3 text-green-500 dark:text-green-400" />;
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'xlsx':
      case 'xls':
        return <FileText className="h-3 w-3 text-purple-500 dark:text-purple-400" />;
      default:
        return <FileText className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Project Management</h2>
          <p className="text-muted-foreground">Register and manage your blue carbon projects with fiat-anchored registry</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowEarningsDetails(!showEarningsDetails)}>
            <Receipt className="h-4 w-4 mr-2" />
            Earnings
          </Button>
          <Button onClick={() => setShowNewProjectDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Earnings Dashboard */}
      {showEarningsDetails && earnings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span>Payment Dashboard</span>
            </CardTitle>
            <CardDescription>
              Track your earnings from carbon credit sales and payments received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${earnings.totalEarnings.toFixed(2)}
                </div>
                <p className="text-sm text-green-700 dark:text-green-500">Total Earnings</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {earnings.totalCredits.toLocaleString()}
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-500">Credits Sold</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {earnings.transactionCount}
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-500">Transactions</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  ${earnings.pendingPayments.toFixed(2)}
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-500">Pending</p>
              </div>
            </div>

            {/* Project Breakdown */}
            {Object.keys(earnings.projects).length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Earnings by Project</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(earnings.projects).map(([projectId, projectEarnings]) => (
                    <div key={projectId} className="border rounded-lg p-3 bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">Project {projectId.slice(-8)}</h5>
                          <p className="text-sm text-muted-foreground">{projectEarnings.credits} tCO₂e sold</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600 dark:text-green-400">${projectEarnings.earnings.toFixed(2)}</div>
                          <p className="text-xs text-muted-foreground">{projectEarnings.transactions} transactions</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {paymentTransactions.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Recent Payments</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {paymentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-3 bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h5 className="font-medium">${transaction.netAmount.toFixed(2)}</h5>
                            <Badge className={transaction.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                              transaction.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}>
                              {transaction.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{transaction.amount} tCO₂e • {transaction.buyerName}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(transaction.processedAt)}</p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>Gross: ${transaction.totalAmount.toFixed(2)}</div>
                          <div>Fees: ${transaction.fees.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {paymentTransactions.length > 5 && (
                  <div className="text-center mt-3">
                    <Button variant="link" size="sm">
                      View all {paymentTransactions.length} transactions
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <TreePine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${earnings?.totalEarnings.toFixed(0) || '0'}
            </div>
            <p className="text-xs text-green-700 dark:text-green-500 mt-1">
              From {earnings?.totalCredits || 0} credits sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Area</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((sum, p) => sum + p.area, 0).toLocaleString()} ha
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Blockchain</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.onChainTxHash).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
          <CardDescription>
            Manage your registered blue carbon projects and submit MRV data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TreePine className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects registered yet</p>
              <p className="text-sm mt-2">Create your first blue carbon project to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground mb-3">{project.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{project.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TreePine className="h-4 w-4 text-muted-foreground" />
                          <span>{project.ecosystemType}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(project.createdAt)}</span>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-muted-foreground">
                        <strong>Area:</strong> {project.area.toLocaleString()} hectares
                        {project.onChainTxHash && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                              On Avalanche Blockchain
                            </span>
                            <code className="text-xs font-mono">
                              {project.onChainTxHash.slice(0, 10)}...
                            </code>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {project.status === 'registered' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project);
                              setMrvData(prev => ({ ...prev, projectId: project.id }));
                              setShowMRVDialog(true);
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Submit MRV
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id, project.name)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register New Blue Carbon Project</DialogTitle>
            <DialogDescription>
              Provide details about your coastal ecosystem restoration project
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Sundarbans, West Bengal"
                  value={newProject.location}
                  onChange={(e) => setNewProject(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your project objectives and methods"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ecosystem">Ecosystem Type</Label>
                <Select value={newProject.ecosystemType} onValueChange={(value: string) => setNewProject(prev => ({ ...prev, ecosystemType: value as "mangrove" | "saltmarsh" | "seagrass" | "coastal_wetland" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mangrove">Mangrove Forest</SelectItem>
                    <SelectItem value="saltmarsh">Salt Marsh</SelectItem>
                    <SelectItem value="seagrass">Seagrass Bed</SelectItem>
                    <SelectItem value="coastal_wetland">Coastal Wetland</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area (hectares)</Label>
                <Input
                  id="area"
                  type="number"
                  value={newProject.area}
                  onChange={(e) => setNewProject(prev => ({ ...prev, area: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coordinates">GPS Coordinates</Label>
                <Input
                  id="coordinates"
                  placeholder="e.g., 22.3511, 88.2650"
                  value={newProject.coordinates}
                  onChange={(e) => setNewProject(prev => ({ ...prev, coordinates: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedCarbon">Expected Carbon Capture (tCO₂e/year)</Label>
                <Input
                  id="expectedCarbon"
                  type="number"
                  value={newProject.expectedCarbonCapture}
                  onChange={(e) => setNewProject(prev => ({ ...prev, expectedCarbonCapture: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partners">Community Partners</Label>
              <Input
                id="partners"
                placeholder="Local communities and organizations involved"
                value={newProject.communityPartners}
                onChange={(e) => setNewProject(prev => ({ ...prev, communityPartners: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Register Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MRV Submission Dialog */}
      <Dialog open={showMRVDialog} onOpenChange={setShowMRVDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Submit MRV Data</DialogTitle>
            <DialogDescription>
              Upload monitoring, reporting, and verification data for {selectedProject?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitMRV} className="flex flex-col h-full">
            <ScrollArea className="flex-1 px-1">
              <div className="space-y-4 pr-4">
                <div className="space-y-2">
                  <Label htmlFor="satellite">Satellite Data Analysis</Label>
                  <Textarea
                    id="satellite"
                    placeholder="NDVI values, biomass estimates, canopy cover changes..."
                    value={mrvData.satelliteData}
                    onChange={(e) => setMrvData(prev => ({ ...prev, satelliteData: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="community">Community Reports</Label>
                  <Textarea
                    id="community"
                    placeholder="Field observations, species counts, restoration activities..."
                    value={mrvData.communityReports}
                    onChange={(e) => setMrvData(prev => ({ ...prev, communityReports: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sensors">Sensor Readings</Label>
                  <Textarea
                    id="sensors"
                    placeholder="Water quality, soil carbon, temperature, salinity data..."
                    value={mrvData.sensorReadings}
                    onChange={(e) => setMrvData(prev => ({ ...prev, sensorReadings: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iot">IoT Device Data & Analysis</Label>
                  <Textarea
                    id="iot"
                    placeholder="Smart sensor networks, automated monitoring data, device logs, connectivity reports..."
                    value={mrvData.iotData}
                    onChange={(e) => setMrvData(prev => ({ ...prev, iotData: e.target.value }))}
                  />
                </div>

                <Separator className="my-6" />

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">File Uploads</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload supporting files organized by category for better verification
                    </p>
                  </div>

                  {/* Photos Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="photos" className="flex items-center space-x-2">
                      <Camera className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      <span>Project Photos</span>
                    </Label>
                    <Input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setMrvData(prev => ({ ...prev, photos: Array.from(e.target.files || []) }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Site photos, before/after images, ecosystem monitoring photos (JPG, PNG, HEIC)
                    </p>
                    {mrvData.photos.length > 0 && (
                      <div className="border rounded-lg p-3 bg-blue-100 dark:bg-blue-900/30">
                        <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center space-x-1">
                          <Camera className="h-4 w-4" />
                          <span>{mrvData.photos.length} photos selected</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {mrvData.photos.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-background rounded p-2">
                              <div className="flex items-center space-x-1 truncate">
                                {getFileIcon(file.name)}
                                <span className="truncate">{file.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {(file.size / 1024 / 1024).toFixed(1)}MB
                                </Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  const newFiles = mrvData.photos.filter((_, i) => i !== index);
                                  setMrvData(prev => ({ ...prev, photos: newFiles }));
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* IoT Files Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="iotFiles" className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-green-500 dark:text-green-400" />
                      <span>IoT Device Data Files</span>
                    </Label>
                    <Input
                      id="iotFiles"
                      type="file"
                      multiple
                      accept=".csv,.json,.xml,.txt,.log"
                      onChange={(e) => setMrvData(prev => ({ ...prev, iotFiles: Array.from(e.target.files || []) }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Sensor data files, device logs, network monitoring files (CSV, JSON, XML, TXT, LOG)
                    </p>
                    {mrvData.iotFiles.length > 0 && (
                      <div className="border rounded-lg p-3 bg-green-100 dark:bg-green-900/30">
                        <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-2 flex items-center space-x-1">
                          <Database className="h-4 w-4" />
                          <span>{mrvData.iotFiles.length} IoT files selected</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {mrvData.iotFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-background rounded p-2">
                              <div className="flex items-center space-x-1 truncate">
                                {getFileIcon(file.name)}
                                <span className="truncate">{file.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {(file.size / 1024 / 1024).toFixed(1)}MB
                                </Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  const newFiles = mrvData.iotFiles.filter((_, i) => i !== index);
                                  setMrvData(prev => ({ ...prev, iotFiles: newFiles }));
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Documents Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="documents" className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                      <span>Supporting Documents</span>
                    </Label>
                    <Input
                      id="documents"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xlsx,.xls"
                      onChange={(e) => setMrvData(prev => ({ ...prev, documents: Array.from(e.target.files || []) }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Reports, permits, research papers, compliance documents (PDF, DOC, DOCX, XLS, XLSX)
                    </p>
                    {mrvData.documents.length > 0 && (
                      <div className="border rounded-lg p-3 bg-purple-100 dark:bg-purple-900/30">
                        <div className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2 flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>{mrvData.documents.length} documents selected</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {mrvData.documents.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-background rounded p-2">
                              <div className="flex items-center space-x-1 truncate">
                                {getFileIcon(file.name)}
                                <span className="truncate">{file.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {(file.size / 1024 / 1024).toFixed(1)}MB
                                </Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  const newFiles = mrvData.documents.filter((_, i) => i !== index);
                                  setMrvData(prev => ({ ...prev, documents: newFiles }));
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional context, methodological notes, or observations..."
                    value={mrvData.notes}
                    onChange={(e) => setMrvData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowMRVDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Upload className="h-4 w-4 mr-2" />
                Submit MRV Data
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}