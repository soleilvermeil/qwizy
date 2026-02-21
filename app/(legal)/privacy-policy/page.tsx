import type { Metadata } from "next";
import Link from "next/link";
import { legalConfig } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy - Open Duolingo",
  description:
    "Privacy policy detailing how Open Duolingo collects, uses, and protects your personal data",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <header>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Privacy Policy
        </h1>
        <p className="text-muted">Last updated: {legalConfig.lastUpdated}</p>
      </header>

      {/* Introduction */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Introduction</h2>
        <p className="text-muted-foreground leading-relaxed">
          This privacy policy explains how Open Duolingo (&quot;the
          Service&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses, and
          protects your personal data when you use our website. We are committed
          to protecting your privacy and processing your data in compliance with
          the General Data Protection Regulation (GDPR, Regulation (EU)
          2016/679) and applicable national legislation.
        </p>
      </section>

      {/* Data Controller */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Data Controller
        </h2>
        <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
          <p>
            <span className="font-medium text-foreground">
              Data Controller:
            </span>{" "}
            <span className="text-warning">{legalConfig.publisherName}</span>
          </p>
          <p>
            <span className="font-medium text-foreground">Email:</span>{" "}
            <span className="text-warning">{legalConfig.publisherEmail}</span>
          </p>
          <p>
            <span className="font-medium text-foreground">Address:</span>{" "}
            <span className="text-warning">{legalConfig.publisherAddress}</span>
          </p>
        </div>
        {/* <p className="text-xs text-muted italic">
          If you are self-hosting this application, you are the data controller
          and must replace the placeholders above with your own information.
        </p> */}
      </section>

      {/* Data Collected */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          What Data We Collect
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We collect and process the minimum amount of data necessary to provide
          the Service. Specifically:
        </p>

        <div className="space-y-4">
          <div className="bg-secondary rounded-xl p-4">
            <h3 className="font-medium text-foreground mb-2">Account Data</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                <span className="font-medium">Username</span> &mdash; chosen by
                you during registration, used to identify your account
              </li>
              <li>
                <span className="font-medium">Password</span> &mdash; stored
                only as a secure, irreversible hash (bcrypt); we never store
                your password in plain text
              </li>
              <li>
                <span className="font-medium">Account creation date</span>
              </li>
              <li>
                <span className="font-medium">Learning preferences</span>{" "}
                &mdash; such as the number of new cards per day
              </li>
            </ul>
          </div>

          <div className="bg-secondary rounded-xl p-4">
            <h3 className="font-medium text-foreground mb-2">
              Learning Progress Data
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                Your review history for each flashcard (dates, intervals,
                ratings)
              </li>
              <li>
                Spaced repetition parameters (stability, difficulty, review
                state, due dates)
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Education Accounts */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Education Accounts
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          This application supports education accounts that are created and
          managed by the instance administrator on behalf of students. If you
          are using an education account, the following applies:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>
            Your account was created by the instance administrator. Your
            username and initial password were set by them.
          </li>
          <li>
            <span className="font-medium">
              Administrators can view your learning progress
            </span>{" "}
            &mdash; including mastery levels, review history, due dates, and
            statistics across all enrolled decks.
          </li>
          <li>
            Administrators can reset your password, manage your account
            settings (such as the number of new cards per day), and control
            which settings you can modify.
          </li>
          <li>
            Education accounts may have restricted access to certain features
            (e.g., browsing public decks) as configured by the administrator.
          </li>
          <li>
            Your account may be assigned to one or more student groups. Group
            membership determines which decks are visible to you.
          </li>
        </ul>
      </section>

      {/* What We Don't Collect */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          What We Do Not Collect
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We do not use any analytics, tracking, or advertising services. In
          particular:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>No third-party analytics (Google Analytics, etc.)</li>
          <li>No advertising trackers or pixels</li>
          <li>No social media tracking scripts</li>
          <li>
            No email address (unless the data controller chooses to add this
            field)
          </li>
          <li>No IP address logging beyond standard server access logs</li>
          <li>
            No text or learning content is sent to third parties &mdash;
            text-to-speech processing is performed entirely in your browser
          </li>
        </ul>
      </section>

      {/* Purpose and Legal Basis */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Purpose and Legal Basis
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-secondary">
                <th className="text-left p-3 font-medium text-foreground">
                  Purpose
                </th>
                <th className="text-left p-3 font-medium text-foreground">
                  Data Used
                </th>
                <th className="text-left p-3 font-medium text-foreground">
                  Legal Basis (GDPR)
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-t border-border">
                <td className="p-3">Account creation and authentication</td>
                <td className="p-3">Username, password hash</td>
                <td className="p-3">
                  Contract performance (Art. 6(1)(b))
                </td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3">
                  Providing spaced repetition learning
                </td>
                <td className="p-3">Learning progress, preferences</td>
                <td className="p-3">
                  Contract performance (Art. 6(1)(b))
                </td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3">Maintaining your session</td>
                <td className="p-3">Session cookie (JWT)</td>
                <td className="p-3">
                  Contract performance (Art. 6(1)(b))
                </td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3">
                  Managing education accounts and monitoring student progress
                </td>
                <td className="p-3">
                  Account data, group membership, learning progress
                </td>
                <td className="p-3">
                  Legitimate interest (Art. 6(1)(f)) / Contract (Art. 6(1)(b))
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Client-Side Storage */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Client-Side Storage
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          In addition to the session cookie described below, the application may
          store the following data locally in your browser. This data never
          leaves your device and is not sent to our servers.
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            <span className="font-medium">TTS engine preference</span> &mdash;
            your choice of text-to-speech engine is saved in your
            browser&apos;s local storage
          </li>
          <li>
            <span className="font-medium">AI voice models</span> &mdash; if
            you enable the high-quality voice option (Piper), AI voice models
            (~15&ndash;60&nbsp;MB each) are downloaded on demand and cached in
            your browser&apos;s Origin Private File System (OPFS). You can
            clear these cached models at any time from the{" "}
            <Link
              href="/settings"
              className="text-primary hover:text-primary-hover underline"
            >
              Settings page
            </Link>
          </li>
        </ul>
      </section>

      {/* Third-Party Connections */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Third-Party Connections
        </h2>

        {legalConfig.dbHostName && (
          <>
            <p className="text-muted-foreground leading-relaxed">
              The database that stores all user data is hosted by a third-party
              provider. This provider acts as a data processor and receives all
              personal data described in this policy.
            </p>
            <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
              <p>
                <span className="font-medium text-foreground">
                  Database host:
                </span>{" "}
                {legalConfig.dbHostName}
              </p>
              {legalConfig.dbHostAddress && (
                <p>
                  <span className="font-medium text-foreground">Address:</span>{" "}
                  {legalConfig.dbHostAddress}
                </p>
              )}
              {legalConfig.dbHostWebsite && (
                <p>
                  <span className="font-medium text-foreground">Website:</span>{" "}
                  {legalConfig.dbHostWebsite}
                </p>
              )}
            </div>
          </>
        )}

        <p className="text-muted-foreground leading-relaxed">
          When the high-quality voice option (Piper) is enabled, your browser
          downloads AI voice model files directly from the following third-party
          services. No personal content (such as text you are learning) is sent
          to these services, but your IP address may be visible to them as part
          of the download request.
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            <span className="font-medium">HuggingFace</span>{" "}
            (huggingface.co) &mdash; hosts the voice model files
          </li>
          <li>
            <span className="font-medium">jsDelivr</span>{" "}
            (cdn.jsdelivr.net) &mdash; hosts the WebAssembly phonemizer
            runtime
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          These connections only occur when Piper voices are used for the first
          time for a given language. Once a model is cached locally, no further
          third-party requests are made for that language. If you use the
          &quot;Browser default&quot; voice option, no third-party connections
          are made.
        </p>
      </section>

      {/* Cookies */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Cookies</h2>
        <p className="text-muted-foreground leading-relaxed">
          We use a single, strictly necessary cookie to maintain your
          authenticated session:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-secondary">
                <th className="text-left p-3 font-medium text-foreground">
                  Cookie Name
                </th>
                <th className="text-left p-3 font-medium text-foreground">
                  Purpose
                </th>
                <th className="text-left p-3 font-medium text-foreground">
                  Duration
                </th>
                <th className="text-left p-3 font-medium text-foreground">
                  Type
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-t border-border">
                <td className="p-3 font-mono">session</td>
                <td className="p-3">
                  Authentication (contains a JSON Web Token with your user ID,
                  username, admin status, and expiration date)
                </td>
                <td className="p-3">7 days</td>
                <td className="p-3">Strictly necessary</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          This cookie is essential for the Service to function and does not
          require consent under the ePrivacy Directive (Art. 5(3) of Directive
          2002/58/EC). We do not use any non-essential, analytics, or
          advertising cookies.
        </p>
      </section>

      {/* Data Storage and Security */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Data Storage and Security
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            All data is stored in a PostgreSQL database. Depending on the
            deployment, the database may be hosted on the same server as the
            application or by a separate database hosting provider
          </li>
          <li>
            Passwords are hashed using bcrypt (12 salt rounds) and cannot be
            recovered
          </li>
          <li>
            Session tokens are signed using cryptographic keys and transmitted
            over HTTPS in production
          </li>
          <li>
            Cookies are set with <code>HttpOnly</code>, <code>Secure</code> (in
            production), and <code>SameSite=Lax</code> flags
          </li>
        </ul>
      </section>

      {/* Data Sharing */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Data Sharing and Transfers
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We do not share, sell, or transfer your personal data to any third
          party. Your data is only accessible to the instance administrator(s)
          who operate the Service. When the database is hosted by a separate
          provider, your personal data is transmitted between the application
          server and the database server; in such cases, the database hosting
          provider acts as a data processor. No data is transferred outside of
          the European Economic Area (EEA) unless the hosting or database
          infrastructure is located outside the EEA, in which case the data
          controller is responsible for ensuring appropriate safeguards (such as
          Standard Contractual Clauses or an adequacy decision).
        </p>
      </section>

      {/* Data Retention */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Data Retention
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Your data is retained for as long as your account exists. When you
          delete your account, all associated data (account information and
          learning progress) is permanently removed from the database.
        </p>
      </section>

      {/* Your Rights */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Your Rights Under GDPR
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Under the General Data Protection Regulation, you have the following
          rights:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-medium">Right of access</span> (Art. 15)
            &mdash; You can request a copy of all personal data we hold about
            you. You can download your data from the{" "}
            <Link
              href="/settings"
              className="text-primary hover:text-primary-hover underline"
            >
              Settings page
            </Link>
            .
          </li>
          <li>
            <span className="font-medium">Right to rectification</span> (Art.
            16) &mdash; You can update your account information from the
            Settings page.
          </li>
          <li>
            <span className="font-medium">Right to erasure</span> (Art. 17)
            &mdash; You can delete your account and all associated data from the{" "}
            <Link
              href="/settings"
              className="text-primary hover:text-primary-hover underline"
            >
              Settings page
            </Link>
            .
          </li>
          <li>
            <span className="font-medium">Right to data portability</span>{" "}
            (Art. 20) &mdash; You can export your data in a machine-readable
            format from the Settings page.
          </li>
          <li>
            <span className="font-medium">Right to restriction</span> (Art. 18)
            &mdash; You can request that we restrict processing of your data
            under certain circumstances.
          </li>
          <li>
            <span className="font-medium">Right to object</span> (Art. 21)
            &mdash; You can object to the processing of your personal data under
            certain circumstances.
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          To exercise any of these rights, you may use the self-service options
          available in the application or contact the data controller at the
          email address listed above.
        </p>
      </section>

      {/* Right to Complain */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Right to Lodge a Complaint
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          If you believe that your data protection rights have been violated,
          you have the right to lodge a complaint with a supervisory authority.
          You may contact the supervisory authority in the EU member state of
          your habitual residence, your place of work, or the place of the
          alleged infringement.
        </p>
      </section>

      {/* Changes */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Changes to This Policy
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We may update this privacy policy from time to time to reflect changes
          in our practices or for legal reasons. The &quot;last updated&quot;
          date at the top of this page indicates when the policy was last
          revised. We encourage you to review this page periodically.
        </p>
      </section>
    </>
  );
}
