export interface GoldSubscription {
  active: boolean;
  planName: string;
  validUntil: string;
  perksSummary: string;
}

export interface StudentProfile {
  id: string;
  studentIdCode: string;
  name: string;
  email: string;
  phone: string;
  campus: string;
  department: string;
  avatarUrl: string;
  goldSubscription: GoldSubscription;
}
