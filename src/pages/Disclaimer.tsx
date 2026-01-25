import { AlertTriangle, TrendingUp, Shield, FileText, Info } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      {/* Header */}
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Disclaimer</h1>
        <p className="text-muted-foreground">Last updated: January 24, 2025</p>
      </div>

      <div className="prose prose-sm max-w-none">
        {/* Important Notice */}
        <div className="p-6 rounded-lg border-2 border-warning bg-warning/5 mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-foreground">
            <AlertTriangle className="h-6 w-6 text-warning" />
            Important Notice
          </h2>
          <p className="text-foreground leading-relaxed font-medium">
            The information provided on AROT.tech (Advanced Research on Options & Traders) is for 
            <strong> informational and educational purposes only</strong>. Nothing on this website 
            should be construed as financial advice, investment advice, trading advice, or any 
            recommendation to buy or sell any financial instruments.
          </p>
        </div>

        <div className="p-6 rounded-lg border border-border bg-card space-y-6">
          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              Trading and Investment Risks
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">
                Trading options, futures, stocks, and other financial instruments involves substantial 
                risk of loss and is not appropriate for all investors. The high degree of leverage 
                can work against you as well as for you. Before deciding to trade any financial 
                instrument, you should carefully consider your investment objectives, level of 
                experience, and risk appetite.
              </p>
              <p className="leading-relaxed">
                <strong className="text-foreground">The possibility exists that you could sustain a 
                loss of some or all of your initial investment.</strong> Therefore, you should not 
                invest money that you cannot afford to lose. You should be aware of all the risks 
                associated with trading and seek advice from an independent financial advisor if 
                you have any doubts.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-primary" />
              No Financial Advice
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>AROT.tech does not provide personalized financial advice</li>
              <li>We are not registered investment advisors, broker-dealers, or financial planners</li>
              <li>The content on this website is not tailored to your individual circumstances</li>
              <li>Any trading strategies, analysis, or signals discussed are for educational purposes only</li>
              <li>We do not guarantee any specific results or returns from using our information</li>
              <li>Past performance of any trading strategy or analysis is not indicative of future results</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              Data and Content Accuracy
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">
                While we strive to provide accurate and timely information, AROT.tech makes no 
                warranties or representations as to the accuracy, completeness, or reliability of 
                any information displayed on this website.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Market data may be delayed and should not be relied upon for real-time trading decisions</li>
                <li>COT (Commitments of Traders) data is sourced from the CFTC and may have inherent limitations</li>
                <li>Gamma exposure calculations are estimates based on publicly available options data</li>
                <li>News and analysis content may contain errors or become outdated</li>
                <li>ETF flow data is estimated from price and volume data and may not reflect actual fund flows</li>
              </ul>
              <p className="leading-relaxed">
                Users are strongly encouraged to verify all information with primary sources before 
                making any financial decisions.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Third-Party Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              AROT.tech may display content from third-party sources, including news articles, 
              market data, and external links. We do not endorse, verify, or guarantee the accuracy 
              of any third-party content. Links to external websites are provided for convenience 
              only and do not constitute an endorsement of those sites or their content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Under no circumstances shall AROT.tech, its owners, operators, affiliates, or 
              contributors be liable for any direct, indirect, incidental, special, consequential, 
              or punitive damages arising from:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
              <li>Your use of or reliance on any information on this website</li>
              <li>Any trading or investment decisions you make</li>
              <li>Any loss of profits, data, or business opportunities</li>
              <li>Any errors, omissions, or inaccuracies in our content</li>
              <li>Any interruption or unavailability of our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Your Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using AROT.tech, you acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-2">
              <li>You are solely responsible for your own investment and trading decisions</li>
              <li>You will perform your own due diligence before taking any financial action</li>
              <li>You understand and accept the risks involved in trading financial instruments</li>
              <li>You will seek professional advice when appropriate</li>
              <li>You are of legal age to access financial content in your jurisdiction</li>
            </ul>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground italic">
              By accessing and using AROT.tech, you acknowledge that you have read, understood, 
              and agree to be bound by this disclaimer. If you do not agree with any part of this 
              disclaimer, please do not use our website or services.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
