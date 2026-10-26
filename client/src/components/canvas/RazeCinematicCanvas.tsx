import React from 'react';
import { RazeCinematic3D } from './RazeCinematic3D';

interface RazeCinematicCanvasProps {
  onHandClick?: () => void;
  className?: string;
  isAwakened?: boolean;
}

export const RazeCinematicCanvas: React.FC<RazeCinematicCanvasProps> = ({
  onHandClick,
  className = '',
  isAwakened = false
}) => {
  return (
    <RazeCinematic3D
      onHandClick={onHandClick}
      className={className}
      isAwakened={isAwakened}
    />
  );
};
