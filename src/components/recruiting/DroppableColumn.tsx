import { useDroppable } from '@dnd-kit/core';
import type { CandidateStatus } from '../../types';

interface DroppableColumnProps {
  status: CandidateStatus;
  children: React.ReactNode;
  className?: string;
}

export function DroppableColumn({ status, children, className }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={className}
    >
      {children}
    </div>
  );
}
