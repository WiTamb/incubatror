import { User } from './user.model';

export enum ProjectStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface Project {
  id: number;
  title: string;
  description: string;
  domain?: string;
  teamMembers?: string;
  documentPath?: string;
  imagePath?: string;
  videoUrl?: string;
  status: ProjectStatus;
  submittedAt: string;
  updatedAt?: string;
  owner: User;
  program?: Program;
  round?: Round;
  evaluations?: any[];
  githubUrl?: string;
}

export interface ProjectRequest {
  title: string;
  description: string;
  domain?: string;
  teamMembers?: string;
  videoUrl?: string;
  programId?: number;
  roundId?: number;
}

export interface Program {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
  imagePath?: string;
}

export interface Round {
  id: number;
  name: string;
  description?: string;
  roundNumber?: number;
  deadline?: string;
  active: boolean;
  createdAt: string;
  program?: Program;
}
