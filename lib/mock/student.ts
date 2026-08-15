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

export const MOCK_STUDENT_PROFILE: StudentProfile = {
  id: "std_2024psit0882",
  studentIdCode: "2024PSIT0882",
  name: "Aryan Sharma",
  email: "aryan.sharma@psit.ac.in",
  phone: "+91 98765 43210",
  campus: "PSIT Kanpur",
  department: "Computer Science",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDen9ohJhnD8P_jikuQgTYTBo2jkHFI5sB8Ez94WoR9wkZa8IWhCY4W-Ar424CgmEuYuS-aXmGEVGJnENhQNCcVazQ49YJDlRcimBBEWguSgucnFqYOv43jBXmyryt9DnttcemRUPR2dXDCuj3JAJG_UMbmo_8bHGQP8lnSuDmIBFdb9qvZEqgB4UuGDAHl7ZpkVgKPAr5pV50WrvmRI9uCENT0uBCicO5v_-S3fDyJZ15VhNhzUveG",
  goldSubscription: {
    active: true,
    planName: "GrabIt Gold",
    validUntil: "12 Dec 2024",
    perksSummary:
      "Free deliveries on all orders above ₹149 & 10% instant cashback on campus cafes.",
  },
};
