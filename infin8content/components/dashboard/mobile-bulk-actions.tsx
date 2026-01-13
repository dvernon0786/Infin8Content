/**
 * Mobile-optimized bulk actions component
 * Story 23.1: Multi-article Management Interface
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Trash2, 
  Download, 
  Archive, 
  Tag, 
  Users, 
  MoreHorizontal,
  X,
  CheckCircle
} from 'lucide-react';
import { useBulkOperationProgress } from '@/hooks/use-bulk-selection';
import { bulkOperationsService } from '@/lib/services/bulk-operations';
import type { TeamMember } from '@/lib/services/bulk-operations';
import type { DashboardArticle } from '@/lib/types/dashboard.types';

export interface MobileBulkActionsProps {
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

export function MobileBulkActions({
  selectedArticles,
  onClearSelection,
  onDelete,
  onExport,
  onArchive,
  onChangeStatus,
  onAssignToTeam,
  teamMembers = [],
  className = '',
}: MobileBulkActionsProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const bulkProgress = useBulkOperationProgress();

  const selectedCount = selectedArticles.length;
  const hasSelection = selectedCount > 0;

  // Handle bulk operations
  const handleBulkDelete = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      bulkProgress.startOperation(selectedCount);
      const articleIds = selectedArticles.map(a => a.id);
      
      const result = await bulkOperationsService.deleteArticles(articleIds);
      
      if (result.success) {
        bulkProgress.completeOperation();
        onClearSelection();
        setIsSheetOpen(false);
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
    } finally {
      setIsProcessing(false);
    }
  }, [selectedArticles, selectedCount, bulkProgress, onClearSelection, onDelete]);

  const handleBulkExport = useCallback(async (format: 'csv' | 'pdf') => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      bulkProgress.startOperation(selectedCount);
      const articleIds = selectedArticles.map(a => a.id);
      
      const result = await bulkOperationsService.exportArticles(articleIds, format);
      
      if (result.success) {
        bulkProgress.completeOperation();
        onClearSelection();
        setIsSheetOpen(false);
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
    } finally {
      setIsProcessing(false);
    }
  }, [selectedArticles, selectedCount, bulkProgress, onClearSelection, onExport]);

  const handleBulkArchive = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      bulkProgress.startOperation(selectedCount);
      const articleIds = selectedArticles.map(a => a.id);
      
      const result = await bulkOperationsService.archiveArticles(articleIds);
      
      if (result.success) {
        bulkProgress.completeOperation();
        onClearSelection();
        setIsSheetOpen(false);
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
    } finally {
      setIsProcessing(false);
    }
  }, [selectedArticles, selectedCount, bulkProgress, onClearSelection, onArchive]);

  const handleBulkStatusChange = useCallback(async () => {
    if (!selectedStatus || isProcessing) return;
    
    setIsProcessing(true);
    try {
      bulkProgress.startOperation(selectedCount);
      const articleIds = selectedArticles.map(a => a.id);
      
      const result = await bulkOperationsService.changeStatus(articleIds, selectedStatus);
      
      if (result.success) {
        bulkProgress.completeOperation();
        onClearSelection();
        setIsSheetOpen(false);
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
    } finally {
      setIsProcessing(false);
    }
  }, [selectedArticles, selectedCount, selectedStatus, bulkProgress, onClearSelection, onChangeStatus]);

  const handleBulkAssign = useCallback(async () => {
    if (!selectedTeamMember || isProcessing) return;
    
    setIsProcessing(true);
    try {
      bulkProgress.startOperation(selectedCount);
      const articleIds = selectedArticles.map(a => a.id);
      
      const result = await bulkOperationsService.assignArticles(articleIds, selectedTeamMember);
      
      if (result.success) {
        bulkProgress.completeOperation();
        onClearSelection();
        setIsSheetOpen(false);
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
    } finally {
      setIsProcessing(false);
    }
  }, [selectedArticles, selectedCount, selectedTeamMember, bulkProgress, onClearSelection, onAssignToTeam]);

  if (!hasSelection) {
    return null;
  }

  return (
    <>
      {/* Mobile Bulk Actions Bar */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 md:hidden ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {selectedCount} selected
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="default"
                size="sm"
                disabled={bulkProgress.isRunning || isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Actions
                <MoreHorizontal className="h-4 w-4 ml-2" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>Bulk Actions ({selectedCount} articles)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Progress Indicator */}
                {bulkProgress.isRunning && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Processing... {bulkProgress.completed}/{bulkProgress.total}
                      </span>
                      <span className="text-gray-500">
                        {Math.round(bulkProgress.progress)}%
                      </span>
                    </div>
                    <Progress value={bulkProgress.progress} className="h-2" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleBulkDelete}
                    disabled={bulkProgress.isRunning || isProcessing}
                    className="flex flex-col items-center gap-2 h-auto py-4 text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-6 w-6" />
                    <span className="text-sm">Delete</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleBulkExport('csv')}
                    disabled={bulkProgress.isRunning || isProcessing}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <Download className="h-6 w-6" />
                    <span className="text-sm">Export CSV</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleBulkExport('pdf')}
                    disabled={bulkProgress.isRunning || isProcessing}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <Download className="h-6 w-6" />
                    <span className="text-sm">Export PDF</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleBulkArchive}
                    disabled={bulkProgress.isRunning || isProcessing}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <Archive className="h-6 w-6" />
                    <span className="text-sm">Archive</span>
                  </Button>
                </div>

                {/* Status Change */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Change Status</h3>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    disabled={bulkProgress.isRunning || isProcessing}
                  >
                    <option value="">Select status...</option>
                    <option value="draft">Draft</option>
                    <option value="in-review">In Review</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <Button
                    variant="outline"
                    onClick={handleBulkStatusChange}
                    disabled={!selectedStatus || bulkProgress.isRunning || isProcessing}
                    className="w-full"
                  >
                    Change Status
                  </Button>
                </div>

                {/* Team Assignment */}
                {teamMembers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900">Assign to Team</h3>
                    <select
                      value={selectedTeamMember}
                      onChange={(e) => setSelectedTeamMember(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      disabled={bulkProgress.isRunning || isProcessing}
                    >
                      <option value="">Select team member...</option>
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      onClick={handleBulkAssign}
                      disabled={!selectedTeamMember || bulkProgress.isRunning || isProcessing}
                      className="w-full"
                    >
                      Assign Articles
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
