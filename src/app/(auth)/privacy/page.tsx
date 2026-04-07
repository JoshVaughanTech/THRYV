import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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

        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#666] mb-12">Last updated: April 4, 2026</p>

        <div className="space-y-10">
          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Information We Collect
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              We collect information that you provide directly to us when you create an
              account, subscribe to our service, complete your profile, or communicate
              with us. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#a0a0b8] leading-relaxed mb-3">
              <li>
                <strong className="text-white">Account Information:</strong> Name,
                email address, password, and profile details
              </li>
              <li>
                <strong className="text-white">Fitness Data:</strong> Workout logs,
                exercise preferences, fitness goals, experience level, and program
                progress
              </li>
              <li>
                <strong className="text-white">Billing Information:</strong> Payment
                method details processed securely through our third-party payment
                processor (Stripe)
              </li>
              <li>
                <strong className="text-white">Communications:</strong> Messages sent
                through program communities, support inquiries, and feedback
              </li>
            </ul>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              We also collect information automatically when you use the Service,
              including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#a0a0b8] leading-relaxed">
              <li>
                <strong className="text-white">Usage Data:</strong> Pages visited,
                features used, workout completion rates, streaks, and Momentum scores
              </li>
              <li>
                <strong className="text-white">Device Information:</strong> Browser
                type, operating system, device type, and screen resolution
              </li>
              <li>
                <strong className="text-white">Log Data:</strong> IP address, access
                times, referring URLs, and error logs
              </li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. How We Use Your Information
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#a0a0b8] leading-relaxed">
              <li>
                Provide, maintain, and improve the Service, including personalized
                program recommendations
              </li>
              <li>
                Process subscriptions, manage billing, and allocate credits to your
                account
              </li>
              <li>
                Track your fitness progress, calculate Momentum scores, and maintain
                streak records
              </li>
              <li>
                Send you transactional communications (e.g., subscription confirmations,
                password resets)
              </li>
              <li>
                Send you marketing communications about new features, programs, and
                promotions (with your consent, where required)
              </li>
              <li>
                Facilitate program communities and social features within the platform
              </li>
              <li>
                Compensate content creators based on aggregated engagement metrics
              </li>
              <li>
                Detect, investigate, and prevent fraudulent or unauthorized activity
              </li>
              <li>
                Analyze usage patterns to improve our platform and develop new features
              </li>
            </ul>
          </section>

          {/* 3. Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Data Sharing
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              We do not sell your personal information. We may share your information in
              the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#a0a0b8] leading-relaxed mb-3">
              <li>
                <strong className="text-white">Service Providers:</strong> We share data
                with trusted third-party providers who assist in operating our Service,
                including Stripe (payment processing), Supabase (database and
                authentication), and analytics providers. These providers are
                contractually obligated to protect your data.
              </li>
              <li>
                <strong className="text-white">Content Creators:</strong> Creators on
                the platform may receive aggregated, anonymized data about how their
                programs are used (e.g., completion rates, average ratings). They do not
                receive your personal information.
              </li>
              <li>
                <strong className="text-white">Legal Requirements:</strong> We may
                disclose your information if required to do so by law, regulation, legal
                process, or governmental request.
              </li>
              <li>
                <strong className="text-white">Business Transfers:</strong> In the event
                of a merger, acquisition, or sale of all or a portion of our assets,
                your information may be transferred as part of that transaction.
              </li>
              <li>
                <strong className="text-white">With Your Consent:</strong> We may share
                your information for other purposes with your explicit consent.
              </li>
            </ul>
          </section>

          {/* 4. Cookies & Tracking */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Cookies &amp; Tracking Technologies
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              We use cookies and similar tracking technologies to operate and improve
              the Service. These include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#a0a0b8] leading-relaxed mb-3">
              <li>
                <strong className="text-white">Essential Cookies:</strong> Required for
                authentication, session management, and core functionality. These cannot
                be disabled.
              </li>
              <li>
                <strong className="text-white">Analytics Cookies:</strong> Help us
                understand how users interact with the Service so we can improve it.
              </li>
              <li>
                <strong className="text-white">Preference Cookies:</strong> Store your
                settings and preferences for a better experience.
              </li>
            </ul>
            <p className="text-[#a0a0b8] leading-relaxed">
              You can control cookie preferences through your browser settings. Note
              that disabling certain cookies may affect the functionality of the
              Service.
            </p>
          </section>

          {/* 5. Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Data Retention
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              We retain your personal information for as long as your account is active
              or as needed to provide the Service. Specifically:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#a0a0b8] leading-relaxed mb-3">
              <li>
                <strong className="text-white">Account Data:</strong> Retained for the
                duration of your account and up to 30 days after deletion to allow for
                account recovery
              </li>
              <li>
                <strong className="text-white">Fitness &amp; Workout Data:</strong>{' '}
                Retained for the duration of your account. You may export your data at
                any time.
              </li>
              <li>
                <strong className="text-white">Billing Records:</strong> Retained for up
                to 7 years as required by tax and financial regulations
              </li>
              <li>
                <strong className="text-white">Usage Logs:</strong> Retained for up to
                12 months for analytics and security purposes
              </li>
            </ul>
            <p className="text-[#a0a0b8] leading-relaxed">
              When you delete your account, we will delete or anonymize your personal
              information within 30 days, except where retention is required by law.
            </p>
          </section>

          {/* 6. Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Your Rights
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              Depending on your jurisdiction, you may have the following rights
              regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#a0a0b8] leading-relaxed mb-3">
              <li>
                <strong className="text-white">Access:</strong> Request a copy of the
                personal data we hold about you
              </li>
              <li>
                <strong className="text-white">Correction:</strong> Request correction
                of inaccurate or incomplete personal data
              </li>
              <li>
                <strong className="text-white">Deletion:</strong> Request deletion of
                your personal data, subject to legal retention requirements
              </li>
              <li>
                <strong className="text-white">Portability:</strong> Request your data
                in a structured, machine-readable format
              </li>
              <li>
                <strong className="text-white">Opt-Out:</strong> Opt out of marketing
                communications at any time by clicking &quot;unsubscribe&quot; in any email or
                updating your notification preferences
              </li>
              <li>
                <strong className="text-white">Restriction:</strong> Request that we
                restrict processing of your personal data in certain circumstances
              </li>
            </ul>
            <p className="text-[#a0a0b8] leading-relaxed">
              To exercise any of these rights, please contact us at{' '}
              <a
                href="mailto:privacy@thryv.fit"
                className="text-[#6c5ce7] hover:underline"
              >
                privacy@thryv.fit
              </a>
              . We will respond to your request within 30 days.
            </p>
          </section>

          {/* 7. Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Children&apos;s Privacy
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              The Service is not intended for individuals under the age of 18 (or the
              age of majority in your jurisdiction). We do not knowingly collect personal
              information from children.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed">
              If we become aware that we have collected personal information from a
              child without parental consent, we will take steps to delete that
              information promptly. If you believe a child has provided us with personal
              information, please contact us at{' '}
              <a
                href="mailto:privacy@thryv.fit"
                className="text-[#6c5ce7] hover:underline"
              >
                privacy@thryv.fit
              </a>
              .
            </p>
          </section>

          {/* 8. Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Changes to This Policy
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              We may update this Privacy Policy from time to time to reflect changes in
              our practices, technology, or legal requirements. If we make material
              changes, we will notify you by email or by posting a prominent notice on
              the Service prior to the changes taking effect.
            </p>
            <p className="text-[#a0a0b8] leading-relaxed">
              We encourage you to review this Privacy Policy periodically. Your
              continued use of the Service after any changes constitutes your acceptance
              of the updated policy.
            </p>
          </section>

          {/* 9. Contact Us */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Contact Us
            </h2>
            <p className="text-[#a0a0b8] leading-relaxed mb-3">
              If you have any questions, concerns, or requests regarding this Privacy
              Policy or our data practices, please contact us:
            </p>
            <div className="rounded-xl border border-[#2a2a3a] bg-[#15151f] p-5 space-y-2">
              <p className="text-[#a0a0b8]">
                <strong className="text-white">Email:</strong>{' '}
                <a
                  href="mailto:privacy@thryv.fit"
                  className="text-[#6c5ce7] hover:underline"
                >
                  privacy@thryv.fit
                </a>
              </p>
              <p className="text-[#a0a0b8]">
                <strong className="text-white">Support:</strong>{' '}
                <a
                  href="mailto:support@thryv.fit"
                  className="text-[#6c5ce7] hover:underline"
                >
                  support@thryv.fit
                </a>
              </p>
            </div>
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
