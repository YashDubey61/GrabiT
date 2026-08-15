export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatarUrl: string;
  isFeatured?: boolean;
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
    activeStudents: "15,000+",
    dailyOrders: 142,
    revenue: "₹2.4k",
    growth: "+18%",
  },
  testimonials: [
    {
      id: "test_1",
      quote:
        "GrabIt changed my life. I used to spend 20 minutes of my break standing in line. Now I just grab my bag and go. It's stealthy, fast, and works every time.",
      author: "Alex Rivera",
      role: "COMPUTER SCIENCE SENIOR",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBNFJJe--1wDtzpM1vHpfSOBHPeWlkw2KpOJ7fp9X15-Rbeyw6_nUC_bzdmCURnFRPiBbGx65j6JdpCC76IsugF73DtncHOCY1J1Z2uiMrz74PAySYXx4UUkZaLD4mYFnqdceYWrdhKCqdmKolBhtbrBsaRFOxMhkKudgZB8tIvRDa7ytGG_3LErFOPnYuJBx-qDWO9JGuu5ZOkXdxfiEj9rqi3c1O41GzskW_x4GItai04wB_VqdJR",
    },
    {
      id: "test_2",
      quote:
        "As a vendor, managing the lunch rush was a nightmare. GrabIt's dashboard smoothed out our prep time and increased our daily sales by 40%. The best campus partner we've ever had.",
      author: "Sanjay Gupta",
      role: "OWNER, 'THE CURRY BOWL'",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA-kqODSg07R0oiW-12qxHNIze_tjSlk1aTGiUAVOPJvD2U6jljurNHRZkRQbME4bWzpnoFZk84xG3qckcSsBHiVm85qRDt1o73Rc7U_SjSBgWcHNSeOxgm9JmytvZ3-dY6JRWdGewCGRYAgjxrCVlJhNBcBIjsPSMxq7ZBR5KTxaFasUSe2v_eYW0vjJ275tuQNTWZT9nTIfoUgllXrKrYf3lJV8z2K_cRZEkOO5l0hIqrbRZEI_-t",
      isFeatured: true,
    },
    {
      id: "test_3",
      quote:
        "The digital wallet integration is flawless. I love that I can track my spending and get my morning coffee without ever reaching for my physical cards.",
      author: "Maya Chen",
      role: "VARSITY TRACK & FIELD",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAL_2Z0T3YMmIA65H4t9CvmCmNJFHy7Mnu7TDZQ4p8B6hfNhXuYB76eLdi3hjUpFjU_7q_iN5PadC_ubYwKr46Z-o8c1Ykl3rTU2dTeDrTJd_1nyKX1PzC3VU7JlQeW9R3je8liP8kL9pm3ouxGDjXhoXFXPxCE4ypbawynM6lL6hCFkhw_bnVPVY3ko9HZn_G4t4TSg-oDfYMxuolgtjuWr3nlK1Ziwj1QNpyhbJTrwGLoi7wbr8tO",
    },
  ],
};
