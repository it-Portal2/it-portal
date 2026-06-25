"use client";

import type React from "react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";

const UI = {
  screen:
    "h-screen overflow-hidden font-auth-body text-[#14161c] antialiased [line-height:1.5] [text-rendering:optimizeLegibility] flex items-center justify-center px-4 max-[1024px]:h-auto max-[1024px]:min-h-screen max-[1024px]:overflow-auto max-[1024px]:p-0",
  wrap: "w-full max-h-full flex items-center justify-center",
  sheet:
    "grid grid-cols-[1.4fr_1fr] grid-rows-[1fr] gap-0 overflow-hidden rounded-xl bg-white p-3 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out motion-reduce:animate-none max-[1024px]:grid-cols-1 max-[1024px]:grid-rows-none max-[1024px]:gap-0 max-[1024px]:p-0 max-[1024px]:rounded-none max-[1024px]:h-[100dvh] w-full h-[calc(100vh-2rem)]",
  bp:
    "relative isolate flex flex-col min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-xl bg-[linear-gradient(168deg,#2f5bff_0%,#2444e0_70%,#1b329e_100%)] px-8 py-8 text-white transition-[background] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:content-[''] after:bg-[radial-gradient(440px_320px_at_88%_6%,rgba(255,255,255,.16),transparent_60%)] max-[1024px]:hidden",
  bpBrand:
    "font-auth-display text-[0.82rem] font-semibold uppercase tracking-[0.22em] text-white/90",
  bpMain: "mt-6 max-[1024px]:mt-5",
  bpTitle:
    "font-auth-display text-[2.6rem] lg:text-[2.9rem] font-bold leading-[1.05] tracking-[-0.025em] text-white max-[1024px]:text-[2rem]",
  bpSub:
    "mt-3 max-w-[33ch] text-[0.88rem] leading-[1.55] text-white/80 max-[1024px]:max-w-none",
  bpFoot: "mt-auto pt-6 max-[1024px]:hidden",
  slides: "relative min-h-[160px]",
  quote:
    "rounded-lg border border-white/15 bg-white/10 px-4 py-[0.9rem] backdrop-blur-[4px]",
  slideQuote:
    "absolute inset-0 flex translate-y-[7px] flex-col justify-between opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none motion-reduce:transition-none",
  slideActive: "translate-y-0 opacity-100 pointer-events-auto",
  dots: "mt-3 flex justify-center gap-[0.45rem]",
  dot:
    "h-[7px] w-[7px] cursor-pointer rounded-lg border-0 bg-white/40 p-0 transition-[width,background] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/70",
  dotActive: "w-[22px] bg-white",
  quoteText: "text-[0.85rem] leading-[1.55] text-white/95",
  who: "mt-3 flex items-center gap-[0.65rem]",
  av:
    "grid h-[34px] w-[34px] flex-none place-items-center rounded-lg bg-black text-[0.78rem] font-semibold text-white",
  nm: "text-[0.83rem] font-semibold leading-[1.3] text-white",
  rl: "text-[0.76rem] leading-[1.3] text-white/70",
  note: "flex items-center gap-[0.8rem]",
  nicon:
    "grid h-[34px] w-[34px] flex-none place-items-center rounded-lg border border-white/25 bg-white/15 [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:stroke-white",
  ntxt: "text-[0.86rem] leading-[1.55] text-white/90",
  card:
    "flex flex-col justify-center min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-tr-xl rounded-br-xl bg-white py-3 pl-8 pr-6 max-[1024px]:justify-start max-[1024px]:rounded-none max-[1024px]:px-12 max-[1024px]:pb-8 max-[1024px]:pt-12 max-[430px]:px-8",
  seglabel: "mb-[0.45rem] text-[0.82rem] font-medium text-[#3d4350]",
  portal: "mb-3 grid grid-cols-2 gap-[0.6rem] max-[430px]:grid-cols-1",
  portalButton:
    "group inline-flex cursor-pointer items-center justify-start gap-[0.6rem] rounded-lg border-[1.5px] border-[#d9dde5] bg-white px-[0.85rem] py-[0.65rem] text-[0.88rem] font-medium text-[#3d4350] transition-[border-color,background,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#bcc2cd] aria-selected:border-[#2f5bff] aria-selected:bg-[#eef2ff] aria-selected:text-[#14161c] focus-visible:rounded-lg focus-visible:shadow-[0_0_0_3px_rgba(47,91,255,0.14)] disabled:cursor-default disabled:opacity-70 [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:flex-none [&_svg]:text-[#777d89] [&_svg]:transition-colors [&_svg]:duration-200 aria-selected:[&_svg]:text-[#2f5bff]",
  radio:
    "grid h-[18px] w-[18px] flex-none place-items-center rounded-lg border-[1.5px] border-[#c6cbd5] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] after:h-[9px] after:w-[9px] after:scale-0 after:rounded-lg after:bg-[#2f5bff] after:transition-transform after:duration-200 after:content-[''] group-aria-selected:border-[#2f5bff] group-aria-selected:after:scale-100",
  head:
    "mb-5 [&_h1]:mb-[0.5rem] [&_h1]:font-auth-display [&_h1]:text-[1.35rem] [&_h1]:font-bold [&_h1]:leading-[1.12] [&_h1]:tracking-[-0.022em] [&_p]:max-w-[42ch] [&_p]:text-[0.82rem] [&_p]:leading-[1.4] [&_p]:text-[#777d89]",
  sub:
    "mb-4 grid grid-cols-2 gap-1 rounded-lg bg-[#f0f1f4] p-1 [&_button]:inline-flex [&_button]:min-h-[32px] [&_button]:cursor-pointer [&_button]:items-center [&_button]:justify-center [&_button]:gap-[0.45rem] [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-[0.35rem] [&_button]:text-[0.82rem] [&_button]:font-medium [&_button]:text-[#777d89] [&_button]:transition-[color,background] [&_button]:duration-200 [&_button]:ease-[cubic-bezier(0.22,1,0.36,1)] [&_button]:focus-visible:rounded-lg [&_button]:focus-visible:shadow-[0_0_0_3px_rgba(47,91,255,0.14)] [&_button[aria-selected=true]]:bg-white [&_button[aria-selected=true]]:text-[#14161c] [&_button[aria-selected=true]]:shadow-[0_1px_2px_rgba(20,24,33,.1)] [&_svg]:h-3.5 [&_svg]:w-3.5",
  grid2: "grid grid-cols-2 gap-2.5 max-[430px]:grid-cols-1 max-[430px]:gap-0",
  field:
    "mb-3 [&_label]:mb-[0.25rem] [&_label]:block [&_label]:text-[0.78rem] [&_label]:font-medium [&_label]:text-[#3d4350]",
  ctrl: "relative",
  input:
    "h-[2.4rem] w-full rounded-lg border border-[#d9dde5] bg-white px-[0.85rem] py-[0.5rem] text-[0.86rem] text-[#14161c] transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-[#aeb4c0] hover:border-[#c6cbd5] focus:border-[#2f5bff] focus:outline-none focus:shadow-[0_0_0_3px_rgba(47,91,255,0.14)] focus-visible:border-[#2f5bff] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(47,91,255,0.14)] disabled:cursor-default disabled:opacity-70",
  pwInput: "pr-16",
  tpw:
    "absolute right-[0.45rem] top-1/2 min-h-7 -translate-y-1/2 cursor-pointer rounded-lg border-0 bg-transparent px-[0.5rem] py-[0.35rem] text-[0.78rem] font-medium text-[#777d89] transition-[color,background] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#eef2ff] hover:text-[#2f5bff] focus-visible:rounded-lg focus-visible:shadow-[0_0_0_3px_rgba(47,91,255,0.14)]",
  caps:
    "mt-[0.35rem] hidden items-center gap-[0.4rem] text-[0.75rem] text-[#b06f12] [&_svg]:h-[12px] [&_svg]:w-[12px]",
  capsOn: "flex",
  strength: "mt-[0.45rem]",
  bars: "mb-[0.35rem] grid grid-cols-4 gap-[4px]",
  bar: "h-1 rounded-lg bg-[#eceef2] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
  req:
    "text-[0.75rem] leading-[1.4] text-[#777d89] [&_b]:font-medium [&_b]:text-[#3d4350]",
  meta: "my-[0.1rem] mb-2 flex items-center justify-between",
  remember:
    "inline-flex cursor-pointer select-none items-center gap-2 text-[0.82rem] text-[#3d4350] [&_input]:h-4 [&_input]:w-4 [&_input]:cursor-pointer [&_input]:accent-[#2f5bff] [&_input]:focus-visible:rounded-lg [&_input]:focus-visible:shadow-[0_0_0_3px_rgba(47,91,255,0.14)]",
  link:
    "text-[0.82rem] font-medium text-[#2f5bff] no-underline hover:underline focus-visible:rounded-lg focus-visible:shadow-[0_0_0_3px_rgba(47,91,255,0.14)]",
  gap: "h-px",
  cta:
    "relative inline-flex h-[40px] w-full cursor-pointer items-center justify-center rounded-lg border-0 bg-[#14161c] p-0 text-[0.88rem] font-semibold text-white shadow-[0_4px_14px_-3px_rgba(20,22,28,.38)] transition-[transform,box-shadow,background] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:bg-black hover:shadow-[0_8px_20px_-3px_rgba(20,22,28,.45)] active:translate-y-0 disabled:cursor-default disabled:opacity-[.96] disabled:hover:translate-y-0 focus-visible:rounded-lg focus-visible:shadow-[0_0_0_3px_rgba(20,22,28,0.16),0_4px_14px_-3px_rgba(20,22,28,.38)]",
  spin:
    "h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white",
  divider:
    "my-3 flex items-center gap-[0.85rem] text-[0.76rem] text-[#9aa0ab] before:h-px before:flex-1 before:bg-[#eceef2] before:content-[''] after:h-px after:flex-1 after:bg-[#eceef2] after:content-['']",
  google:
    "flex h-[40px] w-full cursor-pointer items-center justify-center gap-[0.65rem] rounded-lg border border-[#d9dde5] bg-white p-0 text-[0.86rem] font-medium text-[#14161c] transition-[border-color,box-shadow,background] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#c6cbd5] hover:bg-[#fcfcfd] hover:shadow-[0_2px_10px_rgba(20,24,33,.05)] disabled:cursor-default disabled:opacity-70 focus-visible:rounded-lg focus-visible:shadow-[0_0_0_3px_rgba(47,91,255,0.14)]",
  fine:
    "mt-3 text-center text-[0.74rem] leading-[1.4] text-[#777d89] [&_a]:border-b [&_a]:border-[#d9dde5] [&_a]:text-[#3d4350] [&_a]:no-underline hover:[&_a]:border-[#2f5bff] hover:[&_a]:text-[#2f5bff] [&_a]:focus-visible:rounded-lg [&_a]:focus-visible:shadow-[0_0_0_3px_rgba(47,91,255,0.14)]",
};

const strengthBarColor = (score: number, index: number) => {
  if (index > score) return "";
  if (score === 1) return "bg-[#d6342c]";
  if (score === 2) return "bg-[#e0922b]";
  if (score === 3) return "bg-[#c9b21e]";
  return "bg-[#16a06a]";
};

// Brand-panel testimonials shown on the client portal (auto-rotating).
const TESTIMONIALS = [
  { t: "We needed a robust B2B sales platform built from the ground up, and the scope was complex. Cehpoint's intelligent portal mapped out our entire architecture and provided an instant, accurate quotation. The development process has been completely transparent ever since.", n: "Bidchemz CEO", r: "B2B Sales Platform", a: "BC" },
  { t: "Building a secure SaaS product requires serious precision. What stood out to me was how organized everything is in the client portal. Being able to track milestones, review invoices, and chat directly with the dev team in one unified dashboard made managing Cedarguard stress-free.", n: "Cedarguard CEO", r: "SaaS Software", a: "CC" },
  { t: "As a non-profit, we had strict budgets and needed complete transparency on costs. Cehpoint's automated scoping gave us exactly that. They delivered the Moojkasher website perfectly, and the portal made it remarkably easy for our board to track progress and share assets securely.", n: "Moojkasher CEO", r: "NGO Website", a: "MC" },
  { t: "Scaling our SaaS platform required an experienced development partner. Cehpoint provided incredible value from day one. Their intelligent quoting and transparent communication via the portal meant we never had to worry about hidden costs or missed deadlines.", n: "Blackleoventures CEO", r: "SaaS Software", a: "BV" },
];

const BRAND_TEXT = {
  client: {
    title: <>Welcome to your AI-powered<br/>intelligent IT portal.</>,
    points: [
      "No need to write documentation manually — just describe your idea. Our intelligent software writes the full documentation and gives an instant quotation.",
      "Track milestones, deliverables, and project timelines in real time.",
      "Manage services, secure payments, and review invoices seamlessly.",
      "Collaborate directly with our expert development team via integrated chat.",
      "Centralize all your project files, assets, and communications in one secure space."
    ],
  },
  staff: {
    title: <>Platform command &<br/>development center.</>,
    points: [
      "Oversee client requests, project lifecycles, and ongoing development tasks.",
      "Manage payments, platform settings, and review candidate applications.",
      "Coordinate development sprints, track issue resolutions, and monitor deployments.",
      "Communicate with clients and internal team members through secure channels.",
      "Enterprise-grade security with strict role-based access controls and detailed audit logs."
    ],
  },
};

const CLIENT_TEXT = {
  signup: {
    h: "Welcome to your client portal",
    p: "Create an account to track projects, share files, and collaborate with our team.",
    cta: "Create account",
    pw: "Create a secure password",
  },
  login: {
    h: "Welcome back",
    p: "Sign in to your client workspace to pick up where you left off.",
    cta: "Sign in",
    pw: "Enter your password",
  },
};

export default function AuthPage() {
  const { signUp, login, googleLogin, isLoading, error } = useAuth();

  // ── presentational UI state (design only) ──
  const [portal, setPortal] = useState<"client" | "staff">("client");
  const [clientMode, setClientMode] = useState<"signup" | "login">("signup");
  const [staffRole, setStaffRole] = useState<"admin" | "developer">("admin");
  const [showClientPw, setShowClientPw] = useState(false);
  const [showStaffPw, setShowStaffPw] = useState(false);
  const [capsClient, setCapsClient] = useState(false);
  const [capsStaff, setCapsStaff] = useState(false);
  const [slide, setSlide] = useState(0);

  // Add local loading states to prevent multiple clicks
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // Client signup form state
  const [clientSignupForm, setClientSignupForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Show toast for errors from auth hook
  useEffect(() => {
    if (error) {
      toast.error(error);
      // Reset all local loading states if there's an error
      setIsSigningUp(false);
      setIsLoggingIn(false);
      setIsGoogleSigningIn(false);
    }
  }, [error]);

  // One-time "logged out" confirmation after logout navigates here.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("loggedOut") === "1") {
        sessionStorage.removeItem("loggedOut");
        toast.success("You have been logged out.");
      }
    } catch {}
  }, []);

  // Auto-rotate the client testimonials slider (respects reduced-motion).
  useEffect(() => {
    if (portal !== "client") return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(id);
  }, [portal]);

  // Handle client signup form changes
  const handleClientSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientSignupForm({
      ...clientSignupForm,
      [e.target.id]: e.target.value,
    });
  };

  // Handle login form changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({
      ...loginForm,
      [e.target.id]: e.target.value,
    });
  };

  // Handle client signup
  const handleClientSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple clicks
    if (isSigningUp || isLoading) return;

    setIsSigningUp(true);

    // Validate form
    if (clientSignupForm.password !== clientSignupForm.confirmPassword) {
      toast.error("Passwords don't match");
      setIsSigningUp(false);
      return;
    }

    if (clientSignupForm.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      setIsSigningUp(false);
      return;
    }

    try {
      const success = await signUp(
        clientSignupForm.email,
        clientSignupForm.password,
        clientSignupForm.name,
        clientSignupForm.phone
      );

      if (success) {
        // Navigation to the dashboard is underway — keep the button pending
        // until this page unmounts (no toast over a still-loading dashboard,
        // no idle button on a blank screen). Errors reset the flag via the
        // `error` effect above.
        setClientSignupForm({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });
        return;
      }
      setIsSigningUp(false);
    } catch (error) {
      console.error("Signup error:", error);
      setIsSigningUp(false);
    }
  };

  // Handle client login
  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple clicks
    if (isLoggingIn || isLoading) return;

    setIsLoggingIn(true);

    try {
      const success = await login(loginForm.email, loginForm.password, "client");

      if (success) {
        // Keep the button pending through navigation; errors reset it via the
        // `error` effect above.
        setLoginForm({ email: "", password: "" });
        return;
      }
      setIsLoggingIn(false);
    } catch (error) {
      console.error("Login error:", error);
      setIsLoggingIn(false);
    }
  };

  // Handle admin/subadmin login - both use same admin role check
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple clicks
    if (isLoggingIn || isLoading) return;

    setIsLoggingIn(true);

    try {
      const success = await login(loginForm.email, loginForm.password, "admin");

      if (success) {
        // Keep the button pending through navigation; errors reset it via the
        // `error` effect above.
        setLoginForm({ email: "", password: "" });
        return;
      }
      setIsLoggingIn(false);
    } catch (error) {
      console.error("Login error:", error);
      setIsLoggingIn(false);
    }
  };

  // Handle developer login
  const handleDeveloperLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple clicks
    if (isLoggingIn || isLoading) return;

    setIsLoggingIn(true);

    try {
      const success = await login(loginForm.email, loginForm.password, "developer");

      if (success) {
        // Keep the button pending through navigation; errors reset it via the
        // `error` effect above.
        setLoginForm({ email: "", password: "" });
        return;
      }
      setIsLoggingIn(false);
    } catch (error) {
      console.error("Login error:", error);
      setIsLoggingIn(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    // Prevent multiple clicks
    if (isGoogleSigningIn || isLoading) return;

    setIsGoogleSigningIn(true);

    try {
      const success = await googleLogin();

      if (success) {
        // Keep the button pending through navigation; errors reset it via the
        // `error` effect above.
        return;
      }
      setIsGoogleSigningIn(false);
    } catch (error) {
      console.error("Google sign-in error:", error);
      setIsGoogleSigningIn(false);
    }
  };

  // Determine if a button should be disabled
  const isButtonDisabled =
    isLoading || isSigningUp || isLoggingIn || isGoogleSigningIn;

  // Caps-lock detection for password fields (presentational hint).
  const checkCaps = (
    setter: (v: boolean) => void
  ) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setter(e.getModifierState("CapsLock"));
    }
  };

  // Password strength score 0–4 (length / uppercase / number / symbol).
  const pw = clientSignupForm.password;
  const strengthScore =
    (pw.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);
  const normalizedStrength = pw ? Math.max(1, strengthScore) : 0;

  return (
    <div className={UI.screen}>
      <div className={UI.wrap}>
        <div className={UI.sheet}>
          {/* ── BRAND PANEL (swaps with Client / Staff) ── */}
          <aside className={UI.bp}>
            <div className={UI.bpBrand}>Cehpoint</div>
            <div className={UI.bpMain}>
              <h2 className={UI.bpTitle}>{BRAND_TEXT[portal].title}</h2>
              <ul className="mt-8 space-y-[1.2rem] text-[0.95rem] leading-[1.55] text-white/90 max-[780px]:max-w-none">
                {BRAND_TEXT[portal].points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-[18px] h-[18px] flex-none mt-[0.15rem] text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={UI.bpFoot}>
              {portal === "client" ? (
                <div>
                  <div className={UI.slides}>
                    {TESTIMONIALS.map((d, i) => (
                      <div
                        key={d.n}
                        className={cn(UI.quote, UI.slideQuote, i === slide && UI.slideActive)}
                      >
                        <p className={UI.quoteText}>“{d.t}”</p>
                        <div className={UI.who}>
                          <span className={UI.av}>{d.a}</span>
                          <div>
                            <div className={UI.nm}>{d.n}</div>
                            <div className={UI.rl}>{d.r}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={UI.dots}>
                    {TESTIMONIALS.map((d, i) => (
                      <button
                        key={d.n}
                        type="button"
                        className={cn(UI.dot, i === slide && UI.dotActive)}
                        aria-label={`Show testimonial ${i + 1}`}
                        onClick={() => setSlide(i)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className={cn(UI.quote, UI.note)}>
                  <span className={UI.nicon}>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                      <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
                    </svg>
                  </span>
                  <div className={UI.ntxt}>
                    Access is restricted to authorized personnel. Every sign-in
                    and action is logged and audited.
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── FORM SIDE ── */}
          <div className={UI.card}>
            <div className="w-full max-w-[440px] mx-auto">
              <div className={UI.seglabel}>I&apos;m signing in as</div>
            <div className={UI.portal} role="tablist" aria-label="Portal">
              <button
                type="button"
                role="tab"
                aria-selected={portal === "client"}
                onClick={() => setPortal("client")}
                disabled={isButtonDisabled}
                className={UI.portalButton}
              >
                <span className={UI.radio} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </svg>{" "}
                Client area
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={portal === "staff"}
                onClick={() => setPortal("staff")}
                disabled={isButtonDisabled}
                className={UI.portalButton}
              >
                <span className={UI.radio} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
                </svg>{" "}
                Staff login
              </button>
            </div>

            {/* CLIENT */}
            {portal === "client" && (
              <form
                onSubmit={clientMode === "signup" ? handleClientSignup : handleClientLogin}
                noValidate
              >
                <div className={UI.head}>
                  <h1>{CLIENT_TEXT[clientMode].h}</h1>
                  <p>{CLIENT_TEXT[clientMode].p}</p>
                </div>

                <div className={UI.sub} role="tablist" aria-label="Client mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={clientMode === "signup"}
                    onClick={() => setClientMode("signup")}
                  >
                    Sign up
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={clientMode === "login"}
                    onClick={() => setClientMode("login")}
                  >
                    Log in
                  </button>
                </div>

                {clientMode === "signup" && (
                  <div className={UI.grid2}>
                    <div className={UI.field}>
                      <label htmlFor="name">Full name</label>
                      <div className={UI.ctrl}>
                        <input
                          className={UI.input}
                          id="name"
                          type="text"
                          placeholder="Jane Doe"
                          autoComplete="name"
                          value={clientSignupForm.name}
                          onChange={handleClientSignupChange}
                          disabled={isButtonDisabled}
                          required
                        />
                      </div>
                    </div>
                    <div className={UI.field}>
                      <label htmlFor="phone">Phone</label>
                      <div className={UI.ctrl}>
                        <input
                          className={UI.input}
                          id="phone"
                          type="tel"
                          inputMode="tel"
                          placeholder="+91 00000 00000"
                          autoComplete="tel"
                          value={clientSignupForm.phone}
                          onChange={handleClientSignupChange}
                          disabled={isButtonDisabled}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className={UI.field}>
                  <label htmlFor="email">Email address</label>
                  <div className={UI.ctrl}>
                    <input
                      className={UI.input}
                      id="email"
                      type="email"
                      inputMode="email"
                      placeholder="jane@company.com"
                      autoComplete="email"
                      value={clientMode === "signup" ? clientSignupForm.email : loginForm.email}
                      onChange={clientMode === "signup" ? handleClientSignupChange : handleLoginChange}
                      disabled={isButtonDisabled}
                      required
                    />
                  </div>
                </div>

                <div className={UI.field}>
                  <label htmlFor="password">Password</label>
                  <div className={UI.ctrl}>
                    <input
                      className={cn(UI.input, UI.pwInput)}
                      id="password"
                      type={showClientPw ? "text" : "password"}
                      placeholder={CLIENT_TEXT[clientMode].pw}
                      autoComplete={clientMode === "signup" ? "new-password" : "current-password"}
                      value={clientMode === "signup" ? clientSignupForm.password : loginForm.password}
                      onChange={clientMode === "signup" ? handleClientSignupChange : handleLoginChange}
                      onKeyUp={checkCaps(setCapsClient)}
                      onKeyDown={checkCaps(setCapsClient)}
                      onBlur={() => setCapsClient(false)}
                      disabled={isButtonDisabled}
                      required
                    />
                    <button
                      type="button"
                      className={UI.tpw}
                      aria-label={showClientPw ? "Hide password" : "Show password"}
                      aria-pressed={showClientPw}
                      onClick={() => setShowClientPw((v) => !v)}
                    >
                      {showClientPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className={cn(UI.caps, capsClient && UI.capsOn)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3l7 7h-4v5H9v-5H5z" />
                      <rect x="9" y="18" width="6" height="3" rx="1" />
                    </svg>{" "}
                    Caps Lock is on
                  </div>
                  {clientMode === "signup" && (
                    <div className={UI.strength}>
                      <div className={UI.bars}>
                        {[1, 2, 3, 4].map((i) => (
                          <i
                            key={i}
                            className={cn(UI.bar, strengthBarColor(normalizedStrength, i))}
                          />
                        ))}
                      </div>
                      <div className={UI.req}>
                        Use <b>8+ characters</b> with a number and an uppercase letter.
                      </div>
                    </div>
                  )}
                </div>

                {clientMode === "signup" && (
                  <div className={UI.field}>
                    <label htmlFor="confirmPassword">Confirm password</label>
                    <div className={UI.ctrl}>
                      <input
                        className={UI.input}
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        value={clientSignupForm.confirmPassword}
                        onChange={handleClientSignupChange}
                        disabled={isButtonDisabled}
                        required
                      />
                    </div>
                  </div>
                )}

                {clientMode === "login" && (
                  <div className={UI.meta}>
                    <label className={UI.remember}>
                      <input type="checkbox" /> Keep me signed in
                    </label>
                    <a
                      className={UI.link}
                      href="#"
                      onClick={(e) => e.preventDefault()}
                    >
                      Forgot password?
                    </a>
                  </div>
                )}
                {clientMode === "signup" && <div className={UI.gap} />}

                <button className={UI.cta} type="submit" disabled={isButtonDisabled}>
                  {(clientMode === "signup" ? isSigningUp : isLoggingIn) ? (
                    <span className={UI.spin} />
                  ) : (
                    <span>{CLIENT_TEXT[clientMode].cta}</span>
                  )}
                </button>

                <div className={UI.divider}>or continue with</div>
                <button
                  className={UI.google}
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isButtonDisabled}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
                  </svg>
                  {isGoogleSigningIn ? "Signing in with Google..." : "Google"}
                </button>
                <p className={UI.fine}>
                  By continuing you agree to our{" "}
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </a>
                  .
                </p>
              </form>
            )}

            {/* STAFF */}
            {portal === "staff" && (
              <form
                onSubmit={staffRole === "admin" ? handleAdminLogin : handleDeveloperLogin}
                noValidate
              >
                <div className={UI.head}>
                  <h1>Staff login</h1>
                  <p>Secure access for administrators and developers.</p>
                </div>

                <div className={UI.sub} role="tablist" aria-label="Staff role">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={staffRole === "admin"}
                    onClick={() => setStaffRole("admin")}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
                    </svg>{" "}
                    Admin
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={staffRole === "developer"}
                    onClick={() => setStaffRole("developer")}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 6l-6 6 6 6M16 6l6 6-6 6" />
                    </svg>{" "}
                    Developer
                  </button>
                </div>

                <div className={UI.field}>
                  <label htmlFor="email">
                    {staffRole === "admin" ? "Admin email" : "Developer email"}
                  </label>
                  <div className={UI.ctrl}>
                    <input
                      className={UI.input}
                      id="email"
                      type="email"
                      inputMode="email"
                      placeholder={
                        staffRole === "admin" ? "admin@cehpoint.co.in" : "dev@cehpoint.co.in"
                      }
                      autoComplete="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      disabled={isButtonDisabled}
                      required
                    />
                  </div>
                </div>
                <div className={UI.field}>
                  <label htmlFor="password">Password</label>
                  <div className={UI.ctrl}>
                    <input
                      className={cn(UI.input, UI.pwInput)}
                      id="password"
                      type={showStaffPw ? "text" : "password"}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      onKeyUp={checkCaps(setCapsStaff)}
                      onKeyDown={checkCaps(setCapsStaff)}
                      onBlur={() => setCapsStaff(false)}
                      disabled={isButtonDisabled}
                      required
                    />
                    <button
                      type="button"
                      className={UI.tpw}
                      aria-label={showStaffPw ? "Hide password" : "Show password"}
                      aria-pressed={showStaffPw}
                      onClick={() => setShowStaffPw((v) => !v)}
                    >
                      {showStaffPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className={cn(UI.caps, capsStaff && UI.capsOn)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3l7 7h-4v5H9v-5H5z" />
                      <rect x="9" y="18" width="6" height="3" rx="1" />
                    </svg>{" "}
                    Caps Lock is on
                  </div>
                </div>
                <div className={UI.gap} />

                <button className={UI.cta} type="submit" disabled={isButtonDisabled}>
                  {isLoggingIn ? (
                    <span className={UI.spin} />
                  ) : (
                    <span>
                      {staffRole === "admin" ? "Login to admin panel" : "Login to dev tools"}
                    </span>
                  )}
                </button>
                <p className={UI.fine}>
                  Access is restricted to authorized personnel only.
                </p>
              </form>
            )}
            </div>
          </div>
          {/* /.card */}
        </div>
        {/* /.sheet */}
      </div>
    </div>
  );
}
