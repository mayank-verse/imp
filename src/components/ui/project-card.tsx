import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Project } from '../../utils/database/models';
import { MapPin, Calendar, User } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'mrv_submitted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <CardDescription className="mt-1">{project.description}</CardDescription>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{project.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>{project.ecosystemType}</span>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Area:</span>
            <span>{project.area} hectares</span>
          </div>
          {project.expectedCarbonCapture && (
            <div className="flex justify-between mt-1">
              <span>Expected Capture:</span>
              <span>{project.expectedCarbonCapture} tCO₂e</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Created {formatDate(project.createdAt)}</span>
          </div>
          {project.onChainTxHash && (
            <Badge variant="outline" className="text-xs">
              On-chain
            </Badge>
          )}
        </div>

        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
