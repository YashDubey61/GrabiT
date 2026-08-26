export interface Testimonial {
  name: string;
  role: string;
  text: string;
  image: string;
}

export interface LandingMetrics {
  activeStudents: string;
  dailyOrders: number;
  revenue: string;
  growth: string;
}

export const MOCK_LANDING_DATA: {
  metrics: LandingMetrics;
  testimonials: Testimonial[];
} = {
  metrics: {
    activeStudents: "100+",
    dailyOrders: 142,
    revenue: "₹2.4k",
    growth: "+18%",
  },
  testimonials: [
    {
      name: "Yash Dubey",
      role: "Founder",
      text: "We’re building Grabit to make campus food faster, simpler, and completely built around student life.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Gopal Ji Dwivedi",
      role: "CTO",
      text: "Grabit brings ordering, payments, and pickup together into one seamless campus experience.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Harsh Kumar",
      role: "CFO",
      text: "The goal is simple — build a campus food ecosystem that works better for students, vendors, and everyone in between.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Aditi Mishra",
      role: "Team Member",
      text: "We’re focused on making every Grabit interaction feel quick, effortless, and genuinely useful for students.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
  ],
};
