import { Shield, Lock, Eye, FileText, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      {/* Header */}
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: January 24, 2025</p>
      </div>

      <div className="prose prose-sm max-w-none">
        <div className="p-6 rounded-lg border border-border bg-card space-y-6">
          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              AROT.tech ("we," "our," or "us") is committed to protecting your privacy. This Privacy 
              Policy explains how we collect, use, disclose, and safeguard your information when you 
              visit our website arot.tech and use our financial analytics services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-primary" />
              Information We Collect
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-medium text-foreground mb-2">Automatically Collected Information</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>Pages visited and time spent on pages</li>
                  <li>Referring website addresses</li>
                  <li>IP address (anonymized)</li>
                  <li>Device type and screen resolution</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Cookies and Tracking Technologies</h3>
                <p>
                  We use cookies and similar tracking technologies to enhance your experience. These include:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Essential cookies required for website functionality</li>
                  <li>Analytics cookies to understand how visitors use our site</li>
                  <li>Preference cookies to remember your settings</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-primary" />
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>To provide and maintain our financial analytics services</li>
              <li>To improve and personalize your experience on our platform</li>
              <li>To analyze usage patterns and optimize our content</li>
              <li>To detect and prevent technical issues and fraud</li>
              <li>To comply with legal obligations</li>
              <li>To communicate service updates when necessary</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may use third-party services that collect, monitor, and analyze data to help us 
              improve our service. These third parties have their own privacy policies addressing 
              how they use such information:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
              <li>Google Analytics - for website analytics</li>
              <li>Google AdSense - for advertising (if applicable)</li>
              <li>Cloudflare - for security and performance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect 
              your personal information against unauthorized access, alteration, disclosure, or 
              destruction. However, no method of transmission over the Internet is 100% secure, 
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not intended for individuals under the age of 18. We do not knowingly 
              collect personal information from children. If you become aware that a child has 
              provided us with personal data, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any 
              changes by posting the new Privacy Policy on this page and updating the "Last updated" 
              date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-primary" />
              Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please 
              contact us at:
            </p>
            <div className="mt-3 p-4 rounded-lg bg-surface">
              <p className="text-sm">
                <strong>Email:</strong> privacy@arot.tech<br />
                <strong>Website:</strong> https://arot.tech
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
