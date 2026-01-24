import { FileText, AlertTriangle, Scale, Ban, RefreshCw, Mail } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      {/* Header */}
      <div className="text-center py-8">
        <Scale className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: January 24, 2025</p>
      </div>

      <div className="prose prose-sm max-w-none">
        <div className="p-6 rounded-lg border border-border bg-card space-y-6">
          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              Agreement to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using AROT.tech (the "Service"), you agree to be bound by these Terms 
              of Service ("Terms"). If you disagree with any part of these terms, you may not access 
              the Service. These Terms apply to all visitors, users, and others who access or use 
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              AROT.tech provides financial analytics, market data visualization, and educational 
              content including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
              <li>Gamma exposure (GEX) analytics and visualizations</li>
              <li>Commitments of Traders (COT) report analysis</li>
              <li>ETF fund flow tracking and analysis</li>
              <li>Real-time market news aggregation</li>
              <li>Options market analytics and insights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Financial Disclaimer
            </h2>
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-foreground leading-relaxed font-medium">
                IMPORTANT: The information provided on AROT.tech is for informational and 
                educational purposes only. It should NOT be considered as financial advice, 
                investment advice, trading advice, or any other type of advice.
              </p>
            </div>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
              <li>We do not recommend any specific investments, securities, or trading strategies</li>
              <li>Past performance is not indicative of future results</li>
              <li>Trading involves substantial risk of loss and is not suitable for all investors</li>
              <li>You should consult with a qualified financial advisor before making any investment decisions</li>
              <li>We are not registered investment advisors, brokers, or dealers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Use of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. 
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Use the Service in any way that violates any applicable law or regulation</li>
              <li>Attempt to interfere with or disrupt the Service or servers</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Reproduce, duplicate, copy, sell, or resell any portion of the Service</li>
              <li>Use the Service to transmit harmful code or malware</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service and its original content, features, and functionality are owned by 
              AROT.tech and are protected by international copyright, trademark, patent, trade 
              secret, and other intellectual property laws. Our trademarks may not be used in 
              connection with any product or service without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Data Accuracy</h2>
            <p className="text-muted-foreground leading-relaxed">
              While we strive to provide accurate and timely information, we make no warranties 
              or representations about the accuracy, reliability, completeness, or timeliness of 
              any data displayed on the Service. Market data may be delayed and should not be 
              relied upon for trading decisions. We recommend verifying all information with 
              official sources before taking any action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Ban className="h-5 w-5 text-destructive" />
              Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, AROT.tech shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages, including but 
              not limited to loss of profits, data, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
              <li>Your access to or use of (or inability to use) the Service</li>
              <li>Any trading or investment decisions made based on our content</li>
              <li>Any unauthorized access to or alteration of your data</li>
              <li>Any interruption or cessation of the Service</li>
              <li>Any errors, inaccuracies, or omissions in the content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to defend, indemnify, and hold harmless AROT.tech and its officers, 
              directors, employees, and agents from any claims, damages, obligations, losses, 
              liabilities, costs, or expenses arising from your use of the Service or violation 
              of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Third-Party Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service may contain links to third-party websites or services that are not 
              owned or controlled by AROT.tech. We have no control over and assume no 
              responsibility for the content, privacy policies, or practices of any third-party 
              sites or services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-primary" />
              Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or replace these Terms at any time at our sole 
              discretion. If a revision is material, we will provide at least 30 days' notice 
              prior to any new terms taking effect. Your continued use of the Service after 
              such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law principles. Any disputes arising from these Terms 
              or your use of the Service shall be resolved through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-primary" />
              Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 p-4 rounded-lg bg-surface">
              <p className="text-sm">
                <strong>Email:</strong> legal@arot.tech<br />
                <strong>Website:</strong> https://arot.tech
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
