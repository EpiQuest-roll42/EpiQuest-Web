import type { Problem } from '../api/schema';

export class CampaignRepositoryError extends Error {
  readonly problem: Problem;

  constructor(problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = 'CampaignRepositoryError';
    this.problem = problem;
  }
}
