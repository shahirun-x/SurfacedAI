export interface AuditIssue {
  id: string;
  pillar: 'SEO' | 'AEO' | 'GEO' | 'AIO' | 'Technical';
  severity: 'critical' | 'moderate' | 'minor';
  title: string;
  description: string;
  suggestion: string;
}

export interface PillarScore {
  pillar: 'SEO' | 'AEO' | 'GEO' | 'AIO' | 'Technical';
  score: number; // 0-100
  issues: AuditIssue[];
}

export interface AuditReport {
  overallScore: number;
  pillars: PillarScore[];
  contentLength: number;
  timestamp: string;
}
