import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#6c5ce7] hover:text-[#7c6ff7] transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-[#666] mb-12">Last updated: April 4, 2026</p>

        <div className="space-y-10">
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              By accessing or using the THRYV platform (&quot;Service&quot;), including our
              website, mobile applications, and all related services, you agree to be
              bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these
              Terms, you may not access or use the Service.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed">
              These Terms constitute a legally binding agreement between you and THRYV
              (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We reserve the right to update these
              Terms at any time, and your continued use of the Service following any
              changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* 2. Account Registration */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Account Registration
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              To use certain features of the Service, you must create an account. When
              registering, you agree to provide accurate, current, and complete
              information and to update such information as necessary to keep it
              accurate, current, and complete.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              You are responsible for safeguarding the password associated with your
              account and for all activities that occur under your account. You agree to
              notify us immediately of any unauthorized access to or use of your
              account.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed">
              You must be at least 18 years of age (or the age of majority in your
              jurisdiction) to create an account and use the Service. By creating an
              account, you represent and warrant that you meet this requirement.
            </p>
          </section>

          {/* 3. Subscription & Billing */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Subscription &amp; Billing
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              THRYV offers subscription-based access to its platform. By subscribing,
              you authorize us to charge the applicable subscription fee to your
              designated payment method on a recurring basis (monthly or annually, as
              selected) until you cancel your subscription.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              Subscription fees are billed in advance at the beginning of each billing
              cycle. All fees are non-refundable unless otherwise stated or required by
              applicable law. We reserve the right to change subscription pricing with
              at least 30 days&apos; notice before the next billing cycle.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              Free trials, when offered, will automatically convert to a paid
              subscription at the end of the trial period unless cancelled before the
              trial expires. You will not be charged during the trial period.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed">
              You may cancel your subscription at any time through your account
              settings. Cancellation will take effect at the end of the current billing
              period, and you will continue to have access until that date.
            </p>
          </section>

          {/* 4. Credits */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Credits</h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              THRYV uses a credit-based system for accessing certain content, including
              program activations. Credits are allocated as part of your subscription
              plan and may also be earned through platform engagement (e.g., the
              Momentum system).
            </p>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              Credits have no cash value, are non-transferable, and cannot be exchanged
              for currency. Unused credits may expire at the end of each billing cycle
              depending on your subscription plan.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed">
              We reserve the right to modify the credit system, including the number of
              credits allocated, their value, and expiration policies, at any time with
              reasonable notice.
            </p>
          </section>

          {/* 5. Content License */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Content License
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              All workout programs, instructional videos, written content, graphics,
              logos, and other materials available through the Service
              (&quot;Content&quot;) are owned by THRYV or our content creators and are
              protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              Your subscription grants you a limited, non-exclusive, non-transferable,
              revocable license to access and use the Content for your personal,
              non-commercial fitness training purposes only.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed">
              You may not reproduce, distribute, modify, create derivative works from,
              publicly display, publicly perform, republish, download, store, or
              transmit any Content except as expressly permitted by these Terms. Screen
              recording, scraping, or systematic downloading of Content is strictly
              prohibited.
            </p>
          </section>

          {/* 6. User Conduct */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. User Conduct
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              You agree to use the Service only for lawful purposes and in accordance
              with these Terms. You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#a0a0b8] leading-relaxed mb-3">
              <li>
                Use the Service in any way that violates any applicable law or
                regulation
              </li>
              <li>
                Impersonate or attempt to impersonate another user, person, or entity
              </li>
              <li>
                Engage in any conduct that restricts or inhibits anyone&apos;s use or
                enjoyment of the Service
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the Service, other
                accounts, or computer systems
              </li>
              <li>
                Use any automated means (bots, scrapers, etc.) to access the Service
              </li>
              <li>
                Post or transmit any harassing, defamatory, obscene, or otherwise
                objectionable content in community spaces
              </li>
              <li>
                Share account credentials or allow multiple individuals to use a single
                account
              </li>
            </ul>
            <p className="text-[#a0a0b8] leading-relaxed">
              Violation of these conduct rules may result in immediate suspension or
              termination of your account without refund.
            </p>
          </section>

          {/* 7. Creator Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Creator Terms
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              If you are accepted as a content creator on THRYV, the following
              additional terms apply to you:
            </p>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              You retain ownership of all original content you create and publish on the
              platform. By publishing content, you grant THRYV a worldwide,
              non-exclusive, royalty-free license to host, display, distribute, and
              promote your content within the Service and in marketing materials.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              You represent and warrant that all content you publish is original, does
              not infringe on any third-party rights, and complies with all applicable
              laws. You are solely responsible for the accuracy, safety, and
              appropriateness of your programs and instructional content.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed">
              Creator compensation is determined by engagement metrics as outlined in
              the Creator Agreement. THRYV reserves the right to remove any content that
              violates these Terms or our content guidelines, and to terminate creator
              accounts for repeated violations.
            </p>
          </section>

          {/* 8. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Limitation of Liability
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              The Service, including all content and programs, is provided for
              informational and educational purposes only and does not constitute
              medical advice. You should consult a qualified healthcare provider before
              beginning any exercise program. You use the Service at your own risk.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              To the fullest extent permitted by applicable law, THRYV and its
              directors, officers, employees, agents, and affiliates shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages,
              including but not limited to loss of profits, data, or goodwill, arising
              out of or in connection with your use of or inability to use the Service.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed">
              In no event shall our total liability to you for all claims arising out of
              or relating to the Service exceed the amount you have paid us in the
              twelve (12) months preceding the event giving rise to such liability.
            </p>
          </section>

          {/* 9. Termination */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Termination
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              You may terminate your account at any time by contacting support or
              through your account settings. Upon termination, your right to access the
              Service will cease immediately, and any unused credits will be forfeited.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              We may suspend or terminate your account at any time, with or without
              cause or notice, including but not limited to breach of these Terms. In
              the event of termination for cause, you will not be entitled to any refund
              of prepaid fees.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed">
              Sections of these Terms that by their nature should survive termination
              shall survive, including but not limited to intellectual property
              provisions, disclaimers, limitations of liability, and dispute resolution.
            </p>
          </section>

          {/* 10. Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Changes to Terms
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              We reserve the right to modify these Terms at any time. If we make
              material changes, we will notify you by email or by posting a prominent
              notice on the Service at least 30 days before the changes take effect.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              Your continued use of the Service after the effective date of any changes
              constitutes your acceptance of the revised Terms. If you do not agree with
              the revised Terms, you must stop using the Service and cancel your
              subscription.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed">
              If you have any questions about these Terms, please contact us at{' '}
              <a
                href="mailto:legal@thryv.fit"
                className="text-[#6c5ce7] hover:underline"
              >
                legal@thryv.fit
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-[#2a2a3a]">
          <p className="text-sm text-[#666]">
            &copy; {new Date().getFullYear()} THRYV. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
