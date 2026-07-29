import React, { useState } from 'react';
import { HelpCircle, Send, MessageSquare, BookOpen } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Toast } from '../../components/common/Toast';

export const SupportPage: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    setShowToast(true);
    setSubject('');
    setMessage('');
    setTimeout(() => setShowToast(false), 4000);
  };

  const faqs = [
    { q: 'How do I update my credit card or payment method?', a: 'Go to My Subscription page and click Update Payment Method to enter new billing details.' },
    { q: 'When will my invoice be generated?', a: 'Invoices are issued automatically on the first day of your monthly or yearly billing cycle.' },
    { q: 'Can I cancel or downgrade my subscription at any time?', a: 'Yes, you can downgrade or cancel anytime without cancellation fees.' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          Customer Support & FAQs
        </h1>
        <p className="text-xs text-secondaryText mt-1">
          Need help with your subscription or invoice? Reach out to our dedicated 24/7 support team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Submit Ticket */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-heading">Submit Support Ticket</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Subject"
              placeholder="e.g. Invoice discrepancy or payment query"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText">
                Message Details
              </label>
              <textarea
                rows={4}
                placeholder="Describe your issue in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-input border border-border text-primaryText text-sm font-medium rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary placeholder:text-mutedText"
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" leftIcon={<Send className="w-4 h-4" />}>
              Submit Support Ticket
            </Button>
          </form>
        </Card>

        {/* FAQs */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <BookOpen className="w-5 h-5 text-success" />
            <h2 className="text-base font-bold text-heading">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-secondary border border-border/50 space-y-1">
                <p className="text-xs font-bold text-heading">{faq.q}</p>
                <p className="text-[11px] text-secondaryText font-medium">{faq.a}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Toast
        isVisible={showToast}
        message="Support ticket submitted! Our team will respond shortly."
        type="success"
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};
