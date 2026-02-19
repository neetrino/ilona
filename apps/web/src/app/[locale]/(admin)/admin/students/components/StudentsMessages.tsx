'use client';

interface StudentsMessagesProps {
  deleteSuccess: boolean;
  deleteError: string | null;
  bulkDeleteSuccess: boolean;
  bulkDeleteError: string | null;
  deletedCount: number;
  deactivateSuccess: boolean;
  deactivateError: string | null;
}

export function StudentsMessages({
  deleteSuccess,
  deleteError,
  bulkDeleteSuccess,
  bulkDeleteError,
  deletedCount,
  deactivateSuccess,
  deactivateError,
}: StudentsMessagesProps) {
  return (
    <>
      {deleteSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">Student deleted successfully!</p>
        </div>
      )}
      {deleteError && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600 font-medium">{deleteError}</p>
        </div>
      )}
      {bulkDeleteSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">
            {deletedCount > 0 
              ? `${deletedCount} ${deletedCount === 1 ? 'student' : 'students'} deleted successfully!`
              : 'Students deleted successfully!'}
          </p>
        </div>
      )}
      {bulkDeleteError && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600 font-medium">{bulkDeleteError}</p>
        </div>
      )}
      {deactivateSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">Student status updated successfully!</p>
        </div>
      )}
      {deactivateError && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600 font-medium">{deactivateError}</p>
        </div>
      )}
    </>
  );
}

