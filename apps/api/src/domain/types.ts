export type StageName = 'SUBMITTED' | 'DOCUMENT_VERIFICATION' | 'OFFICER_VERIFICATION' | 'APPROVAL' | 'DELIVERED';
export type StageState = 'COMPLETED' | 'CURRENT' | 'PENDING';
export type ApplicationStatus = 'UNDER_VERIFICATION' | 'ACTION_REQUIRED' | 'APPROVED';

export interface Explanation { headline: string; explanation: string; nextStep: string; actionMessage: string }
export interface Stage { stage: StageName; position: number; state: StageState; startedAt: string | null; completedAt: string | null; expectedMaxDays: number }
export interface CitizenAction { required: boolean; description: string; active: boolean }
export interface Application { id: string; applicationNumber: string; submissionDate: string; serviceType: string; status: ApplicationStatus; currentStage: StageName; lastUpdatedAt: string; stages: Stage[]; action: CitizenAction | null; fallbackExplanation: Explanation }
export interface Grievance { grievanceNumber: string; applicationNumber: string; status: 'SUBMITTED'; summary: string; createdAt: string }
