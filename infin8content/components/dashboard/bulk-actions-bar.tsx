/**
 * Bulk actions bar for multi-article management
 * Story 23.1: Multi-article Management Interface
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { 
  Trash2, 
  Download, 
  Archive, 
  Tag, 
  Users, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { useBulkOperationProgress } from '../../hooks/use-bulk-selection';
import { bulkOperationsService } from '../../lib/services/bulk-operations';
import type { TeamMember } from '../../lib/services/bulk-operations';
import type { DashboardArticle } from '../../lib/types/dashboard.types';

export interface BulkActionsBarProps {
  selectedArticles: DashboardArticle[];
  onClearSelection: () => void;
  onDelete?: (articleIds: string[]) => Promise<void>;
  onExport?: (articleIds: string[], format: 'csv' | 'pdf') => Promise<void>;
  onArchive?: (articleIds: string[]) => Promise<void>;
  onChangeStatus?: (articleIds: string[], status: string) => Promise<void>;
  onAssignToTeam?: (articleIds: string[], teamMemberId: string) => Promise<void>;
  teamMembers?: TeamMember[];
  className?: string;
}

export function BulkActionsBar({
  selectedArticles,
  onClearSelection,
  onDelete,
  onExport,
  onArchive,
  onChangeStatus,
  onAssignToTeam,
  teamMembers = [],
  className = '',
}: BulkActionsBarProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  
  const bulkProgress = useBulkOperationProgress();

  const selectedCount = selectedArticles.length;
  const hasSelection = selectedCount > 0;

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    try {
      bulkProgress.startOperation(selectedCount);
      const articleIds = selectedArticles.map(a => a.id);
      
      const result = await bulkOperationsService.deleteArticles(articleIds);
      
      if (result.success) {
        bulkProgress.completeOperation();
        onClearSelection();
        setIsDeleteDialogOpen(false);
        if (onDelete) {
          await onDelete(articleIds);
        }
      } else {
        bulkProgress.resetProgress();
        console.error('Bulk delete failed:', result.message);
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
      bulkProgress.resetProgress();
    }
  }, [selectedArticles, selectedCount, bulkProgress, onClearSelection, onDelete]);

  // Handle bulk export
  const handleBulkExport = useCallback(async (format: 'csv' | 'pdf') => {
    try {
      bulkProgress.startOperation(selectedCount);
      const articleIds = selectedArticles.map(a => a.id);
      
      const result = await bulkOperationsService.exportArticles(articleIds, format);
      
      if (result.success) {
        bulkProgress.completeOperation();
        onClearSelection();
        if (onExport) {
          await onExport(articleIds, format);
        }
      } else {
        bulkProgress.resetProgress();
        console.error('Bulk export failed:', result.message);
      }
    } catch (error) {
      console.error('Bulk export failed:', error);
      bulkProgress.resetProgress();
    }
  }, [selectedArticles, selectedCount, bulkProgress, onClearSelection, onExport]);

  // Handle bulk archive
  const handleBulkArchive = useCallback(async () => {
    try {
      bulkProgress.startOperation(selectedCount);
      const articleIds = selectedArticles.map(a => a.id);
      
      const result = await bulkOperationsService.archiveArticles(articleIds);
      
      if (result.success) {
        bulkProgress.completeOperation();
        onClearSelection();
        if (onArchive) {
          await onArchive(articleIds);
        }
      } else {
        bulkProgress.resetProgress();
        console.error('Bulk archive failed:', result.message);
      }
    } catch (error) {
      console.error('Bulk archive failed:', error);
      bulkProgress.resetProgress();
    }
  }, [selectedArticles, selectedCount, bulkProgress, onClearSelection, onArchive]);

  // Handle bulk status change
  const handleBulkStatusChange = useCallback(async () => {
    if (!selectedStatus) return;
    
    try {
      bulkProgress.startOperation(selectedCount);
      const articleIds = selectedArticles.map(a => a.id);
      
      const result = await bulkOperationsService.changeStatus(articleIds, selectedStatus);
      
      if (result.success) {
        bulkProgress.completeOperation();
        onClearSelection();
        setIsStatusDialogOpen(false);
        setSelectedStatus('');
        if (onChangeStatus) {
          await onChangeStatus(articleIds, selectedStatus);
        }
      } else {
        bulkProgress.resetProgress();
        console.error('Bulk status change failed:', result.message);
      }
    } catch (error) {
      console.error('Bulk status change failed:', error);
      bulkProgress.resetProgress();
    }
  }, [selectedArticles, selectedCount, selectedStatus, bulkProgress, onClearSelection, onChangeStatus]);

  // Handle bulk team assignment
  const handleBulkAssign = useCallback(async () => {
    if (!selectedTeamMember) return;
    
    try {
      bulkProgress.startOperation(selectedCount);
      const articleIds = selectedArticles.map(a => a.id);
      
      const result = await bulkOperationsService.assignArticles(articleIds, selectedTeamMember);
      
      if (result.success) {
        bulkProgress.completeOperation();
        onClearSelection();
        setIsAssignDialogOpen(false);
        setSelectedTeamMember('');
        if (onAssignToTeam) {
          await onAssignToTeam(articleIds, selectedTeamMember);
        }
      } else {
        bulkProgress.resetProgress();
        console.error('Bulk assignment failed:', result.message);
      }
    } catch (error) {
      console.error('Bulk assignment failed:', error);
      bulkProgress.resetProgress();
    }
  }, [selectedArticles, selectedCount, selectedTeamMember, bulkProgress, onClearSelection, onAssignToTeam]);

  if (!hasSelection) {
    return null;
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {selectedCount} article{selectedCount !== 1 ? 's' : ''} selected
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={bulkProgress.isRunning}
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkProgress.isRunning}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkExport('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkExport('pdf')}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkArchive}
              disabled={bulkProgress.isRunning}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkProgress.isRunning}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsStatusDialogOpen(true)}>
                  <Tag className="h-4 w-4 mr-2" />
                  Change Status
                </DropdownMenuItem>
                
                {teamMembers.length > 0 && (
                  <DropdownMenuItem onClick={() => setIsAssignDialogOpen(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Assign to Team
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress Indicator */}
        {bulkProgress.isRunning && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Processing... {bulkProgress.completed}/{bulkProgress.total}
              </span>
              <span className="text-gray-500">
                {Math.round(bulkProgress.progress)}%
              </span>
            </div>
            <Progress value={bulkProgress.progress} className="h-2" />
            
            {bulkProgress.failed > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{bulkProgress.failed} failed</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Articles</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} article{selectedCount !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedCount} article{selectedCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Article Status</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new status for {selectedCount} article{selectedCount !== 1 ? 's' : ''}:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select status...</option>
              <option value="draft">Draft</option>
              <option value="in-review">In Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatusChange}
              disabled={!selectedStatus}
            >
              Change Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Team Assignment Dialog */}
      <AlertDialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign to Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Select a team member to assign {selectedCount} article{selectedCount !== 1 ? 's' : ''}:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <select
              value={selectedTeamMember}
              onChange={(e) => setSelectedTeamMember(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select team member...</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAssign}
              disabled={!selectedTeamMember}
            >
              Assign Articles
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}