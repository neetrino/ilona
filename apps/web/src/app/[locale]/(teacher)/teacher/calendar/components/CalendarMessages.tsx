interface CalendarMessagesProps {
  bulkDeleteSuccess: boolean;
  bulkDeleteError: string | null;
  deletedCount: number;
  completeSuccess: boolean;
  isBulkDeleteDialogOpen: boolean;
}

export function CalendarMessages({
  bulkDeleteSuccess,
  bulkDeleteError,
  deletedCount,
  completeSuccess,
  isBulkDeleteDialogOpen,
}: CalendarMessagesProps) {
  return (
    <>
      {/* Success/Error Messages */}
      {bulkDeleteSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">
            {deletedCount > 0 
              ? `Deleted ${deletedCount} ${deletedCount === 1 ? 'lesson' : 'lessons'} successfully!`
              : 'Lessons deleted successfully!'}
          </p>
        </div>
      )}
      {bulkDeleteError && !isBulkDeleteDialogOpen && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600 font-medium">{bulkDeleteError}</p>
        </div>
      )}
      {completeSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">Lesson marked as completed successfully!</p>
        </div>
      )}
    </>
  );
}



