import React, { useState } from 'react';

interface CoachingSectionProps {
  advice: string;
  isCollapsed: boolean;
}

export const CoachingSection: React.FC<CoachingSectionProps> = ({
  advice,
  isCollapsed,
}) => {
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);

  if (!advice) {
    return null;
  }

  return (
    <div className={`coaching-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="coaching-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>AI Coaching Advice</h3>
        <span className="collapse-icon">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div className="coaching-content">
          <p>{advice}</p>
        </div>
      )}
    </div>
  );
};