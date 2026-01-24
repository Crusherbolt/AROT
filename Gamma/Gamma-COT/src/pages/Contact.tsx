import { useState } from 'react';
import { Mail, MessageSquare, Send, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setSubmitted(true);
    toast({
      title: "Message Sent!",
      description: "We'll get back to you as soon as possible.",
    });
    
    // Reset form
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      value: 'support@arot.tech',
      description: 'For general inquiries and support',
    },
    {
      icon: MessageSquare,
      title: 'Feedback',
      value: 'feedback@arot.tech',
      description: 'Share your suggestions and ideas',
    },
    {
      icon: Clock,
      title: 'Response Time',
      value: '24-48 hours',
      description: 'We aim to respond quickly',
    },
  ];

  const faqs = [
    {
      question: 'How often is the data updated?',
      answer: 'Our market data is updated in real-time during market hours. COT reports are updated weekly after CFTC releases.',
    },
    {
      question: 'Is this financial advice?',
      answer: 'No. AROT.tech provides educational and informational content only. Always consult a qualified financial advisor before making investment decisions.',
    },
    {
      question: 'What data sources do you use?',
      answer: 'We aggregate data from multiple sources including CFTC for COT reports, Yahoo Finance for market data, and various news APIs for real-time news.',
    },
    {
      question: 'How can I report a bug or issue?',
      answer: 'Please use the contact form below or email us directly at support@arot.tech with details about the issue you encountered.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-up">
      {/* Header */}
      <div className="text-center py-8">
        <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Have questions about our analytics platform? We'd love to hear from you. 
          Send us a message and we'll respond as soon as possible.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="lg:col-span-1 space-y-4">
          {contactInfo.map((info) => (
            <div 
              key={info.title}
              className="p-5 rounded-lg border border-border bg-card"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <info.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">{info.title}</h3>
                  <p className="text-primary font-mono text-sm">{info.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Send us a Message
            </h2>
            
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-bullish mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                <p className="text-muted-foreground">
                  Your message has been sent successfully. We'll get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Your Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="How can we help you?"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us more about your inquiry..."
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full md:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="p-5 rounded-lg border border-border bg-card"
            >
              <h3 className="font-semibold mb-2">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
