"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { getLiveOrdersForStudent } from "@/lib/supabase/orders";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { formatOrderTimestamp } from "@/lib/utils/formatDate";
import { SUPPORT_CATEGORIES, type SupportCategoryId } from "@/lib/support/categories";
import { ORDER_ISSUE_TYPES, type OrderIssueTypeId } from "@/lib/support/issue_types";
import { FAQ_ITEMS } from "@/lib/support/faq";
import { SUPPORT_CONTACT } from "@/lib/support/contact";

interface SupportTicket {
  id: string;
  category: SupportCategoryId;
  issue_type: OrderIssueTypeId | null;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  related_order_id: string | null;
  created_at: string;
  updated_at: string;
}

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  picked_up: "Picked Up",
  completed: "Completed",
  cancelled: "Cancelled",
};

const TICKET_STATUS_BADGE: Record<SupportTicket["status"], "info" | "warning" | "success" | "neutral"> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export default function HelpSupportPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SupportCategoryId | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  const [helpOrder, setHelpOrder] = useState<Order | null>(null);
  const [selectedIssueType, setSelectedIssueType] = useState<OrderIssueTypeId>("ORDER_NOT_RECEIVED");
  const [issueDescription, setIssueDescription] = useState("");
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  const [formCategory, setFormCategory] = useState<SupportCategoryId>("ORDERS");
  const [formSubject, setFormSubject] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getLiveOrdersForStudent().then((live) => {
      if (isMounted) {
        setOrders(live);
        setIsLoadingOrders(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch("/api/student/support/tickets");
      const data = await res.json();
      if (data.ok) setTickets(data.tickets);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTickets();
  }, []);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = !activeCategory || item.category === activeCategory;
      const matchesQuery =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.keywords.some((k) => k.toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  const recentOrders = orders.slice(0, 5);

  const openHelpForOrder = (order: Order) => {
    setHelpOrder(order);
    setSelectedIssueType("ORDER_NOT_RECEIVED");
    setIssueDescription("");
    setIssueError(null);
  };

  const submitOrderIssue = async () => {
    if (!helpOrder || isSubmittingIssue) return;
    if (!issueDescription.trim()) {
      setIssueError("Add a few details about the issue.");
      return;
    }
    setIssueError(null);
    setIsSubmittingIssue(true);
    try {
      const res = await fetch("/api/student/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "ORDERS",
          issueType: selectedIssueType,
          subject: `${helpOrder.orderNumber} — ${ORDER_ISSUE_TYPES.find((t) => t.id === selectedIssueType)?.label}`,
          description: issueDescription.trim(),
          relatedOrderId: helpOrder.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setIssueError(data.error || "Couldn't submit your request. Please try again.");
        return;
      }
      setHelpOrder(null);
      await loadTickets();
    } catch {
      setIssueError("Couldn't submit your request. Please try again.");
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const submitGeneralTicket = async () => {
    if (isSubmittingForm) return;
    if (!formSubject.trim() || !formDescription.trim()) {
      setFormError("Add a subject and description.");
      return;
    }
    setFormError(null);
    setFormSuccess(null);
    setIsSubmittingForm(true);
    try {
      const res = await fetch("/api/student/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formCategory,
          subject: formSubject.trim(),
          description: formDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFormError(data.error || "Couldn't submit your request. Please try again.");
        return;
      }
      setFormSubject("");
      setFormDescription("");
      setFormSuccess("Your request has been submitted.");
      await loadTickets();
    } catch {
      setFormError("Couldn't submit your request. Please try again.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background pb-24">
      {/* Header */}
      <header className="glass-navbar sticky top-0 z-40">
        <div className="mx-auto flex h-14 sm:h-16 max-w-4xl items-center gap-3 px-4 sm:px-6 md:px-16">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-elevated hover:text-foreground active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              arrow_back
            </span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-heading font-700 tracking-tight text-foreground">
              Help &amp; Support
            </h1>
            <p className="text-caption text-muted">How can we help you?</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 md:px-16 md:pt-8">
        {/* Search */}
        <div className="relative mb-4">
          <span
            className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-muted z-10 select-none"
            aria-hidden="true"
          >
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help — payment issues, refund, GRABIT Gold..."
            aria-label="Search for help"
            className="glass-input h-12 w-full pl-12 pr-4 text-body-sm text-foreground placeholder:text-muted focus:outline-none"
          />
        </div>

        {/* Quick categories */}
        <div
          aria-label="Filter help topics by category"
          className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Chip selected={activeCategory === null} onClick={() => setActiveCategory(null)}>
            All
          </Chip>
          {SUPPORT_CATEGORIES.map((cat) => (
            <Chip
              key={cat.id}
              selected={activeCategory === cat.id}
              onClick={() => setActiveCategory((prev) => (prev === cat.id ? null : cat.id))}
              className="gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                {cat.icon}
              </span>
              {cat.label}
            </Chip>
          ))}
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-6">
          <div className="md:col-span-2">
            {/* FAQ */}
            <section className="mb-6">
              <h2 className="mb-3 font-display text-body font-700 text-foreground">Frequently Asked Questions</h2>
              {filteredFaqs.length === 0 ? (
                <Card variant="glass" className="text-center text-body-sm text-muted">
                  No results — try a different search or category.
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredFaqs.map((item) => (
                    <div key={item.id} className="glass-card overflow-hidden">
                      <details className="group">
                        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 p-4 text-body-sm font-semibold text-foreground marker:content-none">
                          {item.question}
                          <span
                            className="material-symbols-outlined shrink-0 text-muted transition-transform duration-150 group-open:rotate-180"
                            aria-hidden="true"
                          >
                            expand_more
                          </span>
                        </summary>
                        <p className="px-4 pb-4 text-body-sm text-muted leading-relaxed">{item.answer}</p>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Order-specific support */}
          <section className="mb-6">
            <h2 className="mb-3 font-display text-body font-700 text-foreground">Need help with an order?</h2>
            {isLoadingOrders ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : recentOrders.length === 0 ? (
              <Card variant="glass" className="text-center text-body-sm text-muted">
                You don&apos;t have any orders yet.
              </Card>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <Card key={order.id} variant="glass" className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-semibold text-foreground">
                        {order.orderNumber} · {order.canteenName}
                      </p>
                      <p className="text-caption text-muted">
                        {formatOrderTimestamp(order.createdAt)} · {ORDER_STATUS_LABEL[order.status]}
                      </p>
                    </div>
                    <Button variant="secondary" size="md" onClick={() => openHelpForOrder(order)} className="shrink-0">
                      Get help
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Contact support */}
          <section className="mb-6">
            <h2 className="mb-3 font-display text-body font-700 text-foreground">Still need help?</h2>
            <Card variant="glass" className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" aria-hidden="true">
                    chat
                  </span>
                  <span className="text-body-sm font-semibold text-foreground">Chat with Support</span>
                </div>
                <Badge variant="neutral">Coming soon</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="material-symbols-outlined text-primary" aria-hidden="true">
                    mail
                  </span>
                  <span className="text-body-sm font-semibold text-foreground">Email Support</span>
                </div>
                <a
                  href={`mailto:${SUPPORT_CONTACT.email}`}
                  className="rounded-full border border-border px-3 py-1.5 text-caption sm:text-body-sm font-semibold text-primary hover:bg-white/5 transition-colors whitespace-nowrap"
                >
                  {SUPPORT_CONTACT.email}
                </a>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" aria-hidden="true">
                    call
                  </span>
                  <span className="text-body-sm font-semibold text-foreground">Call Support</span>
                </div>
                <a
                  href={`tel:${SUPPORT_CONTACT.helpline}`}
                  className="text-body-sm font-semibold text-muted hover:text-primary transition-colors"
                >
                  {SUPPORT_CONTACT.helpline}
                </a>
              </div>
            </Card>
          </section>

          {/* General ticket submission */}
          <section className="mb-6 md:col-span-2">
            <h2 className="mb-3 font-display text-body font-700 text-foreground">Raise a support request</h2>
            <Card variant="glass" className="space-y-3">
              <div>
                <label className="mb-1.5 block text-body-sm font-semibold text-foreground" htmlFor="support-category">
                  Category
                </label>
                <select
                  id="support-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as SupportCategoryId)}
                  className="h-11 w-full rounded-md border border-border bg-surface-elevated px-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {SUPPORT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-body-sm font-semibold text-foreground" htmlFor="support-subject">
                  Subject
                </label>
                <input
                  id="support-subject"
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                  className="h-11 w-full rounded-md border border-border bg-surface-elevated px-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-body-sm font-semibold text-foreground" htmlFor="support-description">
                  Description
                </label>
                <textarea
                  id="support-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={4}
                  placeholder="Tell us what happened"
                  className="w-full rounded-md border border-border bg-surface-elevated p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                />
              </div>
              {formError && <p className="text-body-sm text-danger">{formError}</p>}
              {formSuccess && <p className="text-body-sm text-success">{formSuccess}</p>}
              <Button
                variant="primary"
                size="md"
                onClick={submitGeneralTicket}
                disabled={isSubmittingForm}
              >
                {isSubmittingForm ? "Submitting..." : "Submit request"}
              </Button>
            </Card>
          </section>

          {/* My Support Requests */}
          <section className="mb-6 md:col-span-2">
            <h2 className="mb-3 font-display text-body font-700 text-foreground">My Support Requests</h2>
            {isLoadingTickets ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
              </div>
            ) : tickets.length === 0 ? (
              <Card variant="glass" className="text-center text-body-sm text-muted">
                You haven&apos;t raised any support requests yet.
              </Card>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} variant="glass" className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-semibold text-foreground">{ticket.subject}</p>
                      <p className="text-caption text-muted">
                        #{ticket.id.slice(0, 8).toUpperCase()} · {SUPPORT_CATEGORIES.find((c) => c.id === ticket.category)?.label}
                        {" · "}
                        {formatOrderTimestamp(ticket.created_at)}
                      </p>
                    </div>
                    <Badge variant={TICKET_STATUS_BADGE[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Info notice */}
          <div className="mb-6 md:col-span-2">
            <div className="glass-surface flex items-start gap-3 p-4">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">
                info
              </span>
              <p className="text-body-sm text-muted">
                Include your Order ID when reporting a payment or order dispute for faster resolution.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Order issue modal */}
      <Modal
        open={helpOrder !== null}
        onClose={() => setHelpOrder(null)}
        title={helpOrder ? `Get help with ${helpOrder.orderNumber}` : ""}
        actions={
          <>
            <Button variant="secondary" size="md" onClick={() => setHelpOrder(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={submitOrderIssue} disabled={isSubmittingIssue}>
              {isSubmittingIssue ? "Submitting..." : "Submit"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {ORDER_ISSUE_TYPES.map((issue) => (
              <Chip
                key={issue.id}
                selected={selectedIssueType === issue.id}
                onClick={() => setSelectedIssueType(issue.id)}
              >
                {issue.label}
              </Chip>
            ))}
          </div>
          <textarea
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            rows={3}
            placeholder="Add a few details..."
            className="w-full rounded-md border border-border bg-surface-elevated p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
          />
          {issueError && <p className="text-body-sm text-danger">{issueError}</p>}
        </div>
      </Modal>
    </div>
  );
}
